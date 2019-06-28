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
    'io.ox/contacts/util',
    'io.ox/core/a11y',
    'settings!io.ox/contacts',
    'gettext!io.ox/contacts'
], function (ExtensibleView, common, util, a11y, settings, gt) {

    'use strict';

    var View = ExtensibleView.extend({

        className: 'contact-edit form-horizontal',
        point: 'io.ox/contacts/edit/view',

        events: {
            'click [data-remove]': 'onRemoveField'
        },

        // we use the constructor here not to collide with initialize()
        constructor: function () {
            // hash to track fields that are currently visible
            this.visible = {};
            // dropdown (keep ref since outside of view)
            this.$select = $('<select name="add-field" class="form-control">');
            // the original constructor will call initialize()
            ExtensibleView.prototype.constructor.apply(this, arguments);
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
                $('<div class="prototype">')
                    .on('click', function () { this.$('.prototype').remove(); }.bind(this))
                    .text('Just a prototype'),
                $('<div class="header form-group">').append(
                    this.renderLeftColumn().append(
                        this.renderContactPicture()
                    ),
                    this.renderRightColumn().addClass('contact-summary').append(
                        this.renderContactSummary()
                    )
                )
            );
        },

        renderFooter: function () {
            this.$el.append(
                $('<div class="prototype prototype-bottom">')
            );
        },

        renderLeftColumn: function (node) {
            return (node || $('<div>')).addClass('col-md-4');
        },

        renderRightColumn: function (node, n) {
            return (node || $('<div>')).addClass('col-md-' + (n || 8));
        },

        renderRightShortColumn: function (node) {
            return this.renderRightColumn(node, 6);
        },

        renderContactPicture: function () {

            var $el = $('<div class="contact-picture" aria-hidden="true">');
            this.listenTo(this.model, 'change:image1_url', updateImage);
            updateImage.call(this);
            return $el;

            function updateImage() {
                var url = this.getPictureUrl();
                $el.text(url ? '' : gt('Click to add photo')).css('background-image', url || 'none');
            }
        },

        getPictureUrl: function () {
            var url = util.getImage(this.model.get('image1_url'));
            return url ? 'url(' + url + ')' : '';
        },

        renderContactSummary: function () {

            var $h1 = $('<h1>'), $h2 = $('<h2>'), $h3 = $('<h2>'), $h4 = $('<h2>');

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
                label = $('<label class="control-label">').attr('for', guid).text(this.i18n[name] || name),
                visible = this.shouldBeVisible(name),
                readonly = this.isReadonly(name);
            if (visible) this.visible[name] = true;
            return $('<div class="form-group">')
                .attr('data-field', name)
                .toggleClass('hidden', !visible)
                .append(
                    this.renderLeftColumn(label),
                    this.renderRightShortColumn().append(
                        callback.call(this, guid, label).attr('readonly', readonly || null)
                    ),
                    this.renderRemoveButton(name)
                );
        },

        renderRemoveButton: function (name) {
            if (!this.isRemovable(name)) return [];
            return $('<div class="col-md-1">').append(
                $('<button type="button" class="btn btn-link">')
                    .attr('title', gt('Remove field'))
                    .attr('data-remove', name)
                    .append(
                        $('<span class="fa-stack" aria-hidden="true">').append(
                            $('<i class="fa fa-circle fa-stack-2x">'),
                            $('<i class="fa fa-times fa-stack-1x">')
                        )
                    )
            );
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
            return this.alwaysVisible[name] || !!this.model.get(name);
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

            function renderSection(fields, name) {
                var $section = $('<div class="section">').append(fields.map(renderField, this)),
                    hasContent = $section.find('[data-field]:not(.hidden)').length > 0;
                $section.toggleClass('hidden', !hasContent);
                // show all fields of addresses if at least one field has content
                if (/^address_/.test(name) && hasContent) $section.find('[data-field]').removeClass('hidden');
                return $section;
            }

            function renderField(name) {
                switch (name) {
                    case 'address_home':
                    case 'address_business':
                    case 'address_other':
                        return this.renderSectionTitle(name);
                    case 'birthday':
                        return this.renderBirthday();
                    case 'note':
                        return this.renderNote();
                    default:
                        return this.renderTextField(name);
                }
            }
        },

        renderSectionTitle: function (name) {
            return $('<div class="form-group">').append(
                this.renderLeftColumn(),
                this.renderRightShortColumn()
                    .addClass('section-title').text(this.i18n[name]),
                this.renderRemoveButton(name)
            );
        },

        renderAddFields: function () {
            var guid = _.uniqueId('form-control-label-');
            return $('<div class="contact-edit-add form-inline">').append(
                $('<div class="form-group">').append(
                    $('<label class="control-label">').attr('for', guid).append(
                        $('<i class="fa fa-plus" aria-hidden="true">'),
                        $.txt(' ' + gt('Add field'))
                    ),
                    $.txt('\u00a0 '),
                    this.$select
                        .attr('id', guid)
                        .on('change', this.onAddField.bind(this))
                        .append(this.getFieldOptions())
                )
            );
        },

        getFieldOptions: function () {
            return [$('<option value="noop">')].concat(
                _(this.groups).map(function (group) {
                    return $('<optgroup>').attr('label', group.title).append(
                        group.fields
                            .filter(this.filterOption, this)
                            .map(this.getOption, this)
                    );
                }, this)
            );
        },

        filterOption: function (name) {
            return !this.visible[name];
        },

        getOption: function (name) {
            return $('<option>').attr('value', name).text(this.i18n[name]);
        },

        onAddField: function () {
            var name = this.$select.val();
            // skip on empty selection
            if (!name) return;
            // name might refer to a set of fields
            var set = this.resolveSet(name);
            set.forEach(this.showField, this);
            this.focusField(set[0]);
            this.updateDropdownOptions();
        },

        updateDropdownOptions: function () {
            this.$select.val('').empty().append(this.getFieldOptions());
        },

        showField: function (name) {
            this.$('[data-field="' + name + '"]')
                .removeClass('hidden')
                .closest('.section').removeClass('hidden');
            this.visible[name] = true;
        },

        focusField: function (name) {
            this.$('[data-field="' + name + '"] :input:first').focus();
        },

        isSet: function (name) {
            return !!this.sets[name];
        },

        resolveSet: function (name) {
            return this.sets[name] || [name];
        },

        onRemoveField: function (e) {
            var node = $(e.currentTarget),
                name = node.attr('data-remove');
            // to hide section titles, too
            if (this.isSet(name)) node.closest('.section').addClass('hidden');
            // name might refer to a set of fields
            var set = this.resolveSet(name);
            set.forEach(function (name) {
                this.$('[data-field="' + name + '"]').addClass('hidden');
                // let's see whether we need empty string or model.unset or something different
                this.model.set(name, '');
                this.visible[name] = false;
            }, this);
            this.updateDropdownOptions();
            this.$select.focus();
        },

        alwaysVisible: {
            first_name: true,
            last_name: true,
            email1: true,
            cellular_telephone1: true
        },

        readonly: {
            display_name: true
        },

        allFields: {
            personal: [
                'title', 'first_name', 'last_name',
                'nickname', 'second_name', 'suffix',
                // to be decided: what do we do with display_name?
                // 'display_name',
                'birthday', 'anniversary',
                'marital_status', 'number_of_children', 'url'
            ],
            job: [
                'company', 'department', 'position', 'profession', 'room_number',
                'employee_type', 'number_of_employees', 'sales_volume', 'tax_id',
                'commercial_register', 'branches', 'business_category', 'info',
                'manager_name', 'assistant_name'
            ],
            // email, messaging, and phone numbers
            communication: [
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
            ],
            address_home: [
                'address_home',
                'street_home', 'postal_code_home', 'city_home', 'state_home', 'country_home'
            ],
            address_business: [
                'address_business',
                'street_business', 'postal_code_business', 'city_business', 'state_business', 'country_business'
            ],
            address_other: [
                'address_other',
                'street_other', 'postal_code_other', 'city_other', 'state_other', 'country_other'
            ],
            note: ['note']
        },

        groups: {
            personal: {
                title: gt('Personal information'),
                fields: [
                    'title', 'first_name', 'last_name',
                    'nickname', 'second_name', 'suffix',
                    'birthday', 'anniversary',
                    'marital_status', 'number_of_children', 'url'
                ]
            },
            job: {
                title: gt('Business'),
                fields: [
                    'company', 'department', 'position', 'profession',
                    'room_number', 'manager_name', 'assistant_name'
                ]
            },
            messaging: {
                title: gt('Email & messaging'),
                fields: [
                    'email1', 'email2', 'email3',
                    'instant_messenger1', 'instant_messenger2'
                ]
            },
            phone: {
                title: gt('Phone & fax numbers'),
                fields: [
                    'cellular_telephone1', 'cellular_telephone2',
                    'telephone_business1', 'telephone_business2',
                    'telephone_home1', 'telephone_home2',
                    'telephone_company', 'telephone_other',
                    'fax_business', 'fax_home', 'fax_other'
                ]
            },
            addresses: {
                title: gt('Postal addresses'),
                fields: ['address_home', 'address_business', 'address_other']
            },
            note: {
                //#. Notes on a contact in the address book.
                //#. Like in "adding a note". "Notizen" in German, for example.
                title: gt.pgettext('contact', 'Note'),
                fields: ['note']
            }
        },

        sets: {
            address_home: ['street_home', 'postal_code_home', 'city_home', 'state_home', 'country_home'],
            address_business: ['street_business', 'postal_code_business', 'city_business', 'state_business', 'country_business'],
            address_other: ['street_other', 'postal_code_other', 'city_other', 'state_other', 'country_other']
        },

        i18n: {
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
        }
    });

    return View;
});
