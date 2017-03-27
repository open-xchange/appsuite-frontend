/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */

describe('Contacts', function () {

    describe('Create', function () {

        it('adds a contact with all fields', function (client) {

            client
                .login('app=io.ox/contacts')
                .waitForElementVisible('*[data-app-name="io.ox/contacts"]', 20000)
                .assert.containsText('*[data-app-name="io.ox/contacts"]', 'Address Book');

            client
                .selectFolder({ title: 'Contacts' })
                .clickWhenEventListener('.io-ox-contacts-window .classic-toolbar a[data-action="create"]', 'click', 2000)
                .clickWhenVisible('.dropdown.open a[data-action="io.ox/contacts/actions/create"]', 2000)
                .waitForElementVisible('.io-ox-contacts-edit-window', 2500);

            client
                // enable all fields
                .click('.io-ox-contacts-edit-window .window-footer .checkbox-inline input')
                // personal information
                .setValue('.io-ox-contacts-edit-window *[data-field="title"] input', 'title')
                .setValue('.io-ox-contacts-edit-window *[data-field="first_name"] input', 'first_name')
                .setValue('.io-ox-contacts-edit-window *[data-field="last_name"] input', 'last_name')
                .setValue('.io-ox-contacts-edit-window *[data-field="second_name"] input', 'second_name')
                .setValue('.io-ox-contacts-edit-window *[data-field="suffix"] input', 'suffix')
                .setValue('.io-ox-contacts-edit-window *[data-field="birthday"] select.month', 'May')
                .setValue('.io-ox-contacts-edit-window *[data-field="birthday"] select.date', '4')
                .setValue('.io-ox-contacts-edit-window *[data-field="birthday"] select.year', '1957')
                .setValue('.io-ox-contacts-edit-window *[data-field="url"] input', 'url')
                // job description
                .setValue('.io-ox-contacts-edit-window *[data-field="profession"] input', 'profession')
                .setValue('.io-ox-contacts-edit-window *[data-field="position"] input', 'position')
                .setValue('.io-ox-contacts-edit-window *[data-field="department"] input', 'department')
                .setValue('.io-ox-contacts-edit-window *[data-field="company"] input', 'company')
                .setValue('.io-ox-contacts-edit-window *[data-field="room_number"] input', '101')
                // messaging
                .setValue('.io-ox-contacts-edit-window *[data-field="email1"] input', 'email1@test')
                .setValue('.io-ox-contacts-edit-window *[data-field="email2"] input', 'email2@test')
                .setValue('.io-ox-contacts-edit-window *[data-field="email3"] input', 'email3@test')
                .setValue('.io-ox-contacts-edit-window *[data-field="instant_messenger1"] input', 'instant_messenger1')
                .setValue('.io-ox-contacts-edit-window *[data-field="instant_messenger2"] input', 'instant_messenger2')
                // phone and fax
                .setValue('.io-ox-contacts-edit-window *[data-field="cellular_telephone1"] input', 'cellular_telephone1')
                .setValue('.io-ox-contacts-edit-window *[data-field="cellular_telephone2"] input', 'cellular_telephone2')
                .setValue('.io-ox-contacts-edit-window *[data-field="telephone_business1"] input', 'telephone_business1')
                .setValue('.io-ox-contacts-edit-window *[data-field="telephone_business2"] input', 'telephone_business2')
                .setValue('.io-ox-contacts-edit-window *[data-field="telephone_home1"] input', 'telephone_home1')
                .setValue('.io-ox-contacts-edit-window *[data-field="telephone_home2"] input', 'telephone_home2')
                .setValue('.io-ox-contacts-edit-window *[data-field="telephone_other"] input', 'telephone_other')
                .setValue('.io-ox-contacts-edit-window *[data-field="fax_business"] input', 'fax_business')
                .setValue('.io-ox-contacts-edit-window *[data-field="fax_home"] input', 'fax_home')
                // home address
                .setValue('.io-ox-contacts-edit-window *[data-field="street_home"] input', 'Home Street')
                .setValue('.io-ox-contacts-edit-window *[data-field="postal_code_home"] input', '12345')
                .setValue('.io-ox-contacts-edit-window *[data-field="city_home"] input', 'Home City')
                .setValue('.io-ox-contacts-edit-window *[data-field="state_home"] input', 'Home State')
                .setValue('.io-ox-contacts-edit-window *[data-field="country_home"] input', 'Home County')
                // business address
                .setValue('.io-ox-contacts-edit-window *[data-field="street_business"] input', 'Business Street')
                .setValue('.io-ox-contacts-edit-window *[data-field="postal_code_business"] input', '12345')
                .setValue('.io-ox-contacts-edit-window *[data-field="city_business"] input', 'Business City')
                .setValue('.io-ox-contacts-edit-window *[data-field="state_business"] input', 'Business State')
                .setValue('.io-ox-contacts-edit-window *[data-field="country_business"] input', 'Business County')
                // other address
                .setValue('.io-ox-contacts-edit-window *[data-field="street_other"] input', 'Other Street')
                .setValue('.io-ox-contacts-edit-window *[data-field="postal_code_other"] input', '12345')
                .setValue('.io-ox-contacts-edit-window *[data-field="city_other"] input', 'Other City')
                .setValue('.io-ox-contacts-edit-window *[data-field="state_other"] input', 'Other State')
                .setValue('.io-ox-contacts-edit-window *[data-field="country_other"] input', 'Other County')
                // coment
                .setValue('.io-ox-contacts-edit-window *[data-field="note"] textarea', 'a comment in the comment field');

            client
                .click('.io-ox-contacts-edit-window button[data-action="save"]')
                .waitForElementNotPresent('.io-ox-contacts-edit-window', 5000);

            client
                // wait for detail view
                .waitForElementVisible('.io-ox-contacts-window .leftside .vgrid-cell.selected', 2500)
                .waitForElementVisible('.io-ox-contacts-window .rightside .scrollable-pane > div', 2500)
                .waitForElementVisible('.io-ox-contacts-window .rightside .contact-header .first_name', 2500)
                .pause(500)
                // personal information
                .assert.containsText('.io-ox-contacts-window .rightside .contact-header .first_name', 'first_name')
                .assert.containsText('.io-ox-contacts-window .rightside .contact-header .last_name', 'last_name')
                .assert.containsText('.io-ox-contacts-window .rightside fieldset[data-block="personal"] > dl > dd:nth-of-type(1)', 'title')
                .assert.containsText('.io-ox-contacts-window .rightside fieldset[data-block="personal"] > dl > dd:nth-of-type(2)', 'second_name')
                .assert.containsText('.io-ox-contacts-window .rightside fieldset[data-block="personal"] > dl > dd:nth-of-type(3)', 'suffix')
                .assert.containsText('.io-ox-contacts-window .rightside fieldset[data-block="personal"] > dl > dd:nth-of-type(4)', '5/4/1957')
                .assert.containsText('.io-ox-contacts-window .rightside fieldset[data-block="personal"] > dl > dd:nth-of-type(5)', 'url')
                // job description
                .assert.containsText('.io-ox-contacts-window .rightside fieldset[data-block="job"] > dl > dd:nth-of-type(1)', 'position')
                .assert.containsText('.io-ox-contacts-window .rightside .contact-header .position', 'position')
                .assert.containsText('.io-ox-contacts-window .rightside fieldset[data-block="job"] > dl > dd:nth-of-type(2)', 'department')
                .assert.containsText('.io-ox-contacts-window .rightside fieldset[data-block="job"] > dl > dd:nth-of-type(3)', 'profession')
                .assert.containsText('.io-ox-contacts-window .rightside .contact-header .profession', 'profession')
                .assert.containsText('.io-ox-contacts-window .rightside fieldset[data-block="job"] > dl > dd:nth-of-type(4)', 'company')
                .assert.containsText('.io-ox-contacts-window .rightside .contact-header .company', 'company')
                .assert.containsText('.io-ox-contacts-window .rightside fieldset[data-block="job"] > dl > dd:nth-of-type(5)', '101')
                // mail and messaging
                .assert.containsText('.io-ox-contacts-window .rightside fieldset[data-block="messaging"] > dl > dd:nth-of-type(1)', 'email1@test')
                .assert.containsText('.io-ox-contacts-window .rightside fieldset[data-block="messaging"] > dl > dd:nth-of-type(2)', 'email2@test')
                .assert.containsText('.io-ox-contacts-window .rightside fieldset[data-block="messaging"] > dl > dd:nth-of-type(3)', 'email3@test')
                .assert.containsText('.io-ox-contacts-window .rightside fieldset[data-block="messaging"] > dl > dd:nth-of-type(4)', 'instant_messenger1')
                .assert.containsText('.io-ox-contacts-window .rightside fieldset[data-block="messaging"] > dl > dd:nth-of-type(5)', 'instant_messenger2')
                // phone numbers
                .assert.containsText('.io-ox-contacts-window .rightside fieldset[data-block="phone"] > dl > dd:nth-of-type(1)', 'cellular_telephone1')
                .assert.containsText('.io-ox-contacts-window .rightside fieldset[data-block="phone"] > dl > dd:nth-of-type(2)', 'cellular_telephone2')
                .assert.containsText('.io-ox-contacts-window .rightside fieldset[data-block="phone"] > dl > dd:nth-of-type(3)', 'telephone_business1')
                .assert.containsText('.io-ox-contacts-window .rightside fieldset[data-block="phone"] > dl > dd:nth-of-type(4)', 'telephone_business2')
                .assert.containsText('.io-ox-contacts-window .rightside fieldset[data-block="phone"] > dl > dd:nth-of-type(5)', 'telephone_home1')
                .assert.containsText('.io-ox-contacts-window .rightside fieldset[data-block="phone"] > dl > dd:nth-of-type(6)', 'telephone_home2')
                .assert.containsText('.io-ox-contacts-window .rightside fieldset[data-block="phone"] > dl > dd:nth-of-type(7)', 'telephone_other')
                .assert.containsText('.io-ox-contacts-window .rightside fieldset[data-block="phone"] > dl > dd:nth-of-type(8)', 'fax_business')
                .assert.containsText('.io-ox-contacts-window .rightside fieldset[data-block="phone"] > dl > dd:nth-of-type(9)', 'fax_home')
                // business address
                .assert.containsText('.io-ox-contacts-window .rightside fieldset[data-block="business-address"] address', 'Business Street\nBusiness City\nBusiness State\n12345\nBusiness County')
                // home address
                .assert.containsText('.io-ox-contacts-window .rightside fieldset[data-block="home-address"] address', 'Home Street\nHome City\nHome State\n12345\nHome County')
                // other address
                .assert.containsText('.io-ox-contacts-window .rightside fieldset[data-block="other-address"] address', 'Other Street\nOther City\nOther State\n12345\nOther County')
                // comment
                .assert.containsText('.io-ox-contacts-window .rightside .comment', 'a comment in the comment field');

            client.logout();

        });

    });

});
