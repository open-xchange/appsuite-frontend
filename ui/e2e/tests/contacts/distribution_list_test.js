/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2018 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Björn Köster <bjoern.koester@open-xchange.com>
 */
/// <reference path="../../steps.d.ts" />

Feature('Contacts > Distributionlist');

Before(async function (users) {
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

Scenario('Add a distribution list to an existing distribution list', function (I) {

    I.login('app=io.ox/contacts');
    I.waitForVisible('[data-app-name="io.ox/contacts"]', 5);

    // create new address book
    I.waitForText('Add new address book', 5);
    I.click('Add new address book');
    I.waitForVisible('.modal-dialog');
    I.fillField('New address book', 'test address book');
    I.click('Add');
    I.waitForDetached('.modal-dialog');
    // create distribution list
    I.selectFolder('test address book');
    I.waitForText('Empty'); // Empty in list view
    I.waitForText('New contact');
    I.waitForDetached('a.dropdown-toggle.disabled');
    I.click('New contact');
    I.waitForVisible('.dropdown-menu');
    I.click('New distribution list');
    I.waitForVisible('.io-ox-contacts-distrib-window');
    I.fillField('Name', 'test distribution list one');
    I.fillField('Add contact', 'testdude1@test.case');
    I.pressKey('Enter');
    I.fillField('Add contact', 'testdude2@test.case');
    I.pressKey('Enter');
    I.fillField('Add contact', 'testdude3@test.case');
    I.pressKey('Enter');
    I.fillField('Add contact', 'testdude4@test.case');
    I.pressKey('Enter');
    I.click('Create list');
    I.waitForDetached('.io-ox-contacts-distrib-window');
    I.waitForText('test distribution list one', undefined, '.vgrid-cell');

    // create second list
    I.click('New contact');
    I.waitForVisible('.dropdown-menu');
    I.click('New distribution list');
    I.waitForVisible('.io-ox-contacts-distrib-window', 5);
    I.fillField('Name', 'test distribution list two');

    // search in address book for distribution list one
    I.click('~Select contacts');
    I.waitForVisible('.modal-header input.search-field', 5);
    I.waitForEnabled('.modal-header input.search-field', 5);
    I.fillField('~Search', 'test distribution list one');
    I.waitForText('test distribution list one', 5, '.modal li.list-item');
    I.click('test distribution list one', '.modal li.list-item');
    I.pressKey('Enter');
    I.waitForText('4 addresses selected', 5);
    I.see('test distribution list one', 'li.token');

    I.click('Select');
    I.waitForDetached('.modal-header input.search-field', 5);

    // add another address just for good measurement
    I.fillField('Add contact', 'testdude5@test.case');
    I.wait(0.5);
    I.pressKey('Enter');
    I.waitNumberOfVisibleElements('li.participant-wrapper.removable', 5);

    I.see('testdude1@test.case');
    I.see('testdude2@test.case');
    I.see('testdude3@test.case');
    I.see('testdude4@test.case');
    I.see('testdude5@test.case');

    I.click('Create list');
    I.waitForDetached('.io-ox-contacts-distrib-window', 5);

    I.see('test distribution list two');

    I.logout();

});
