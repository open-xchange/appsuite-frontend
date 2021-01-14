/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Alexander Quast <alexander.quast@open-xchange.com>
 *
 */

/// <reference path="../../../steps.d.ts" />

Feature('Settings > Mail');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C7771] Permanently remove deleted mails', async ({ I, users, mail, dialogs }) => {
    const user = users[0];

    await I.haveMail({
        attachments: [{
            content: 'Lorem ipsum',
            content_type: 'text/html',
            disp: 'inline'
        }],
        from: [[user.get('display_name'), user.get('primaryEmail')]],
        sendtype: 0,
        subject: 'Delete this',
        to: [[users[0].get('display_name'), users[0].get('primaryEmail')]]
    }, { user });

    I.login('app=io.ox/settings&folder=virtual/settings/io.ox/mail');
    I.waitForVisible('.io-ox-mail-settings');
    I.click('Permanently remove deleted emails');

    I.openApp('Mail');
    mail.waitForApp();

    I.waitForText('Delete this');
    I.click('.list-item.selectable');
    I.waitForVisible('h1.subject');
    I.wait(1);
    I.click('Delete');

    dialogs.waitForVisible();
    I.waitForText('Do you want to permanently delete this mail?', dialogs.locators.body);
    dialogs.clickButton('Delete');
    I.waitForDetached('.modal-dialog');

    I.selectFolder('Trash');
    I.waitForText('Empty');
});

