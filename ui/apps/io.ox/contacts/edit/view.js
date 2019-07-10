/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/contacts/edit/view', [
    'io.ox/backbone/views/extensible',
    'io.ox/backbone/mini-views',
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/contacts/util',
    'io.ox/contacts/api',
    'io.ox/core/api/user',
    'io.ox/core/a11y',
    'io.ox/core/util',
    'io.ox/contacts/widgets/pictureUpload',
    'settings!io.ox/contacts',
    'gettext!io.ox/contacts'
], function (ExtensibleView, common, Dropdown, util, api, userApi, a11y, coreUtil, PhotoUploadView, settings, gt) {

    'use strict';

    var View = ExtensibleView.extend({

        className: 'contact-edit form-horizontal',
        point: 'io.ox/contacts/edit/view',

        events: {
            'click [data-remove]': 'onRemoveField'
        },

        initialize: function (options) {
            // set model
            this.model = new View.ContactModel(options.data);
            // hash to track fields that are currently visible
            this.visible = {};
        },

        extensions: {
            header: function () {
                this.renderHeader();
            },
            fields: function () {
                this.renderAllFields();
            },
            footer: function () {
                this.renderFooter();
            }
        },

        renderHeader: function () {
            this.$el.append(
                $('<div class="header form-group">').append(
                    $('<div class="col-xs-3 col-sm-4">').append(
                        this.renderContactPhoto()
                    ),
                    $('<div class="col-xs-9 col-sm-8 contact-summary">').append(
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
                $h2 = $('<h2 class="hidden-xs">'),
                $h3 = $('<h2 class="hidden-xs">'),
                $h4 = $('<h2 class="hidden-xs">');

            this.listenTo(this.model, 'change:title change:first_name change:last_name', updateName);
            this.listenTo(this.model, 'change:email1 change:email2 change:email3', updateEmail);
            this.listenTo(this.model, 'change:company change:department change:position', updateBusiness);
            this.listenTo(this.model, 'change:city_home change:city_business change:country_home change:country_business', updateLocation);
            // ... and for diabloc testers
            this.listenTo(settings, 'change:fullNameFormat', updateName);

            updateName.call(this);
            updateEmail.call(this);
            updateBusiness.call(this);
            updateLocation.call(this);

            return [$h1, $h2, $h3, $h4];

            function updateName() {
                $h1.empty().append(this.getContactSummaryName());
            }

            function updateEmail() {
                $h2.text(this.getContactSummaryEmail());
            }

            function updateBusiness() {
                $h3.text(this.getContactSummaryBusiness());
            }

            function updateLocation() {
                $h4.text(this.getContactSummaryLocation());
            }
        },

        getContactSummaryName: function () {
            var data = this.model.toJSON();
            return util.getFullName(data, true);
        },

        getContactSummaryEmail: function () {
            var data = this.model.toJSON();
            return data.email1 || data.email2 || data.email3;
        },

        getContactSummaryBusiness: function () {
            var data = this.model.toJSON();
            return [data.company, data.department, data.position].filter(Boolean).join(', ');
        },

        getContactSummaryLocation: function () {
            var data = this.model.toJSON();
            if (data.city_home) return [data.city_home, data.country_home].filter(Boolean).join(', ');
            return [data.city_business, data.country_business].filter(Boolean).join(', ');
        },

        renderField: function (name, callback) {
            var guid = _.uniqueId('contact-field-'),
                label = $('<label class="control-label">').attr('for', guid).text(View.i18n[name] || name),
                visible = this.shouldBeVisible(name),
                maxLength = this.model.getMaxLength(name),
                readonly = this.isReadonly(name),
                length = this.fieldLength[name] || 6,
                offset = 6 - length;
            if (visible) this.visible[name] = true;
            return $('<div class="form-group">')
                .attr('data-field', name)
                .toggleClass('hidden', !visible)
                .append(
                    this.renderLeftColumn(label),
                    this.renderRightColumn(null, length).append(
                        callback.call(this, guid, label)
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
            // return $('<span class="fa-stack" aria-hidden="true">').append(
            //     $('<i class="fa fa-circle fa-stack-2x">'),
            //     $('<i class="fa fa-minus fa-stack-1x">')
            // );
        },

        renderTextField: function (name) {
            return this.renderField(name, function (guid) {
                return new common.InputView({ name: name, model: this.model, id: guid }).render().$el;
            });
        },

        renderBirthday: function () {
            return this.renderField('birthday', function (guid, label) {
                return new common.DateSelectView({ name: 'birthday', model: this.model, label: label }).render().$el;
            });
        },

        renderNote: function () {
            return this.renderField('note', function (guid) {
                return new common.TextView({ name: 'note', model: this.model, id: guid }).render().$el;
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

        isRemovable: function (name) {
            if (this.alwaysVisible[name]) return false;
            if (/^(street|postal_code|city|state|country)_/.test(name)) return false;
            return true;
        },

        isReadonly: function (name) {
            if (this.readonly[name]) return true;
            if (name === 'email1' && this.model.get('folder_id') === 6) return true;
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
                switch (name) {
                    case 'address_home':
                    case 'address_business':
                    case 'address_other':
                        var visible = (this.visible[name] = this.addressHasContent(name));
                        // show address if at least one field has content
                        return this.renderAddress(name).toggleClass('hidden', !visible);
                    case 'birthday':
                        return this.renderBirthday();
                    case 'note':
                        return this.renderNote();
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
                if (this.visible[name]) return;
                if (name === '-') dropdown.divider(); else dropdown.link(name, View.i18n[name]);
            }, this);
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
            department: true,
            email1: true,
            cellular_telephone1: true,
            note: true
        },

        readonly: {
            display_name: true
        },

        allFields: {
            personal: {
                //#. Contact edit dialog. Personal information.
                add: gt('Add personal info'),
                fields: [
                    'title', 'first_name', 'last_name',
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
            other: {
                //#. Contact edit dialog.
                add: gt('Add postal address'),
                fields: [
                    'address_home', 'address_business', 'address_other',
                    'note'
                ]
            }
        },

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
            other: [
                'address_home', 'address_business', 'address_other',
                '-',
                'note'
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

    // add reverse lookup and flat list
    var reverse = {}, all = [];
    _(View.prototype.allFields).each(function (section, sectionName) {
        _(section.fields).each(function (field) {
            reverse[field] = sectionName;
            all.push(field);
        });
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
        // all other
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

    View.ContactModel = Backbone.Model.extend({

        initialize: function (options) {
            this.isUser = options.isUser;
            this.on('change:title change:first_name change:last_name change:company', _.debounce(this.deriveDisplayName));
            this.adddDirtyCheck();
        },

        adddDirtyCheck: function () {

            var dirty = false;

            this.isDirty = function () {
                return dirty;
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
            email1: 512,
            email2: 512,
            email3: 512,
            company: 512,
            note: 5680
        },

        getMaxLength: function (name) {
            return this.maxLength[name] || 64;
        },

        // add missing promise support
        save: function () {
            var promise = Backbone.Model.prototype.save.apply(this, arguments);
            return !promise ? $.Deferred().reject(this.validationError) : promise;
        },

        sync: function (method, module, options) {
            console.log('sync', method, module);
            switch (method) {
                case 'create':
                    return $.when().done(options.success).fail(options.error);
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

            function update() {
                var changes = this.getChanges(), file = this.getFile();
                console.log('sync.update', changes, file);
                if (file) {
                    return this.getApi().editNewImage(this.pick('id', 'folder_id'), changes, file);
                }
                // we need both values to remove the image
                if (changes.image1_url === '') changes.image1 = '';
                // happy debugging: here it's folder, not folder_id, yay.
                var options = _.extend(this.pick('id', 'last_modified'), { folder: this.get('folder_id'), data: changes });
                return this.getApi().update(_.extend(options, { data: changes }));
            }
        },

        getApi: function () {
            var useUserApi = String(this.get('folder_id')) === '6' && String(this.get('id')) === String(ox.user_id);
            return useUserApi ? userApi : api;
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

        validate: function () {
            var r = this.validateFunctions(['validateLength', 'validateAddresses']);
            console.log('validate', r);
            return r;
        },

        validateFunctions: function (array) {
            // false means "good"
            for (var i = 0, fn; fn = array[i]; i++) {
                var result = this[fn]();
                if (result) return result;
            }
            return false;
        },

        validateArray: function (array, callback) {
            var invalid = false, attr = {};
            array.forEach(function (name) {
                this.trigger('valid:' + name);
                var value = this.get(name);
                if (value === undefined || value === null) return;
                var result = callback.call(this, name, value);
                // false means "good"
                if (!result) return;
                invalid = true;
                attr[name] = result;
                this.trigger('invalid:' + name, result);
            }, this);
            return invalid && attr;
        },

        validateLength: function () {
            return this.validateArray(all, function (name, value) {
                if (String(value).length <= this.getMaxLength(name)) return;
                return gt('This value is too long. The allowed length is %2$d characters.', this.getMaxLength(name));
            });
        },

        validateAddresses: function () {
            return this.validateArray(['email1', 'email2', 'email3'], function (name, value) {
                if (coreUtil.isValidMailAddress(value)) return;
                return gt('This is invalid email address.', View.i18n[name]);
            });
        }
    });

    return View;
});
