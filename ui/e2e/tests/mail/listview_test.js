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

Feature('Mail Listview').tag('4');

Before(async function (users) {
    await users.create();
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

Scenario.only('remove mail from thread', async (I, users) => {
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
    I.waitForText('Test subject', 5, '.subject');
    I.click('.list-item[aria-label*="Test subject"]');

    I.click('Reply');
    I.waitForVisible('.window-blocker.io-ox-busy');
    I.waitForInvisible('.window-blocker.io-ox-busy');

    I.click('Send');
    // wait a little for everything to be sent
    I.wait(1);

    I.logout();
    I.login();

    I.waitForText('Test subject', 5, '.subject');
    I.click('.list-item[aria-label*="Test subject"]');
    // wait for 2 mails rendered in thread list
    I.waitForFunction(() => window.$('.mail-detail').length === 2);

    // make sure nothing is currently loading
    I.waitForElement('.fa-refresh.fa-spin-paused');

    I.click('Delete', '.mail-detail.expanded [data-toolbar]');

    // wait for refresh here, because the middleware needs to send new data
    // should really happen within 1s
    I.waitForElement('.fa-refresh.fa-spin', 1);
    I.waitForElement('.fa-refresh.fa-spin-paused');
    // give listview a moment to update
    I.wait(0.5);

    // this should even be in the '.list-view .selected' context, but it needs more logic for threads
    I.see('Test subject', '.list-view');

    I.seeNumberOfVisibleElements('.list-view .selectable', 2);
    I.clickToolbar('~Delete');
    I.seeNumberOfVisibleElements('.list-view .selectable', 1);

    I.logout();
});
