/// <reference path="../../steps.d.ts" />

Feature('Contacts > Edit');

Before(async ({ users }) => {
    await Promise.all([
        users.create(),
        users.create()
    ]);
});

After(async function ({ users }) {
    await users.removeAll();
});

Scenario('[C7368] Delete permission ', async ({ I, contacts, users, dialogs }) => {
    // Login, open address book
    I.login('app=io.ox/contacts');
    contacts.waitForApp();
    I.waitForText('My address books');
    I.click('.folder-arrow', '~My address books');
    I.openFolderMenu('Contacts');

    // Open permission / sharing dialog for contacts folder and add internal user
    I.clickDropdown('Share / Permissions');
    dialogs.waitForVisible();
    I.click('~Select contacts');
    I.waitForElement('.list-view.address-picker li.list-item');
    I.fillField('Search', users[1].userdata.name);
    I.waitForText(users[1].userdata.name, 5, '.address-picker');
    I.click('.address-picker .list-item');
    I.click({ css: 'button[data-action="select"]' });
    I.waitForDetached('.address-picker');
    I.waitForElement(locate('.permissions-view .row').at(2));
    // save it
    dialogs.clickButton('Save');
    I.waitForDetached('.modal-dialog');
    I.logout();

    // verify with the internal user
    const sharedUserName = `${users[0].get('sur_name')}, ${users[0].get('given_name')}`;
    I.login({ user: users[1] });
    I.openApp('io.ox/contacts');
    contacts.waitForApp();
    I.waitForText('My address books');
    I.see('Shared address books');
    I.click('.folder-arrow', '~Shared address books');
    I.selectFolder(`${sharedUserName}: Contacts`);
    I.openFolderMenu(`${sharedUserName}: Contacts`);
    I.clickDropdown('Share / Permissions');
    dialogs.waitForVisible();
    I.waitForText('Author', locate('.permission.row').withAttr({ 'aria-label': `${users[1].get('sur_name')}, Internal user.` }));
    dialogs.clickButton('Close');
    I.waitForDetached('.modal-dialog');
    I.logout();

    // #2 delete permission
    I.login('app=io.ox/contacts');
    contacts.waitForApp();
    I.waitForText('My address books');
    I.selectFolder('Contacts');
    I.openFolderMenu('Contacts');
    I.clickDropdown('Share / Permissions');
    dialogs.waitForVisible();
    I.waitForElement('.btn[title="Actions"]');
    I.click('.btn[title="Actions"]');
    I.clickDropdown('Revoke access');
    dialogs.clickButton('Save');
    I.waitForDetached('.modal-dialog');
    I.logout();

    // #4 verify
    I.login({ user: users[1] });
    I.openApp('io.ox/contacts');
    contacts.waitForApp();
    I.waitForText('My address books');
    I.dontSee('Shared address books');

});
