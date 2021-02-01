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

Before(async ({ users }) => {
    await users.create();
});
After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C7487] Remove a mail', async ({ I, users, portal, mail, dialogs }) => {
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

    I.login('app=io.ox/mail');
    mail.waitForApp();

    // click on first email
    I.waitForText('Test subject', 5, '.io-ox-mail-window .leftside');
    I.click('.io-ox-mail-window .leftside ul li.list-item[aria-label*="Test subject"]');
    I.waitForVisible('.io-ox-mail-window .mail-detail-pane .subject');
    I.clickToolbar({ css: '.io-ox-mail-window .classic-toolbar [data-action="more"]' });
    // add mail to Portal
    I.click('Add to portal', '.dropdown.open .dropdown-menu');

    // remove mail widget from portal
    I.openApp('Portal');
    portal.waitForApp();
    I.waitForElement('~Test subject');
    I.waitForElement('~Test subject, Disable widget');
    I.click('~Test subject, Disable widget');

    dialogs.waitForVisible();
    dialogs.clickButton('Delete');
    I.waitForDetached('.modal-dialog');

    // verify that the widget is removed
    I.dontSee('~Test subject');
    I.click('Customize this page');
    I.waitForText('Portal settings');
    I.dontSee('Test subject');
});
