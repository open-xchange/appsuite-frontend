/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2018 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Ben Ehrengruber <ben.ehrengruber@open-xchange.com>
 */

/// <reference path="../../steps.d.ts" />

Feature('Contacts > Misc');

Before(async (users) => {
    await Promise.all([
        users.create(),
        users.create()
    ]);
});

After(async (users) => {
    await users.removeAll();
});

Scenario('[C308518] Subscribe / Unsubscribe public address book', async (I, contacts, dialogs, users) => {

    const toggleAddressBook = (state) => {
        const checkBoxLocator = locate('input[type="checkbox"]').inside(locate('.list-group-item').withText('All my friends'));
        const fn = state ? I.checkOption : I.uncheckOption;

        I.waitForText('Add new address book');
        I.click('Add new address book');
        I.clickDropdown('Subscribe to shared address book');
        dialogs.waitForVisible();
        fn(checkBoxLocator);
        dialogs.clickButton('Save');
        I.waitForDetached('.modal-dialog');
    };

    I.login('app=io.ox/contacts', { user: users[0] });
    contacts.waitForApp();
    //create new personal address book
    I.waitForText('Add new address book');
    I.click('Add new address book');
    I.clickDropdown('Personal address book');
    dialogs.waitForVisible();
    await within('.modal-dialog', () => {
        I.fillField('[placeholder="New address book"]', 'All my friends');
        I.checkOption('.checkbox input[type="checkbox"]');
    });
    dialogs.clickButton('Add');
    I.waitForDetached('.modal-dialog');

    //share address book with all users group
    I.waitForText('All my friends', 5, '.folder-tree');
    I.selectFolder('All my friends');
    I.waitForText('All my friends', 5, '.folder-name');
    I.openFolderMenu('All my friends');
    I.clickDropdown('Share / Permissions');
    dialogs.waitForVisible();
    await within('.modal-dialog', () => {
        I.waitForFocus('.tt-input');
        I.fillField('.tt-input[placeholder="Name or email address"]', 'All users');
        I.waitForVisible(locate('.tt-dropdown-menu').withText('All users'));
        I.pressKey('Enter');
        I.waitForVisible(locate('.permissions-view .row').withText('All users'));
    });
    dialogs.clickButton('Save');
    I.waitForDetached('.modal-dialog');

    //switch to second user
    I.logout();
    I.login('app=io.ox/contacts', { user: users[1] });
    contacts.waitForApp();
    toggleAddressBook(true);
    //check folder is present
    I.waitForText('All my friends', 5, '.folder-tree');
    //unsubscribe
    toggleAddressBook(false);
    I.dontSee('All my friends', '.folder-tree');
    toggleAddressBook(true);
    I.waitForText('All my friends', 5, '.folder-tree');
    I.logout();

    // remove public address book, since it's not always deleted correctly
    I.login('app=io.ox/contacts', { user: users[0] });
    contacts.waitForApp();
    I.waitForText('All my friends', 5, '.folder-tree');
    I.selectFolder('All my friends');
    I.waitForText('All my friends', 5, '.folder-name');
    I.openFolderMenu('All my friends');
    I.clickDropdown('Delete');
    dialogs.waitForVisible();
    dialogs.clickButton('Delete');
    I.waitForDetached('.modal-dialog');
});
