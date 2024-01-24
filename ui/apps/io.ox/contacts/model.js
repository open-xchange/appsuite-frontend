/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/contacts/model', [
    'io.ox/backbone/modelFactory',
    'io.ox/backbone/validation',
    'io.ox/core/extensions',
    'io.ox/contacts/api',
    'io.ox/settings/util',
    'io.ox/core/strings',
    'gettext!io.ox/contacts'
], function (ModelFactory, Validators, ext, api, settingsUtil, strings, gt) {

    'use strict';

    function buildFactory(ref, api) {
        var isMyContactData = ref === 'io.ox/core/user/model',
            factory = new ModelFactory({
                api: api,
                ref: ref,
                updateEvents: ['edit'],

                create: function (model) {
                    var data = model.toJSON(),
                        file = data.pictureFileEdited || data.pictureFile;
                    // clean up data
                    data = _.omit(data, ['crop', 'pictureFile', 'pictureFileEdited', 'image1']);
                    return api.create(data, file);
                },

                update: function (model) {
                    // Some special handling for profile pictures
                    var data = model.changedSinceLoading(),
                        file = data.pictureFileEdited || data.pictureFile,
                        yell = !isMyContactData ? _.identity : settingsUtil.yellOnReject;
                    // clean up data
                    data = _.omit(data, ['crop', 'pictureFile', 'pictureFileEdited']);
                    // update
                    if (file) return api.editNewImage({ id: model.id, folder_id: model.get('folder_id') }, _.omit(data, 'image1'), file);
                    return yell(
                        api.update({ id: model.id, folder: model.get('folder_id'), last_modified: model.get('last_modified'), data: data })
                    );
                },

                destroy: function (model) {
                    return api.remove({ id: model.id, folder_id: model.get('folder_id') });
                }
            });

        Validators.validationFor(ref, {
            display_name: { format: 'string' },
            first_name: { format: 'string' },
            last_name: { format: 'string' },
            second_name: { format: 'string' },
            suffix: { format: 'string' },
            title: { format: 'string' },
            street_home: { format: 'string' },
            postal_code_home: { format: 'string' },
            city_home: { format: 'string' },
            state_home: { format: 'string' },
            country_home: { format: 'string' },
            birthday: { format: 'date' },
            marital_status: { format: 'string' },
            number_of_children: { format: 'string' },
            profession: { format: 'string' },
            nickname: { format: 'string' },
            spouse_name: { format: 'string' },
            anniversary: { format: 'date' },
            note: { format: 'text' },
            department: { format: 'string' },
            position: { format: 'string' },
            employee_type: { format: 'string' },
            room_number: { format: 'string' },
            street_business: { format: 'string' },
            postal_code_business: { format: 'string' },
            city_business: { format: 'string' },
            state_business: { format: 'string' },
            country_business: { format: 'string' },
            number_of_employees: { format: 'string' },
            sales_volume: { format: 'string' },
            tax_id: { format: 'string' },
            commercial_register: { format: 'string' },
            branches: { format: 'string' },
            business_category: { format: 'string' },
            info: { format: 'string' },
            manager_name: { format: 'string' },
            assistant_name: { format: 'string' },
            street_other: { format: 'string' },
            city_other: { format: 'string' },
            postal_code_other: { format: 'string' },
            country_other: { format: 'string' },
            telephone_business1: { format: 'phone' },
            telephone_business2: { format: 'phone' },
            fax_business: { format: 'phone' },
            telephone_callback: { format: 'phone' },
            telephone_car: { format: 'phone' },
            telephone_company: { format: 'phone' },
            telephone_home1: { format: 'phone' },
            telephone_home2: { format: 'phone' },
            fax_home: { format: 'phone' },
            cellular_telephone1: { format: 'phone' },
            cellular_telephone2: { format: 'phone' },
            telephone_other: { format: 'phone' },
            fax_other: { format: 'phone' },
            email1: { format: 'email' },
            email2: { format: 'email' },
            email3: { format: 'email' },
            url: { format: 'url' },
            telephone_isdn: { format: 'phone' },
            telephone_pager: { format: 'phone' },
            telephone_primary: { format: 'phone' },
            telephone_radio: { format: 'phone' },
            telephone_telex: { format: 'phone' },
            telephone_ttytdd: { format: 'phone' },
            instant_messenger1: { format: 'string' },
            instant_messenger2: { format: 'string' },
            telephone_ip: { format: 'phone' },
            telephone_assistant: { format: 'phone' },
            company: { format: 'string' },
            image1: { format: 'string' },
            userfield01: { format: 'string' },
            userfield02: { format: 'string' },
            userfield03: { format: 'string' },
            userfield04: { format: 'string' },
            userfield05: { format: 'string' },
            userfield06: { format: 'string' },
            userfield07: { format: 'string' },
            userfield08: { format: 'string' },
            userfield09: { format: 'string' },
            userfield10: { format: 'string' },
            userfield11: { format: 'string' },
            userfield12: { format: 'string' },
            userfield13: { format: 'string' },
            userfield14: { format: 'string' },
            userfield15: { format: 'string' },
            userfield16: { format: 'string' },
            userfield17: { format: 'string' },
            userfield18: { format: 'string' },
            userfield19: { format: 'string' },
            userfield20: { format: 'string' },
            links: { format: 'array' },
            distribution_list: { format: 'array' },
            number_of_links: { format: 'number' },
            number_of_images: { format: 'number' },
            image_last_modified: { format: 'number' },
            state_other: { format: 'string' },
            file_as: { format: 'string' },
            image1_content_type: { format: 'string' },
            mark_as_distributionlist: { format: 'boolean' },
            default_address: { format: 'number' },
            image1_url: { format: 'url' },
            internal_userid: { format: 'number' },
            useCount: { format: 'number' },
            yomiFirstName: { format: 'string' },
            yomiLastName: { format: 'string' },
            yomiCompany: { format: 'string' },
            addressHome: { format: 'string' },
            addressBusiness: { format: 'string' },
            addressOther: { format: 'string' },
            private_flag: { format: 'boolean' }
        });

        ext.point(ref + '/validation').extend({
            id: 'upload_quota',
            validate: function (attributes) {
                if (attributes.quotaExceeded) {
                    this.add('attachments_list', gt('Files can not be uploaded, because upload limit of %1$s is exceeded.', strings.fileSize(attributes.quotaExceeded.attachmentMaxUploadSize, 2)));
                }
            }
        });

        ext.point(ref + '/validation').extend({
            id: 'birthday',
            validate: function (attributes) {
                // null is valid because this is the value to remove a birthday
                // undefined means the user has a month but no day selected or the other way round.
                // This way we can see if the input is incomplete or the birthday should be removed
                if ('birthday' in attributes && attributes.birthday !== null && !_.isNumber(attributes.birthday)) {
                    this.add('birthday', gt('Please set day and month properly'));
                }
            }
        });

        ext.point(ref + '/validation').extend({
            id: 'first_name',
            validate: function (attributes) {
                // if this contact is based on a user, first_name and last_name must not be empty (dipslay name is generated from them)
                if (attributes.user_id && (!attributes.first_name || _.isEmpty(String(attributes.first_name).trim()))) {
                    this.add('first_name', gt('First name must not be empty for internal users'));
                }
            }
        });

        ext.point(ref + '/validation').extend({
            id: 'last_name',
            validate: function (attributes) {
                // if this contact is based on a user, first_name and last_name must not be empty (dipslay name is generated from them)
                if (attributes.user_id && (!attributes.last_name || _.isEmpty(String(attributes.last_name).trim()))) {
                    this.add('last_name', gt('Last name must not be empty for internal users'));
                }
            }
        });

        return factory;

    }

    var fields = {
        // noun
        display_name: gt('Display name'),
        first_name: gt('First name'),
        last_name: gt('Last name'),
        second_name: gt('Middle name'),
        suffix: gt('Suffix'),
        title: gt.pgettext('salutation', 'Title'),
        street_home: gt('Street'),
        postal_code_home: gt('Postcode'),
        city_home: gt('City'),
        state_home: gt('State'),
        country_home: gt('Country'),
        birthday: gt('Date of birth'),
        marital_status: gt('Marital status'),
        number_of_children: gt('Children'),
        profession: gt('Profession'),
        nickname: gt('Nickname'),
        spouse_name: gt('Spouse\'s name'),
        anniversary: gt('Anniversary'),
        note: gt('Comment'),
        department: gt('Department'),
        position: gt('Position'),
        employee_type: gt('Employee type'),
        room_number: gt('Room number'),
        street_business: gt('Street'),
        postal_code_business: gt('Postcode'),
        city_business: gt('City'),
        state_business: gt('State'),
        country_business: gt('Country'),
        number_of_employees: gt('Employee ID'),
        sales_volume: gt('Sales Volume'),
        tax_id: gt('TAX ID'),
        commercial_register: gt('Commercial Register'),
        branches: gt('Branches'),
        business_category: gt('Business category'),
        info: gt('Info'),
        manager_name: gt('Manager'),
        assistant_name: gt('Assistant'),
        street_other: gt('Street'),
        city_other: gt('City'),
        postal_code_other: gt('Postcode'),
        country_other: gt('Country'),
        telephone_business1: gt('Phone (business)'),
        telephone_business2: gt('Phone (business alt)'),
        fax_business: gt('Fax'),
        telephone_callback: gt('Telephone callback'),
        telephone_car: gt('Phone (car)'),
        telephone_company: gt('Phone (company)'),
        telephone_home1: gt('Phone (home)'),
        telephone_home2: gt('Phone (home alt)'),
        fax_home: gt('Fax (Home)'),
        cellular_telephone1: gt('Cell phone'),
        cellular_telephone2: gt('Cell phone (alt)'),
        telephone_other: gt('Phone (other)'),
        fax_other: gt('Fax (alt)'),
        email1: gt('Email 1'),
        email2: gt('Email 2'),
        email3: gt('Email 3'),
        url: gt('URL'),
        telephone_isdn: gt('Telephone (ISDN)'),
        telephone_pager: gt('Pager'),
        telephone_primary: gt('Telephone primary'),
        telephone_radio: gt('Telephone radio'),
        telephone_telex: gt('Telex'),
        telephone_ttytdd: gt('TTY/TDD'),
        instant_messenger1: gt('Instant Messenger 1'),
        instant_messenger2: gt('Instant Messenger 2'),
        telephone_ip: gt('IP phone'),
        telephone_assistant: gt('Phone (assistant)'),
        company: gt('Company'),
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
        userfield20: gt('Optional 20'),
        links: gt('Links'),
        distribution_list: gt('Distribution list'),
        state_other: gt('State'),
        mark_as_distributionlist: gt('Mark as distributionlist'),
        default_address: gt('Default address'),
        addressHome: gt('Address Home'),
        addressBusiness: gt('Address Business'),
        addressOther: gt('Address Other'),
        private_flag: gt('This contact is private and cannot be shared'),
        // don't think we show this anywhere so we don't use gt here not to nerf translators
        number_of_links: 'Number of links',
        number_of_images: 'Number of images',
        image_last_modified: 'Image last modified',
        file_as: 'File as',
        image1_content_type: 'Image1 content type',
        image1_url: 'Image1 url',
        internal_userid: 'Internal userid',
        useCount: 'use Count',
        yomiFirstName: 'yomi First Name',
        yomiLastName: 'yomi Last Name',
        yomiCompany: 'yomi Company'
    };

    var factory = buildFactory('io.ox/contacts/model', api);

    return {
        Contact: factory.model,
        Contacts: factory.collection,
        factory: factory,
        api: api,
        fields: fields,
        protectedMethods: {
            buildFactory: buildFactory
        }
    };
});
