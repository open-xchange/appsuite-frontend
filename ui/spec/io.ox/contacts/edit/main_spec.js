/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define(['io.ox/contacts/main', 'io.ox/core/main', 'io.ox/contacts/api'], function (main, core, api) {

    'use strict';
    var testObject = {
            first_name: 'Georg',
            last_name: 'Tester',
            email1: 'tester@test.de',
            cellular_telephone1: '0815123456789',
            folder_id: 1
        },

        /* Note: This is not used, but if it would it should be a fixture
        testObjectLong = {
            first_name: 'Georg',
            last_name: 'Tester',
            display_name: 'Dr. Tester, Georg', // just to skip missing autocreate
            company: 'OX',
            department: 'OX-dev',
            position: 'small cog in a big wheel',
            profession: 'developer',
            street_business: 'Martinstr. 41',
            postal_code_business: '57462',
            city_business: 'Olpe',
            sales_volume: '10000',
            suffix: 'Sir',
            title: 'Dr.',
            street_home: 'Goethe-Ring 2',
            postal_code_home: '10333',
            city_home: 'Olpe',
            state_home: 'NRW',
            country_home: 'Germany',
            marital_status: 'married',
            number_of_children: '2',
            nickname: 'GG',
            spouse_name: 'Johanna',
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
            manager_name: 'Barney Stinson',
            assistant_name: 'Ted Mosby',
            street_other: 'Elm street',
            city_other: 'Some',
            postal_code_other: '33333',
            state_other: 'New York',
            country_other: 'USA',
            telephone_business1: '+49 2761-8385-0',
            telephone_business2: '0815-4711',
            fax_business: '0815-4711',
            telephone_callback: '0815-4711',//
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
            userfield20: 'userfield'
        },
        */

        response = {
            'timestamp': 1379403021960,
            'data': {
                'created_by': 0,
                'creation_date': 1379493234602,
                'display_name': 'Dr. Tester, Georg',
                'first_name': 'Georg',
                'folder_id': 1,
                'id': 510778,
                'last_modified': 1379493234602,
                'last_modified_utc': 1379493234602,
                'modified_by': 0,
                'number_of_attachments': 0,
                'number_of_images': 0,
                'sort_name': 'Tester',
                'uid': '791190bd-37c0-444f-89b5-33113190c1cf'
            }
        },

        result = {
            'timestamp': 1379403021960,
            'data': {
                'id': 510778
            }
        },

        TIMEOUT = ox.testTimeout;

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

    /*
     * Suite: Contacts Test
     */

    describe('Contact edit', function () {

        var app = null;

        beforeEach(function () {
            this.server.respondWith('PUT', /api\/contacts\?action=new/, function (xhr) {
                xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8'}, JSON.stringify(result));
            });

            this.server.respondWith('GET', /api\/contacts\?action=get/, function (xhr) {
                xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8'}, JSON.stringify(response));
            });

        });

        it('should provide a getApp function ', function () {
            expect(main.getApp).toBeTruthy();
        });

        it('should provide a launch function ', function () {
            var app = main.getApp();
            expect(app.launch).toBeTruthy();
        });

        it('opens contact app ', function () {

            var loaded = new Done();

            waitsFor(loaded, 'Could not load app', TIMEOUT);

            main.getApp().launch().done(function () {
                app = this;
                loaded.yep();
                expect(app.get('state')).toBe('running');
            });
        });

        it('creates a fresh obj', function () {

            var flag, value;

            api.on('create', function (e, obj)  {
                value = obj.id;
                flag = true;
            });

            runs(function () {
                flag = false;
                api.create(testObject).done(function () {
                    expect(value).toBe(response.data.id);
                });
            });

        });

    });

});
