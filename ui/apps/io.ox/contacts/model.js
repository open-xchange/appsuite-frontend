/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
 *
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */
define('io.ox/contacts/model',
      ['io.ox/backbone/modelFactory',
       'io.ox/backbone/validation',
       'io.ox/contacts/api',
       'gettext!io.ox/contacts'
       ], function (ModelFactory, Validators, api, gt) {

    'use strict';

    function buildFactory(ref, api) {
        var factory = new ModelFactory({
            api: api,
            ref: ref,

            model: {

                addMember: function (member) {

                    var currentDistListArray = this.get('distribution_list');

                    if (currentDistListArray === undefined) {
                        this.set('distribution_list', [member]);
                    } else {
                        currentDistListArray.push(member);
                        this.set('distribution_list', currentDistListArray);
                    }

                    this.trigger("change");
                    this.trigger("change:distribution_list");
                },

                removeMember: function (mail, name) {

                    var currentDistlist = this.get('distribution_list');

                    _(currentDistlist).each(function (val, key) {
                        if (val.mail === mail && val.display_name === name) {
                            currentDistlist.splice(key, 1);
                        }
                    });

                    this.set('distribution_list', currentDistlist);

                    this.trigger("change");
                    this.trigger("change:distribution_list");

                }
            },

            update: function (model) {
                // Some special handling for profile pictures
                var data = model.changedSinceLoading(),
                    file = data.pictureFile;
                if (file) {
                    delete data.pictureFile;
                    return api.editNewImage({id: model.id, folder_id: model.get('folder_id') }, data, file);
                } else {
                    return api.update({id: model.id, folder: model.get('folder_id'), data: data});
                }
            },

            updateEvents: ['edit'],

            create: function (model) {
                // Some special handling for profile pictures
                var json, file;
                if (model.attributes.pictureFile) {
                    file = model.get("pictureFile");
                    json = model.toJSON();
                    delete json.pictureFile;
                } else {
                    json = model.toJSON();
                }

                return api.create(json, file);
            },

            destroy: function (model) {
                return api.remove({id: model.id, folder_id: model.get('folder_id')});
            }
        });

        Validators.validationFor(ref, {
            display_name: { format: 'string' },
            first_name: { format: 'string'},
            last_name: { format: 'string'},
            second_name: { format: 'string'},
            suffix: { format: 'string'},
            title: { format: 'string'},
            street_home: { format: 'string'},
            postal_code_home: { format: 'string'},
            city_home: { format: 'string'},
            state_home: { format: 'string'},
            country_home: { format: 'string'},
            birthday: { format: 'pastDate'},
            marital_status: { format: 'string'},
            number_of_children: { format: 'string'},
            profession: { format: 'string'},
            nickname: { format: 'string'},
            spouse_name: { format: 'string'},
            anniversary: { format: 'pastDate'},
            note: { format: 'text'},
            department: { format: 'string'},
            position: { format: 'string'},
            employee_type: { format: 'string'},
            room_number: { format: 'string'},
            street_business: { format: 'string'},
            postal_code_business: { format: 'string'},
            city_business: { format: 'string'},
            state_business: { format: 'string'},
            country_business: { format: 'string'},
            number_of_employees: { format: 'string'},
            sales_volume: { format: 'string'},
            tax_id: { format: 'string'},
            commercial_register: { format: 'string'},
            branches: { format: 'string'},
            business_category: { format: 'string'},
            info: { format: 'string'},
            manager_name: { format: 'string'},
            assistant_name: { format: 'string'},
            street_other: { format: 'string'},
            city_other: { format: 'string'},
            postal_code_other: { format: 'string'},
            country_other: { format: 'string'},
            telephone_business1: { format: 'string'},
            telephone_business2: { format: 'string'},
            fax_business: { format: 'string'},
            telephone_callback: { format: 'string'},
            telephone_car: { format: 'string'},
            telephone_company: { format: 'string'},
            telephone_home1: { format: 'string'},
            telephone_home2: { format: 'string'},
            fax_home: { format: 'string'},
            cellular_telephone1: { format: 'string'},
            cellular_telephone2: { format: 'string'},
            telephone_other: { format: 'string'},
            fax_other: { format: 'string'},
            email1: { format: 'email'},
            email2: { format: 'email'},
            email3: { format: 'email'},
            url: { format: 'url'},
            telephone_isdn: { format: 'string'},
            telephone_pager: { format: 'string'},
            telephone_primary: { format: 'string'},
            telephone_radio: { format: 'string'},
            telephone_telex: { format: 'string'},
            telephone_ttytdd: { format: 'string'},
            instant_messenger1: { format: 'string'},
            instant_messenger2: { format: 'string'},
            telephone_ip: { format: 'string'},
            telephone_assistant: { format: 'string'},
            company: { format: 'string'},
            image1: { format: 'string'},
            userfield01: { format: 'string'},
            userfield02: { format: 'string'},
            userfield03: { format: 'string'},
            userfield04: { format: 'string'},
            userfield05: { format: 'string'},
            userfield06: { format: 'string'},
            userfield07: { format: 'string'},
            userfield08: { format: 'string'},
            userfield09: { format: 'string'},
            userfield10: { format: 'string'},
            userfield11: { format: 'string'},
            userfield12: { format: 'string'},
            userfield13: { format: 'string'},
            userfield14: { format: 'string'},
            userfield15: { format: 'string'},
            userfield16: { format: 'string'},
            userfield17: { format: 'string'},
            userfield18: { format: 'string'},
            userfield19: { format: 'string'},
            userfield20: { format: 'string'},
            links: { format: 'array'},
            distribution_list: { format: 'array'},
            number_of_links: { format: 'number'},
            number_of_images: { format: 'number'},
            image_last_modified: { format: 'number'},
            state_other: { format: 'string'},
            file_as: { format: 'string'},
            image1_content_type: { format: 'string'},
            mark_as_distributionlist: { format: 'boolean'},
            default_address: { format: 'number'},
            image1_url: { format: 'url'},
            internal_userid: { format: 'number'},
            useCount: { format: 'number'},
            yomiFirstName: { format: 'string'},
            yomiLastName: { format: 'string'},
            yomiCompany: { format: 'string'},
            addressHome: { format: 'string'},
            addressBusiness: { format: 'string'},
            addressOther: { format: 'string'},
            private_flag: { format: 'boolean'}
        });

        return factory;

    }

    var fields = {
        display_name: gt('Display name'), // noun
        first_name: gt('First name'),
        last_name: gt('Last name'),
        second_name: gt('Middle name'),
        suffix: gt('Suffix'),
        title: gt.pgettext('salutation', 'Title'),
        street_home: gt('Street'),
        postal_code_home: gt('Postcode'),
        city_home: gt('Town'),
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
        city_business: gt('Town'),
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
        city_other: gt('Town'),
        postal_code_other: gt('Postcode'),
        country_other: gt('Country'),
        telephone_business1: gt('Phone'),
        telephone_business2: gt('Phone alt'),
        fax_business: gt('Fax'),
        telephone_callback: gt('Telephone callback'),
        telephone_car: gt('Phone (car)'),
        telephone_company: gt('Phone (company)'),
        telephone_home1: gt('Phone (Home)'),
        telephone_home2: gt('Phone (Home alt)'),
        fax_home: gt('Fax'),
        cellular_telephone1: gt('Cell phone'),
        cellular_telephone2: gt('Cell phone alt'),
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
        private_flag: gt('Private'),
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

