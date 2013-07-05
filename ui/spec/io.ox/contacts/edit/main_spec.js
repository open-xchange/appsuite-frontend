/**
 * All content on this website (including text, images, source code and any
 * other original works), unless otherwise noted, is licensed under a Creative
 * Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011 Mail: info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */


    define(["io.ox/contacts/edit/main"], function (main) {


    "use strict";

    var testObjectLong = {
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

    TIMEOUT = ox.testTimeout;

    /*
     * Suite: Contacts Test
     */

    describe("Contact edit", function () {

        it('opens contact app ', function () {

            expect(true).toBeTruthy();
            });
        });

});
