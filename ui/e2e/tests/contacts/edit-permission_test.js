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


Scenario('[C7365] Edit permission ', async ({ I, contacts, users, dialogs }) => {

    // #1 Login, open address book
    I.login('app=io.ox/contacts');
    contacts.waitForApp();
    I.waitForText('My address books');
    I.click('.folder-arrow', '~My address books');
    I.openFolderMenu('Contacts');

    // #2 Open permission / sharing dialog for contacts folder and add internal user
    I.clickDropdown('Permissions / Invite people');
    dialogs.waitForVisible();
    I.click('~Select contacts');
    I.waitForElement('.list-view.address-picker li.list-item');
    I.fillField('Search', users[1].userdata.name);
    I.waitForText(users[1].userdata.name, 5, '.address-picker');
    I.click('.address-picker .list-item');
    I.click({ css: 'button[data-action="select"]' });
    I.waitForDetached('.address-picker');
    I.waitForElement(locate('.permissions-view .row').at(2));
    // #3 save it

    dialogs.clickButton('Save');
    I.waitForDetached('.modal-dialog');
    I.logout();

    // #4 verify with the internal user
    const sharedUserName = `${users[0].get('sur_name')}, ${users[0].get('given_name')}`;
    I.login({ user: users[1] });
    I.openApp('io.ox/contacts');
    contacts.waitForApp();
    I.waitForText('My address books');
    I.see('Shared address books');
    I.click('.folder-arrow', '~Shared address books');
    I.selectFolder(`${sharedUserName}: Contacts`);
    I.openFolderMenu(`${sharedUserName}: Contacts`);
    I.clickDropdown('Permissions / Invite people');
    dialogs.waitForVisible();
    I.waitForText('Author', locate('.permission.row').withAttr({ 'aria-label': `${users[1].get('sur_name')}, Internal user.` }));
    dialogs.clickButton('Close');
    I.waitForDetached('.modal-dialog');
    I.logout();

    // #5 change permission from author to viewer
    I.login('app=io.ox/contacts');
    contacts.waitForApp();
    I.waitForText('My address books');
    I.selectFolder('Contacts');
    I.openFolderMenu('Contacts');
    I.clickDropdown('Permissions / Invite people');
    dialogs.waitForVisible();
    I.click('Author');
    I.clickDropdown('Viewer');
    dialogs.clickButton('Save');
    I.waitForDetached('.modal-dialog');
    I.logout();

    // #6 verify
    I.login({ user: users[1] });
    I.openApp('io.ox/contacts');
    contacts.waitForApp();
    I.waitForText('My address books');
    I.see('Shared address books');
    I.selectFolder(`${sharedUserName}: Contacts`);
    I.openFolderMenu(`${sharedUserName}: Contacts`);
    I.clickDropdown('Permissions / Invite people');
    dialogs.waitForVisible();
    I.waitForText('Viewer', locate('.permission.row').withAttr({ 'aria-label': `${users[1].get('sur_name')}, Internal user.` }));
    dialogs.clickButton('Close');
    I.waitForDetached('.modal-dialog');
    I.logout();

    // #7 change permission from author to viewer
    I.login('app=io.ox/contacts');
    contacts.waitForApp();
    I.waitForText('My address books');
    I.selectFolder('Contacts');
    I.openFolderMenu('Contacts');
    I.clickDropdown('Permissions / Invite people');
    dialogs.waitForVisible();
    I.click('Viewer');
    I.clickDropdown('Reviewer');
    dialogs.clickButton('Save');
    I.waitForDetached('.modal-dialog');
    I.logout();

    // #6 verify
    I.login({ user: users[1] });
    I.openApp('io.ox/contacts');
    contacts.waitForApp();
    I.waitForText('My address books');
    I.see('Shared address books');
    I.selectFolder(`${sharedUserName}: Contacts`);
    I.openFolderMenu(`${sharedUserName}: Contacts`);
    I.clickDropdown('Permissions / Invite people');
    dialogs.waitForVisible();
    I.waitForText('Reviewer', locate('.permission.row').withAttr({ 'aria-label': `${users[1].get('sur_name')}, Internal user.` }));
    dialogs.clickButton('Close');
    I.waitForDetached('.modal-dialog');
    I.logout();
});
