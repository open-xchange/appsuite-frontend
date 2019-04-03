/// <reference path="../../steps.d.ts" />

Feature('Portal');
 
Before(async (users) => {
    await users.create();
});
After(async (users) => {
    await users.removeAll();
});

Scenario('[C7484] Remove a widget', async (I, users) => {
    let [user] = users;
    await I.haveMail({
        attachments: [{
            content: 'Test mail\r\n',
            content_type: 'text/plain',
            raw: true,
            disp: 'inline'
        }],
        from: [[user.get('displayname'), user.get('primaryEmail')]],
        sendtype: 0,
        subject: 'Test subject',
        to: [[user.get('displayname'), user.get('primaryEmail')]]
    });

    // clear the portal settings
    await I.haveSetting('io.ox/portal//widgets/user', '{}');
 
    //Add Inbox widget to Portal
    I.login('app=io.ox/portal');
    I.waitForVisible('.io-ox-portal');
    I.click('Add widget');
    I.waitForVisible('.io-ox-portal-settings-dropdown');
    I.click('Inbox');
    I.waitForVisible('.io-ox-dialog-popup');
    I.click('Save');

    // remove Inbox widget from portal
    I.waitForElement('~Inbox');
    I.click('~Inbox, Disable widget');
    I.waitForVisible({css: '.io-ox-dialog-popup'});
    I.click('Delete', '.io-ox-dialog-popup');
    
    // verify that the widget is removed
    I.dontSee('~Inbox');

    I.logout();
});