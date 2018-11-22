/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2018 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */
/// <reference path="../../steps.d.ts" />

Feature('Mail Listview');

Before(async function (users) {
    await users.create();
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

Scenario('remove mail from thread', async (I, users) => {
    I.haveSetting('io.ox/mail//viewOptions', {
        'default0/INBOX': {
            order: 'desc',
            thread: true
        }
    });
    const user = users[1];
    await I.haveMail({
        attachments: [{
            content: 'Hello world!',
            content_type: 'text/html',
            disp: 'inline'
        }],
        from: [[user.get('display_name'), user.get('primaryEmail')]],
        sendtype: 0,
        subject: 'Test subject',
        to: [[users[0].get('display_name'), users[0].get('primaryEmail')]]
    }, { user });
    await I.haveMail({
        attachments: [{
            content: 'Hello world!',
            content_type: 'text/html',
            disp: 'inline'
        }],
        from: [[user.get('display_name'), user.get('primaryEmail')]],
        sendtype: 0,
        subject: 'You should see this!',
        to: [[users[0].get('display_name'), users[0].get('primaryEmail')]]
    }, { user });

    I.login('', { user });

    I.waitForText('Sent objects', 5, '.folder-node');

    I.selectFolder('Sent objects');
    I.waitForElement('.list-view .selectable');
    // Seems to be the only reliable way to select the correct mail (Test subject)
    I.click('.list-view .selectable[data-index="0"]');

    I.click('Reply');
    I.waitForInvisible('.window-blocker.io-ox-busy');
    I.click('Send');
    // wait a little for everything to be sent
    I.wait(1);

    I.logout();
    I.login();

    I.waitForText('Test subject');
    // Seems to be the only reliable way to select the correct mail (Test subject)
    I.click('.list-view .selectable[data-index="0"]');
    // wait for 2 mails rendered in thread list
    I.waitForFunction(() => window.$('.mail-detail').length === 2);

    I.click('Delete', '.mail-detail.expanded .actions');
    I.wait(0.5);

    I.waitForElement('.fa-refresh.fa-spin-paused');

    // this should even be in the '.list-view .selected' context, but it needs more logic for threads
    I.see('Test subject', '.list-view');

    I.logout();
});
