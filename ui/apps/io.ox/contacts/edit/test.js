/**
 * All content on this website (including text, images, source code and any
 * other original works), unless otherwise noted, is licensed under a Creative
 * Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011 Mail: info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define("io.ox/contacts/edit/test",
    ["io.ox/core/extensions", "io.ox/contacts/edit/main",
     "io.ox/contacts/api"], function (ext, contacts, api) {

    "use strict";

    // test objects
    var testObject = {
            first_name: 'Georg',
            last_name: 'Tester',
            company: 'OX',
            department: 'OX7-dev',
            position: 'small cog in a big wheel',
            profession: 'developer',
            street_business: 'Martinstr. 41',
            postal_code_business: '57462',
            city_business: 'Olpe',
            telephone_business1: '+49 2761-8385-0',
            folder_id: 11179
        },
        testObjectLong = {
            first_name: 'Georg',
            last_name: 'Tester',
            company: 'OX',
            department: 'OX7-dev',
            position: 'small cog in a big wheel',
            profession: 'developer',
            street_business: 'Martinstr. 41',
            postal_code_business: '57462',
            city_business: 'Olpe',
            telephone_business1: '+49 2761-8385-0',
            sales_volume: '10000',
            suffix: 'Sir',
            title: 'Dr.',
            street_home: 'Goethe-Ring 2',
            postal_code_home: '10333',
            city_home: 'Olpe',
            state_home: 'NRW',
            country_home: 'Germany',
            birthday: '10.10.1915',
            marital_status: 'married',
            number_of_children: '2',
            nickname: 'GG',
            spouse_name: 'Johanna',
            anniversary: '11.10.1980',
            note: 'Much Ado about Nothing',
            employee_type: 'free',
            room_number: '4711',
            state_business: 'NRW',
            country_business: 'Olpe',
            number_of_employees: '50',
            tax_id: '23-2322-23',
            commercial_register: '123123123',
            branches: 'IT',
            business_category: 'nothing',
            info: 'realy nothing',
            manager_name: 'Barney Stinson  ',
            assistant_name: 'Ted Mosby',
            street_other: 'Elm street',
            city_other: 'Some',
            postal_code_other: '33333',
            country_other: 'USA',
            telephone_business2: '0815-4711',
            fax_business: '0815-4711',
            telephone_callback: '0815-4711',
            telephone_car: '0815-4711',
            telephone_company: '0815-4711',
            telephone_home1: '0815-4711',
            telephone_home2: '0815-4711',
            fax_home: '0815-4711',
            cellular_telephone1: '0815-4711',
            cellular_telephone2: '0815-4711',
            telephone_other: '0815-4711',
            fax_other: '0815-4711',
            email1: 'test@test-ox.de',
            email2: 'test@test-ox.de',
            email3: 'test@test-ox.de',
            url: 'http://www.test-ox.de',
            telephone_isdn: '0815-4711',
            telephone_pager: '0815-4711',
            telephone_primary: '0815-4711',
            telephone_radio: '0815-4711',
            telephone_telex: '0815-4711',
            telephone_ttytdd: '0815-4711',
            instant_messenger1: '0815-4711',
            instant_messenger2: '0815-4711',
            telephone_ip: '0815-4711',
            telephone_assistant: '0815-4711',
            userfield01: 'userfield',
            userfield02: 'userfield',
            userfield03: 'userfield',
            userfield04: 'userfield',
            userfield05: 'userfield',
            userfield06: 'userfield',
            userfield07: 'userfield',
            userfield08: 'userfield',
            userfield09: 'userfield',
            userfield10: 'userfield',
            userfield11: 'userfield',
            userfield12: 'userfield',
            userfield13: 'userfield',
            userfield14: 'userfield',
            userfield15: 'userfield',
            userfield16: 'userfield',
            userfield17: 'userfield',
            userfield18: 'userfield',
            userfield19: 'userfield',
            userfield20: 'userfield',
            state_other: 'userfield'
        };

    // helpers
    function Done() {
        var f = function () {
            return f.value;
        };
        f.value = false;
        f.yep = function () {
            f.value = true;
        };
        return f;
    }

    var testFactory = {
        createSimpleContact: function (callback) {
            api.create(testObject).done(function (data) {
                callback(data);

            });
        }
    };

    /*
     * Suite: Contacts Test
     */
    ext.point('test/suite').extend({
        id: 'contacts-edit-test',
        index: 100,
        test: function (j) {

            j.describe("Contact edit", function () {

                var app = null;

                j.it('opens contact app ', function () {

                    var loaded = new Done();

                    j.waitsFor(loaded, 'Could not load app', 5000);

                    contacts.getApp().launch().done(function () {
                        app = this;
                        loaded.yep();
                        j.expect(app).toBeTruthy();
                    });
                });

                j.it('creats a fresh obj', function () {
                    j.runs(function () {
                        var me = this;
                        me.ready = false;
                        testFactory.createSimpleContact(function (data) {
                            if (data) {
                                me.ready = true;
                                me.obj = data;
                            }
                        });

                        j.waitsFor(function () {
                            return this.ready;
                        }, 'it happens', 50);

                        j.runs(function () {
                            var test = this.obj;
                            j.expect(test).toBeTruthy();
                        });
                    });
                });
            });
        }
    });
});