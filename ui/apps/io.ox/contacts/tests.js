/**
 *
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 *
 */

define("io.ox/contacts/tests",
    ["io.ox/contacts/api"], function (api) {

    "use strict";

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
        telephone_business1: '+49 2761-8385-0'
    };

    var testObjectLong = {
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
//        business_category: 'nothing',
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

    var testCreate = function () {
        var button = $(".window-toolbar a.io-ox-action-link:contains('create')");

        // test if create button exists
        if (_.isElement(button[0])) {
            console.log('button create exists');
        }

        button.triggerHandler('click');

        window.setTimeout(function () {
            var formFrame =  $('.io-ox-dialog-popup');
            if (_.isElement(formFrame[0])) {
                console.log('form has been created');
            }
         // autofill the form
            for (var i in testObject) {
                formFrame.find(".field input[name='" + i + "']").val(testObject[i]);
            }
         // test if save button exists
            var button = formFrame.find(".btn:contains('Save')");
            if (_.isElement(button[0])) {
                console.log('button save exists');
            }
            button.triggerHandler('click');
        }, 1000);
    };

    var testCreateCheck = function (data) {
        require(["io.ox/contacts/api"], function (api) {
            api.get(data).done(function (obj) {
                for (var i in testObject) {
                    if (testObject[i] === obj[i]) {
                        console.log(i + " is correct filled");
                    } else {
                        console.log(i + " is not correct filled");
                    }
                }
            });
        });
    };

    var testEdit = function () {
        var button = $(".io-ox-inline-links a:contains('edit')");
        if (_.isElement(button[0])) {
            console.log('button edit exists');
        }

        button.triggerHandler('click');

        window.setTimeout(function () {
            var formFrame =  $('.contact_edit_frame');
            if (_.isElement(formFrame[0])) {
                console.log('form has been created');
            }

            // autofill the form
            for (var i in testObjectLong) {
                formFrame.find(".field input[name='" + i + "']").val(testObjectLong[i]);
            }

         // test if save button exists
            var button = formFrame.find(".btn:contains('save')");
            if (_.isElement(button[0])) {
                console.log('button save exists');
            }
            button.triggerHandler('click');
            console.log('contact saved');

        }, 1000);
    };

    var testEditCheck = function (data) {
        api.get(data).done(function (obj) {
            console.log(testObjectLong);
            console.log(obj); //TODO all dates going to fail because wrong format
            for (var i in testObjectLong) {
                if (testObjectLong[i] === obj[i]) {
                    console.log(i + " is correct filled");
                } else {
                    console.log(i + " is not correct filled");
                }
            }
        });
    };

    api.on('created', testCreateCheck);
    api.on('edit', testEditCheck);

    return {
        testCreate: testCreate,
        testCreateCheck: testCreateCheck,
        testEdit: testEdit,
        testEditCheck: testEditCheck
    };

});