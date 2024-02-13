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

/// <reference path="../../steps.d.ts" />

Feature('Contacts > Misc');

Before(async ({ users }) => {
    await users.create();
    await users.create();
});
After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C8817] - Send E-Mail to contact', function ({ I, mail, users, search, contacts }) {
    const testrailID = 'C8817';
    const subject = Math.round(+new Date() / 1000);
    I.haveSetting('io.ox/mail//messageFormat', 'text');
    I.login('app=io.ox/contacts');
    contacts.waitForApp();
    search.doSearch(users[0].userdata.primaryEmail);
    I.waitForElement({ css: '[href="mailto:' + users[0].userdata.primaryEmail + '"]' });
    I.click({ css: '[href="mailto:' + users[0].userdata.primaryEmail + '"]' });
    I.waitForVisible('.io-ox-mail-compose');
    I.waitForElement('.floating-window-content .io-ox-mail-compose .mail-compose-fields');
    I.waitForVisible({ css: 'textarea.plain-text' });
    I.wait(0.2);
    I.fillField('.io-ox-mail-compose [name="subject"]', '' + testrailID + ' - ' + subject);
    I.fillField({ css: 'textarea.plain-text' }, testrailID);
    I.seeInField({ css: 'textarea.plain-text' }, testrailID);
    mail.send();
    I.wait(1);
    I.logout();
    I.login('app=io.ox/mail', { user: users[0] });
    mail.waitForApp();
    I.waitForElement('.list-item[aria-label*="' + testrailID + ' - ' + subject + '"]');
    I.doubleClick('.list-item[aria-label*="' + testrailID + ' - ' + subject + '"]');
    I.see(testrailID + ' - ' + subject);
    I.see(testrailID);
});

Scenario('Subscribe and unsubscribe shared address book', async function ({ I, users, contacts }) {

    const coreSettings = { autoOpenNotification: false, showDesktopNotifications: false };
    await I.haveSetting({ 'io.ox/core': coreSettings });
    await I.haveSetting({ 'io.ox/core': coreSettings }, { user: users[1] });

    //await users[1].hasConfig('com.openexchange.carddav.enabled', true);

    const defaultFolder = await I.grabDefaultFolder('contacts');
    const sharedAddressBookName = `${users[0].userdata.sur_name}, ${users[0].userdata.given_name}: New address book`;
    const busystate = locate('.modal modal-body.invisible');

    await I.haveFolder({
        title: 'New address book',
        module: 'contacts',
        parent: defaultFolder
    });

    I.login('app=io.ox/contacts');
    I.waitForText('My address books');
    I.retry(5).doubleClick('My address books');

    I.waitForText('New address book');
    I.rightClick({ css: '[aria-label^="New address book"]' });
    I.waitForText('Share / Permissions');
    I.wait(0.2);
    I.click('Share / Permissions');
    I.waitForText('Permissions for folder "New address book"');
    I.waitForDetached(busystate);
    I.wait(0.5);
    I.fillField('.modal-dialog .tt-input', users[1].userdata.primaryEmail);
    I.waitForText(`${users[1].userdata.sur_name}, ${users[1].userdata.given_name}`, undefined, '.tt-dropdown-menu');
    I.pressKey('ArrowDown');
    I.pressKey('Enter');
    I.click('Save');
    I.waitToHide('.share-permissions-dialog');
    I.logout();

    I.say('After share');
    I.login('app=io.ox/contacts', { user: users[1] });
    contacts.waitForApp();

    I.retry(5).doubleClick('~Shared address books');
    I.waitForText(sharedAddressBookName);
    I.click('Add new address book');
    I.click('Subscribe to shared address book');
    I.waitForText('Shared address books');
    I.seeCheckboxIsChecked(locate('li').withChild(locate('*').withText(sharedAddressBookName)).find({ css: 'input[name="subscribed"]' }));
    // TODO: enabled again once user can be provisioned with activated carddav capability
    //I.seeCheckboxIsChecked(locate('li').withChild(locate('*').withText(sharedAddressBookName)).find({ css: 'input[name="used_for_sync"]' }));

    I.click(locate('li').withChild(locate('*').withText(sharedAddressBookName)).find('.checkbox'));
    I.dontSeeCheckboxIsChecked(locate('li').withChild(locate('*').withText(sharedAddressBookName)).find({ css: 'input[name="subscribed"]' }));
    // TODO: enabled again once user can be provisioned with activated carddav capability
    // I.dontSeeCheckboxIsChecked(locate('li').withChild(locate('*').withText(sharedAddressBookName)).find({ css: 'input[name="used_for_sync"]' }));

    I.click('Save');
    I.waitForDetached('.modal-dialog');

    I.say('After save');
    I.waitForInvisible(locate('*').withText(sharedAddressBookName));

    I.click('Add new address book');
    I.click('Subscribe to shared address book');
    I.waitForText('Shared address books');

    I.dontSeeCheckboxIsChecked(locate('li').withChild(locate('*').withText(sharedAddressBookName)).find({ css: 'input[name="subscribed"]' }));
    // TODO: enabled again once user can be provisioned with activated carddav capability
    //I.dontSeeCheckboxIsChecked(locate('li').withChild(locate('*').withText(sharedAddressBookName)).find({ css: 'input[name="used_for_sync"]' }));

    I.click(locate('li').withChild(locate('*').withText(sharedAddressBookName)).find('.checkbox'));
    I.seeCheckboxIsChecked(locate('li').withChild(locate('*').withText(sharedAddressBookName)).find({ css: 'input[name="subscribed"]' }));
    // TODO: enabled again once user can be provisioned with activated carddav capability
    //I.dontSeeCheckboxIsChecked(locate('li').withChild(locate('*').withText(sharedAddressBookName)).find({ css: 'input[name="used_for_sync"]' }));
    //I.click(locate('li').withChild(locate('*').withText(sharedAddressBookName)).find({ css: 'label' }).withText('Sync via DAV'));

    I.click('Save');
    I.waitForDetached('.modal-dialog');

    I.waitForText(sharedAddressBookName);
});
