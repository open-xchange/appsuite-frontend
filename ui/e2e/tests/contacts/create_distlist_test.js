/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2018 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

Feature('Contacts > Distributionlist');

Before(async function (users) {
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

Scenario('adds a unsaved contact', function (I) {
    I.login('app=io.ox/contacts');
    I.waitForVisible('*[data-app-name="io.ox/contacts"]');

    I.waitForText('My address books');
    I.doubleClick('~My address books');
    I.click('~Contacts');
    I.waitForDetached('.classic-toolbar [data-dropdown="io.ox/contacts/toolbar/new"].disabled');
    I.clickToolbar('New');
    I.click('Add distribution list');
    I.waitForVisible('.io-ox-contacts-distrib-window');
    I.fillField('Name', 'Testlist');
    I.fillField('Add contact', 'test@tester.com');
    I.wait(0.5);
    I.pressKey('Enter');

    I.waitForVisible('a.halo-link');
    I.click('a.halo-link');

    I.waitForVisible('.io-ox-sidepopup');
    I.waitForVisible('.io-ox-sidepopup [data-action="io.ox/contacts/actions/add-to-contactlist"]');
    I.see('Add to address book', '.io-ox-sidepopup');
    I.click('Add to address book', '.io-ox-sidepopup');

    I.waitForVisible('.io-ox-contacts-edit-window');
    I.waitForVisible('[name="last_name"]');
    I.fillField('Last name', 'Lastname');

    I.click('Save', '.io-ox-contacts-edit-window');

    I.waitForDetached('.io-ox-contacts-edit-window');

    I.waitForVisible('.io-ox-sidepopup .io-ox-sidepopup-close');
    I.click('.io-ox-sidepopup [data-action="close"]');

    I.waitForVisible('.io-ox-contacts-distrib-window');
    I.click('Create list', '.io-ox-contacts-distrib-window');

    I.waitForDetached('.io-ox-contacts-distrib-window');
});
