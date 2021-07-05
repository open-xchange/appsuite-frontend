/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define('io.ox/contacts/edit/view', [
    'io.ox/backbone/views/extensible',
    'io.ox/backbone/mini-views',
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/backbone/mini-views/attachments',
    'io.ox/contacts/util',
    'io.ox/contacts/api',
    'io.ox/core/api/user',
    'io.ox/core/a11y',
    'io.ox/core/util',
    'io.ox/core/capabilities',
    'io.ox/contacts/widgets/pictureUpload',
    'io.ox/core/yell',
    'io.ox/core/extensions',
    'io.ox/core/tk/upload',
    'settings!io.ox/core',
    'settings!io.ox/contacts',
    'gettext!io.ox/contacts',
    'less!io.ox/contacts/style'
], function (ExtensibleView, common, Dropdown, Attachments, util, api, userApi, a11y, coreUtil, capabilities, PhotoUploadView, yell, ext, upload, coreSettings, settings, gt) {

    'use strict';

    var View = ExtensibleView.extend({

        point: 'io.ox/contacts/edit/view',
        className: 'contact-edit form-horizontal',

        events: {
            'click [data-remove]': 'onRemoveField'
        },

        initialize: function (options) {
            // set model
            this.model = new View.ContactModel(options.data);
            // hash to track fields that are currently visible
            this.visible = {};
            // hash to track fields that are disabled (not supported etc)
            this.disabled = {};
            // enable private flag when capability is there and it's not usermode or public folders
            if (!capabilities.has('read_create_shared_folders') || this.model.isUserMode() || options.isPublic) {
                this.disabled.private_flag = true;
            }
        },

        extensions: {
            header: function () {
                this.renderHeader();
            },
            fields: function () {
                this.renderAllFields();
            },
            attachments: function () {
                // Remove attachment handling when infostore is not present or if user data is used instead of contact data
                if (!coreSettings.get('features/PIMAttachments', capabilities.has('filestore')) || this.model.isUserMode()) return;
                this.renderAttachments();
                this.renderDropzone();
            },
            footer: function () {
                this.renderFooter();
            }
        },

        renderHeader: function () {
            this.$el.append(
                $('<div class="contact-header form-group">').append(
                    $('<div class="col-xs-3 col-sm-4">').append(
                        this.renderContactPhoto()
                    ),
                    $('<div class="col-xs-9 col-sm-6 height-100">').append(
                        this.renderContactSummary()
                    )
                )
            );
        },

        renderFooter: function () {
        },

        renderLeftColumn: function (node) {
            return (node || $('<div>')).addClass('col-xs-12 col-sm-4');
        },

        renderRightColumn: function (node, n) {
            return (node || $('<div>')).addClass('col-xs-10 col-sm-' + (n || 8));
        },

        renderRightShortColumn: function (node) {
            return (node || $('<div>')).addClass('col-xs-10 col-sm-6');
        },

        renderRightColumnWithOffset: function (node, n) {
            return this.renderRightColumn(node, n).addClass('col-xs-offset-0 col-sm-offset-4');
        },

        renderRightShortColumnWithOffset: function (node) {
            return this.renderRightShortColumn(node).addClass('col-xs-offset-0 col-sm-offset-4');
        },

        renderContactPhoto: function () {
            return new PhotoUploadView({ model: this.model }).render().$el;
        },

        renderContactSummary: function () {

            var $h1 = $('<h1>'),
                $h2 = $('<h2 class="business hidden-xs">'),
                $h3 = $('<h2 class="location hidden-xs">');

            this.listenTo(this.model, 'change:title change:first_name change:last_name change:company change:yomiFirstName change:yomiLastName change:yomiCompany', updateName);
            this.listenTo(this.model, 'change:company change:department change:position', updateBusiness);
            this.listenTo(this.model, 'change:city_home change:city_business change:country_home change:country_business', updateLocation);
            // ... and for diabloc testers
            this.listenTo(settings, 'change:fullNameFormat', updateName);

            updateName.call(this);
            updateBusiness.call(this);
            updateLocation.call(this);

            return $('<div class="contact-summary">').append($h1, $h2, $h3);

            function updateName() {
                // a11y: headings must not be empty, therefore toggle()
                var nodes = util.getFullNameWithFurigana(this.model.toJSON());
                $h1.empty().toggle(!!nodes.length).append(nodes);
            }

            function updateBusiness() {
                var value = util.getSummaryBusiness(this.model.toJSON());
                $h2.toggle(!!value).text(value);
            }

            function updateLocation() {
                var value = util.getSummaryLocation(this.model.toJSON());
                $h3.toggle(!!value).text(value);
            }
        },

        renderField: function (name, callback) {
            var guid = _.uniqueId('contact-field-'),
                label = $('<label class="control-label">').attr('for', guid).text(View.i18n[name] || name),
                visible = this.shouldBeVisible(name),
                maxLength = this.model.getMaxLength(name),
                readonly = this.isReadonly(name),
                length = this.fieldLength[name] || 6,
                offset = 6 - length,
                node = this.renderRightColumn(null, length);

            if (visible) this.visible[name] = true;
            return $('<div class="form-group">')
                .attr('data-field', name)
                .toggleClass('hidden', !visible)
                .append(
                    this.renderLeftColumn(label),
                    node.append(
                        callback.call(this, guid, label, node)
                            .attr('maxlength', maxLength)
                            .attr('readonly', readonly || null),
                        new common.ErrorView({ model: this.model, name: name }).render().$el
                    ),
                    this.renderRemoveButton(name).addClass('col-sm-offset-' + offset)
                );
        },

        renderRemoveButton: function (name) {
            if (!this.isRemovable(name)) return $();
            return $('<div class="col-xs-2">').append(
                $('<button type="button" class="btn btn-link remove">')
                    .attr('title', gt('Remove field'))
                    .attr('data-remove', name)
                    .append(this.renderRemoveIcon())
            );
        },

        renderRemoveIcon: function () {
            return $('<i class="fa fa-minus-circle">');
        },

        renderTextField: function (name) {
            return this.renderField(name, function (guid) {
                return new common.InputView({ name: name, model: this.model, id: guid, validate: false }).render().$el;
            });
        },

        renderDate: function (name) {
            return this.renderField(name, function (guid, label) {
                return new common.DateSelectView({ name: name, model: this.model, label: label }).render().$el;
            });
        },

        renderNote: function () {
            return this.renderField('note', function (guid) {
                return new common.TextView({ name: 'note', model: this.model, id: guid, validate: false }).render().$el;
            });
        },

        renderPrivateFlag: function () {
            return this.renderField('private_flag', function (guid, label, node) {
                label.addClass('sr-only');
                node.addClass('col-xs-offset-0 col-sm-offset-4');
                return new common.CustomCheckboxView({ name: 'private_flag', label: gt('This contact is private and cannot be shared'), model: this.model, id: guid }).render().$el;
            });
        },

        shouldBeVisible: function (name) {
            // either always visible or has value
            return this.alwaysVisible[name] || this.fieldHasContent(name);
        },

        fieldHasContent: function (name) {
            return !!this.model.get(name);
        },

        addressHasContent: function (name) {
            return _(this.sets[name]).any(this.fieldHasContent, this);
        },

        showDisplayName: function () {
            // show display_name only if display_name is set
            // but first name, last name, and company are all empty
            if (this.model.get('first_name')) return false;
            if (this.model.get('last_name')) return false;
            if (this.model.get('company')) return false;
            if (!this.model.get('display_name')) return false;
            return true;
        },

        isRemovable: function (name) {
            if (this.alwaysVisible[name]) return false;
            if (name === 'display_name') return false;
            if (/^(street|postal_code|city|state|country)_/.test(name)) return false;
            return true;
        },

        isReadonly: function (name) {
            if (this.readonly[name]) return true;
            if (name === 'email1' && String(this.model.get('folder_id')) === '6') return true;
            return false;
        },

        renderAllFields: function () {

            this.$el.append(
                _(this.allFields).map(renderSection, this)
            );

            function renderSection(section, name) {
                var $section = $('<div class="section">').attr('data-section', name).append(
                    _(section.fields.map(renderField, this)).flatten()
                );
                // add dropdown to add fields
                $section.append(this.renderDropdown(name, section.add));
                return $section;
            }

            function renderField(name) {

                if (this.disabled[name]) return '';
                var visible;
                switch (name) {
                    case 'address_home':
                    case 'address_business':
                    case 'address_other':
                        // show address if at least one field has content
                        visible = (this.visible[name] = this.addressHasContent(name));
                        return this.renderAddress(name).toggleClass('hidden', !visible);
                    case 'birthday':
                    case 'anniversary':
                        return this.renderDate(name);
                    case 'note':
                        return this.renderNote();
                    case 'display_name':
                        // show display name in special case
                        visible = (this.visible[name] = this.showDisplayName());
                        return this.renderTextField(name).toggleClass('hidden', !visible);
                    case 'private_flag':
                        return this.renderPrivateFlag();
                    default:
                        return this.renderTextField(name);
                }
            }
        },

        renderAddress: function (name) {
            var title = View.i18n[name];
            return $('<fieldset class="address">').attr('data-address', name).append(
                $('<legend class="sr-only">').text(title),
                $('<div class="form-group">').append(
                    this.renderRightShortColumnWithOffset()
                        .addClass('section-title').attr('aria-hidden', true).text(title),
                    this.renderRemoveButton(name)
                ),
                this.sets[name].map(function (name) {
                    // never hide address fields individually
                    return this.renderTextField(name).removeClass('hidden');
                }, this)
            );
        },

        renderDropdown: function (name, title) {
            var label = $('<i class="fa fa-plus-circle" aria-hidden="true">').add($.txt(title)),
                dropdown = new Dropdown({ label: label, caret: true, buttonToggle: true });
            this.renderDropdownOptions(dropdown, name);
            this.listenTo(dropdown, 'click', this.onAddField.bind(this, dropdown, name));
            return $('<div class="form-group">').append(
                this.renderRightColumnWithOffset().append(
                    dropdown.render().$el.attr('data-add', name)
                )
            );
        },

        renderDropdownOptions: function (dropdown, section) {
            dropdown.$ul.empty();
            _(this.sections[section]).each(function (name) {
                if (this.visible[name] || this.disabled[name]) return;
                if (name === '-') dropdown.divider(); else dropdown.link(name, View.i18n[name]);
            }, this);
            // hide/show dropdown bades on number of options left in the dropdown
            dropdown.$el.toggle(!!dropdown.$ul.children().filter(':not(.divider)').length);
        },

        renderAttachments: function () {

            this.attachments = {
                list: new Attachments.ListView({
                    model: this.model,
                    module: 7,
                    changeCallback: propagateAttachmentChange
                }),
                upload: new Attachments.UploadView({
                    model: this.model
                })
            };

            this.$el.append(
                $('<div class="section">').attr('data-section', 'attachments').append(
                    this.renderField('attachments', function (guid) {
                        return $('<span>').append(
                            this.attachments.list.render().$el.attr('id', guid),
                            this.attachments.upload.render().$el
                        );
                    })
                )
            );

            function propagateAttachmentChange(model, errors) {

                var id = model.get('id'),
                    folder_id = model.get('folder_id'),
                    // check for recently updated attachments
                    useCache = !model.attachments();

                // TODO: move to listview
                if (errors.length > 0) {
                    _(errors).each(function (error) {
                        yell('error', error.error);
                    });
                }

                return api.get({ id: id, folder: folder_id }, useCache).then(function (data) {
                    if (useCache) return $.when();
                    return $.when(
                        api.caches.get.add(data),
                        api.caches.all.grepRemove(folder_id + api.DELIM),
                        api.caches.list.remove({ id: id, folder: folder_id }),
                        api.clearFetchCache()
                    )
                    .done(function () {
                        // to make the detailview remove the busy animation:
                        api.trigger('update:' + _.ecid(data));
                        api.trigger('refresh.list');
                    });
                });
            }
        },

        renderDropzone: function () {

            var POINTID = 'io.ox/contacts/edit/dnd/actions',
                SCROLLABLE = '.window-content',
                Dropzone = upload.dnd.FloatingDropzone.extend({
                    getDimensions: function () {
                        var node = this.$el.closest(SCROLLABLE),
                            top = node.scrollTop(),
                            height = node.outerHeight();
                        return {
                            'top': top,
                            'bottom': 0,
                            'height': height
                        };
                    }
                });

            ext.point(POINTID).extend({
                id: 'attachment',
                index: 100,
                label: gt('Drop here to upload a <b class="dndignore">new attachment</b>'),
                action: this.attachments.list.addFile.bind(this.attachments.list)
            });

            this.$el.parent().append(
                new Dropzone({ point: POINTID, scrollable: SCROLLABLE }).render().$el
            );
        },

        onAddField: function (dropdown, section, data) {
            var name = data.name;
            // skip on empty selection
            if (!name) return;
            // treat addresses differently
            if (this.isAddress(name)) this.showAddress(name); else this.showField(name);
            this.focusField(name);
            this.renderDropdownOptions(dropdown, section);
        },

        showField: function (name) {
            this.$('[data-field="' + name + '"]').removeClass('hidden')
                .closest('.section').removeClass('hidden');
            this.visible[name] = true;
        },

        showAddress: function (name) {
            this.$('[data-address="' + name + '"]').removeClass('hidden');
            this.visible[name] = true;
        },

        focusField: function (name) {
            this.$('[data-field="' + name + '"], [data-address="' + name + '"]')
                .find('.form-control:first').focus();
        },

        isSet: function (name) {
            return !!this.sets[name];
        },

        isAddress: function (name) {
            return /^address_/.test(name);
        },

        resolveSet: function (name) {
            return this.sets[name] || [name];
        },

        onRemoveField: function (e) {
            var node = $(e.currentTarget),
                name = node.attr('data-remove');
            // treat addresses differently
            if (this.isAddress(name)) this.hideAddress(name); else this.hideField(name);
            // update dropdown and save focus
            var section = reverse[name],
                dropdown = this.$('[data-add="' + section + '"]').data('view');
            this.renderDropdownOptions(dropdown, section);
            dropdown.$toggle.focus();
        },

        hideField: function (name) {
            this.$('[data-field="' + name + '"]').addClass('hidden');
            // let's see whether we need empty string, null, or model.unset;
            // so far empty string seems to be the right choice
            this.model.set(name, '');
            this.visible[name] = false;
        },

        hideAddress: function (name) {
            this.$('[data-address="' + name + '"]').addClass('hidden');
            this.resolveSet(name).forEach(function (name) {
                this.model.set(name, '');
            }, this);
            this.visible[name] = false;
        },

        alwaysVisible: {
            first_name: true,
            last_name: true,
            company: true,
            yomiFirstName: true,
            yomiLastName: true,
            yomiCompany: true,
            department: true,
            email1: true,
            cellular_telephone1: true,
            note: true,
            attachments: true,
            private_flag: true
        },

        readonly: {
            display_name: true
        },

        allFields: {
            personal: {
                //#. Contact edit dialog. Personal information.
                add: gt('Add personal info'),
                fields: [
                    'title', 'first_name', 'last_name', 'display_name',
                    'nickname', 'second_name', 'suffix',
                    'birthday', 'anniversary',
                    'marital_status', 'number_of_children', 'url'
                ]
            },
            business: {
                //#. Contact edit dialog. Business information.
                add: gt('Add business info'),
                fields: [
                    'company', 'department', 'position', 'profession', 'manager_name',
                    'room_number', 'assistant_name',
                    'employee_type', 'number_of_employees', 'sales_volume', 'tax_id',
                    'commercial_register', 'branches', 'business_category', 'info'
                ]
            },
            // email, messaging, and phone numbers
            communication: {
                //#. Contact edit dialog.
                //#. Short for: Add email address, phone number, fax number.
                add: gt('Add email, phone, fax'),
                fields: [
                    'email1', 'email2', 'email3',
                    'instant_messenger1', 'instant_messenger2',
                    'cellular_telephone1', 'cellular_telephone2',
                    'telephone_business1', 'telephone_business2',
                    'telephone_home1', 'telephone_home2',
                    'telephone_company', 'telephone_other',
                    'telephone_car', 'telephone_isdn', 'telephone_pager',
                    'telephone_primary', 'telephone_radio',
                    'telephone_telex', 'telephone_ttytdd',
                    'telephone_ip', 'telephone_assistant', 'telephone_callback',
                    'fax_business', 'fax_home', 'fax_other'
                ]
            },
            addresses: {
                //#. Contact edit dialog.
                add: gt('Add postal address'),
                fields: [
                    'address_home', 'address_business', 'address_other'
                ]
            },
            other: {
                //#. Contact edit dialog.
                add: gt('Add additional info'),
                fields: [
                    'note',
                    'private_flag'
                ]
            },
            userfields: {
                //#. Contact edit dialog.
                add: gt('Add user fields'),
                fields: [
                    'userfield01', 'userfield02', 'userfield03',
                    'userfield04', 'userfield05', 'userfield06',
                    'userfield07', 'userfield08', 'userfield09',
                    'userfield10', 'userfield11', 'userfield12',
                    'userfield13', 'userfield14', 'userfield15',
                    'userfield16', 'userfield17', 'userfield18',
                    'userfield19', 'userfield20'
                ]
            }
        },

        // needed to draw dropdown options
        sections: {
            personal: [
                'title', 'first_name', 'last_name',
                'nickname', 'second_name', 'suffix',
                '-',
                'birthday', 'anniversary',
                'marital_status', 'number_of_children', 'url'
            ],
            business: [
                'company', 'department', 'position', 'profession',
                '-',
                'room_number', 'manager_name', 'assistant_name'
            ],
            communication: [
                'email1', 'email2', 'email3',
                'instant_messenger1', 'instant_messenger2',
                '-',
                'cellular_telephone1', 'cellular_telephone2',
                'telephone_business1', 'telephone_business2',
                'telephone_home1', 'telephone_home2',
                'telephone_company', 'telephone_other',
                '-',
                'fax_business', 'fax_home', 'fax_other'
            ],
            addresses: ['address_home', 'address_business', 'address_other'],
            other: [
                'note',
                'private_flag'
            ],
            userfields: [
                'userfield01', 'userfield02', 'userfield03',
                'userfield04', 'userfield05', 'userfield06',
                'userfield07', 'userfield08', 'userfield09',
                'userfield10', 'userfield11', 'userfield12',
                'userfield13', 'userfield14', 'userfield15',
                'userfield16', 'userfield17', 'userfield18',
                'userfield19', 'userfield20'
            ]
        },

        sets: {
            address_home: ['street_home', 'postal_code_home', 'city_home', 'state_home', 'country_home'],
            address_business: ['street_business', 'postal_code_business', 'city_business', 'state_business', 'country_business'],
            address_other: ['street_other', 'postal_code_other', 'city_other', 'state_other', 'country_other']
        },

        fieldLength: {
            number_of_children: 3,
            room_number: 3,
            postal_code_home: 3,
            postal_code_business: 3,
            postal_code_other: 3
        }
    });


    // add support for yomi fields (Japanese)
    if (ox.locale === 'ja_JP' || settings.get('features/furigana', false)) {
        View.prototype.allFields.personal.fields
            .splice(1, 2, 'yomiLastName', 'last_name', 'yomiFirstName', 'first_name');
        View.prototype.allFields.business.fields.unshift('yomiCompany');
    }

    // add reverse lookup and flat list
    var reverse = {}, all = [];
    _(View.prototype.allFields).each(function (section, sectionName) {
        _(section.fields).each(function (field) {
            reverse[field] = sectionName;
            all.push(field);
        });
    });
    _(View.prototype.sets).each(function (set) {
        _(set).each(all.push.bind(all));
    });

    View.i18n = {
        // personal
        title: gt.pgettext('salutation', 'Title'),
        display_name: gt('Display name'),
        first_name: gt('First name'),
        last_name: gt('Last name'),
        second_name: gt('Middle name'),
        suffix: gt('Suffix'),
        birthday: gt('Date of birth'),
        marital_status: gt('Marital status'),
        number_of_children: gt('Children'),
        nickname: gt('Nickname'),
        spouse_name: gt('Spouse\'s name'),
        anniversary: gt('Anniversary'),
        private_flag: '',
        // messaging
        email1: gt('Email 1'),
        email2: gt('Email 2'),
        email3: gt('Email 3'),
        instant_messenger1: gt('Instant Messenger 1'),
        instant_messenger2: gt('Instant Messenger 2'),
        url: gt('URL'),
        // job
        company: gt('Company'),
        profession: gt('Profession'),
        department: gt('Department'),
        position: gt('Position'),
        employee_type: gt('Employee type'),
        room_number: gt('Room number'),
        number_of_employees: gt('Employee ID'),
        sales_volume: gt('Sales Volume'),
        tax_id: gt('TAX ID'),
        commercial_register: gt('Commercial Register'),
        branches: gt('Branches'),
        business_category: gt('Business category'),
        info: gt('Info'),
        manager_name: gt('Manager'),
        assistant_name: gt('Assistant'),
        // phone
        cellular_telephone1: gt('Cell phone'),
        cellular_telephone2: gt('Cell phone (alt)'),
        telephone_business1: gt('Phone (business)'),
        telephone_business2: gt('Phone (business alt)'),
        telephone_callback: gt('Telephone callback'),
        telephone_car: gt('Phone (car)'),
        telephone_company: gt('Phone (company)'),
        telephone_home1: gt('Phone (home)'),
        telephone_home2: gt('Phone (home alt)'),
        telephone_other: gt('Phone (other)'),
        telephone_isdn: gt('Telephone (ISDN)'),
        telephone_pager: gt('Pager'),
        telephone_primary: gt('Telephone primary'),
        telephone_radio: gt('Telephone radio'),
        telephone_telex: gt('Telex'),
        telephone_ttytdd: gt('TTY/TDD'),
        telephone_ip: gt('IP phone'),
        telephone_assistant: gt('Phone (assistant)'),
        fax_home: gt('Fax (Home)'),
        fax_business: gt('Fax'),
        fax_other: gt('Fax (alt)'),
        // home
        address_home: gt('Home address'),
        street_home: gt('Street'),
        postal_code_home: gt('Postcode'),
        city_home: gt('City'),
        state_home: gt('State'),
        country_home: gt('Country'),
        // business
        address_business: gt('Business address'),
        street_business: gt('Street'),
        postal_code_business: gt('Postcode'),
        city_business: gt('City'),
        state_business: gt('State'),
        country_business: gt('Country'),
        // other
        address_other: gt('Other address'),
        street_other: gt('Street'),
        city_other: gt('City'),
        postal_code_other: gt('Postcode'),
        state_other: gt('State'),
        country_other: gt('Country'),
        //#. Notes on a contact in the address book.
        //#. Like in "adding a note". "Notizen" in German, for example.
        note: gt.pgettext('contact', 'Note'),
        // yomi
        yomiFirstName: gt('Furigana for first name'),
        yomiLastName: gt('Furigana for last name'),
        yomiCompany: gt('Furigana for company'),
        // all other
        attachments: gt('Attachments'),
        image1: gt('Image 1'),
        userfield01: gt('Optional 01'),
        userfield02: gt('Optional 02'),
        userfield03: gt('Optional 03'),
        userfield04: gt('Optional 04'),
        userfield05: gt('Optional 05'),
        userfield06: gt('Optional 06'),
        userfield07: gt('Optional 07'),
        userfield08: gt('Optional 08'),
        userfield09: gt('Optional 09'),
        userfield10: gt('Optional 10'),
        userfield11: gt('Optional 11'),
        userfield12: gt('Optional 12'),
        userfield13: gt('Optional 13'),
        userfield14: gt('Optional 14'),
        userfield15: gt('Optional 15'),
        userfield16: gt('Optional 16'),
        userfield17: gt('Optional 17'),
        userfield18: gt('Optional 18'),
        userfield19: gt('Optional 19'),
        userfield20: gt('Optional 20')
    };

    function transformValidation(errors) {
        return {
            error: _.map(errors, function (value, key) {
                return (View.i18n[key] || key) + ': ' + value;
            }).join('\n')
        };
    }

    View.ContactModel = Backbone.Model.extend({

        initialize: function (options) {
            this.isUser = options.isUser;
            this.initialValues = _.omit(options, 'isUser');
            this.on('change:title change:first_name change:last_name change:company', _.debounce(this.deriveDisplayName));
            this.addDirtyCheck();
            this.on('change', _.debounce(this.validate));
        },

        toJSON: function () {
            // whitelist approach
            var names = _(View.i18n).keys().concat('id', 'folder_id', 'image1_url');
            return _(this.attributes).pick(names);
        },

        addDirtyCheck: function () {
            // supports case: add to addressbook
            var dirty = !_.isEmpty(_.omit(this.initialValues, 'id', 'folder_id'));

            this.isDirty = function () {
                return dirty;
            };

            this.resetDirty = function () {
                dirty = false;
            };

            this.on('change', function () {
                if (this.changed.display_name) return;
                dirty = true;
            });

            this.on('save:success', function () {
                // to avoid race conditions
                // we define that the model never gets dirty anymore
                this.isDirty = _.constant(false);
            });
        },

        deriveDisplayName: function () {
            this.set('display_name', util.getFullName(this.toJSON()));
        },

        // add missing promise support
        save: function () {
            var promise = Backbone.Model.prototype.save.apply(this, arguments);
            return !promise ? $.Deferred().reject(transformValidation(this.validationError)) : promise;
        },

        sync: function (method, module, options) {
            switch (method) {
                case 'create':
                    return create.call(this)
                        .done(this.set.bind(this))
                        .done(this.trigger.bind(this, 'save:success'))
                        .fail(this.trigger.bind(this, 'save:fail'))
                        .done(options.success)
                        .fail(options.error);
                case 'read':
                    return this.getApi().get(this.pick('id', 'folder_id'))
                        .done(function (data) {
                            this.initialValues = data;
                        }.bind(this))
                        .done(options.success).fail(options.error);
                case 'update':
                    return update.call(this)
                        .done(this.trigger.bind(this, 'save:success'))
                        .fail(this.trigger.bind(this, 'save:fail'))
                        .done(options.success)
                        .fail(options.error);
                // no default
            }

            function create() {
                var file = this.getFile();
                return this.getApi().create(this.toJSON(), file);
            }

            function update() {
                var changes = this.getChanges(), file = this.getFile(), attachments = this.attachments();
                if (file) return this.getApi().editNewImage(this.pick('id', 'folder_id'), changes, file);
                // we need both values to remove the image
                if (changes.image1_url === '') changes.image1 = '';
                // happy debugging: here it's folder, not folder_id, yay.
                var options = _.extend(this.pick('id', 'last_modified'), { folder: this.get('folder_id'), attachments: attachments, data: changes });
                return this.getApi().update(_.extend(options, { data: changes }));
            }
        },

        isUserMode: function () {
            // 6 is gab 16 is guest user
            return (String(this.get('folder_id')) === '6' || String(this.get('folder_id')) === '16') && String(this.get('id')) === String(ox.user_id);
        },

        getApi: function () {
            return this.isUserMode() ? userApi : api;
        },

        getChanges: function () {
            var changes = {}, attr = this.attributes, initial = this.initialValues, count = 0;
            all.concat('image1_url').forEach(function (name) {
                if (_.isEqual(attr[name], initial[name])) return;
                changes[name] = attr[name];
                count++;
            });
            return count === 1 && 'display_name' in changes ? {} : changes;
        },

        getFile: function () {
            return this.get('pictureFileEdited') || this.get('pictureFile') || undefined;
        },

        // track pending attachments
        attachments: function (value) {
            // getter
            if (_.isUndefined(value)) return !!this._attachments;
            // setter
            this.trigger('pending', value);
            // shared api variable as workaround for detail view (progrss bar in detail View)
            this._attachments = api.pendingAttachments[_.ecid(this.toJSON())] = value;
        },

        validate: function () {
            var errors = this.validateFunctions(['validateLength', 'validateAddresses']);
            _(this.toJSON()).each(function (value, name) {
                var error = errors[name];
                this.trigger((error ? 'invalid' : 'valid') + ':' + name, error);
            }, this);
            return errors;
        },

        validateFunctions: function (array) {
            var errors = {},
                attrs = this.toJSON();
            for (var i = 0, fn; fn = array[i]; i++) {
                var result = this[fn](attrs);
                if (result) _.extend(errors, result);
            }
            // false means "good"
            return _.isEmpty(errors) ? false : errors;
        },

        validateArray: function (array, data, callback) {
            var invalid = false, attr = {};
            array.forEach(function (name) {
                var value = data[name];
                if (value === undefined || value === null) return;
                var result = callback.call(this, name, value);
                // false means "good"
                if (!result) return;
                invalid = true;
                attr[name] = result;
            }, this);
            return invalid && attr;
        },

        validateLength: function (data) {
            return this.validateArray(_.flatten(all), data, function (name, value) {
                if (String(value).length <= this.getMaxLength(name)) return;
                return gt('This value is too long. The allowed length is %1$d characters.', this.getMaxLength(name));
            });
        },

        validateAddresses: function (data) {
            return this.validateArray(['email1', 'email2', 'email3'], data, function (name, value) {
                if (coreUtil.isValidMailAddress(value)) return;
                return gt('This is an invalid email address.', View.i18n[name]);
            });
        },

        // limits are defined by db
        maxLength: {
            // most fields have a maxlength of 64
            first_name: 128,
            last_name: 128,
            position: 128,
            tax_id: 128,
            url: 256,
            profession: 256,
            street_home: 256,
            street_other: 256,
            street_business: 256,
            display_name: 320,
            email1: 512,
            email2: 512,
            email3: 512,
            company: 512,
            note: 5680
        },

        getMaxLength: function (name) {
            return this.maxLength[name] || 64;
        }
    });

    return View;
});
