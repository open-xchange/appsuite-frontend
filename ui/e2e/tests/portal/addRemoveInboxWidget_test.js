/**
* This work is provided under the terms of the CREATIVE COMMONS PUBLIC
* LICENSE. This work is protected by copyright and/or other applicable
* law. Any use of the work other than as authorized under this license
* or copyright law is prohibited.
*
* http://creativecommons.org/licenses/by-nc-sa/2.5/
* © 2019 OX Software GmbH, Germany. info@open-xchange.com
*
* @author Olena Stute <olena.stute@open-xchange.com>
*/

/// <reference path="../../steps.d.ts" />

Feature('Portal');

Before(async (users) => {
    await users.create();
});
After(async (users) => {
    await users.removeAll();
});

Scenario('[C7488] [C7484] Add/Remove Inbox widget', async (I, users, dialogs, portal) => {
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
    portal.waitForApp();
    portal.addWidget('Inbox');

    //Verify mail is shown in the list
    I.waitForElement('~Inbox');
    I.waitForElement('.widget[aria-label="Inbox"] .subject');
    I.see('Test subject', '.widget[aria-label="Inbox"]');

    // remove Inbox widget from portal
    I.click('~Inbox, Disable widget');
    dialogs.waitForVisible();
    dialogs.clickButton('Delete');

    // verify that the widget is removed
    I.dontSee('~Inbox');
});
