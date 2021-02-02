/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 *
 */

/// <reference path="../../steps.d.ts" />

const expect = require('chai').expect;

Feature('Mail > Listview');

Before(async function ({ users }) {
    await users.create();
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

function getTestMail(from, to, opt) {
    opt = opt || {};
    return {
        attachments: [{
            content: opt.content,
            content_type: 'text/html',
            disp: 'inline'
        }],
        from: [[from.get('displayname'), from.get('primaryEmail')]],
        sendtype: 0,
        subject: opt.subject,
        to: [[to.get('displayname'), to.get('primaryEmail')]],
        folder_id: opt.folder,
        flags: opt.flags
    };
}

async function getTooltipValue(I, opt) {
    let tooltips = await I.grabAttributeFrom(opt.locator, opt.attribute);
    return [].concat(tooltips)[0];
}

Scenario('[C114381] Sender address is shown in tooltip', async function ({ I, users, mail }) {
    const user1 = users[0];
    const user2 = users[1];

    await I.haveMail(getTestMail(user1, user2, {
        subject: 'C114381:sent',
        content: '<p style="background-color:#ccc">[C114381] Sender address is shown in draft tooltip</p>'
    }));
    await I.haveMail(getTestMail(user1, user2, {
        subject: 'C114381:draft',
        content: '<p style="background-color:#ccc">[C114381] Sender address is shown in draft tooltip</p>',
        flags: 4
    }));

    // USER1
    I.say('Send mail and create draft', 'blue');
    I.login('app=io.ox/mail');
    mail.waitForApp();
    console.log('>' + user1.get('primaryEmail'));

    I.say('Check to in "send objects"', 'blue');
    I.selectFolder('Sent');
    I.waitForVisible('.leftside .list-view .list-item .from');
    I.waitForText('C114381:sent');
    let to = await getTooltipValue(I, { locator: '.leftside .list-view .list-item .from', attribute: 'title' });
    expect(to).to.be.equal(user2.get('primaryEmail'));

    I.say('Check to in "drafts"', 'blue');
    I.selectFolder('Drafts');
    I.waitForText('C114381:draft', 5, '.leftside .list-view .list-item .subject');
    let to2 = await getTooltipValue(I, { locator: '.leftside .list-view .list-item .from', attribute: 'title' });
    expect(to2).to.be.equal(user2.get('primaryEmail'));

    I.say(`logout "${user1.get('primaryEmail')}"`, 'blue');
    I.logout();

    // USER2
    I.say(`login "${user2.get('primaryEmail')}"`, 'blue');
    I.login('app=io.ox/mail', { user: user2 });
    mail.waitForApp();

    I.waitForText('C114381:sent');
    let from = await getTooltipValue(I, { locator: '.leftside .list-view .list-item .from', attribute: 'title' });
    expect(from).to.be.equal(user1.get('primaryEmail'));

    I.logout();
});

Scenario('remove mail from thread', async ({ I, users }) => {
    await I.haveSetting('io.ox/mail//viewOptions', {
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

    I.waitForText('Sent');

    I.selectFolder('Sent');
    I.waitForText('Test subject');
    I.click('.list-item[aria-label*="Test subject"]');

    I.waitForText('Reply', undefined, '.inline-toolbar');
    I.click('Reply');
    I.waitForVisible('.window-blocker.io-ox-busy');
    I.waitForInvisible('.window-blocker.io-ox-busy', 15);

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
    I.waitForElement('#io-ox-refresh-icon .fa-spin-paused');

    I.waitForElement('.mail-detail.expanded [data-toolbar]');
    I.click('Delete', '.mail-detail.expanded [data-toolbar]');

    // wait for refresh here, because the middleware needs to send new data
    // should really happen within 1s
    I.waitForElement('#io-ox-refresh-icon .fa-spin', 1);
    I.waitForElement('#io-ox-refresh-icon .fa-spin-paused');
    // give listview a moment to update
    I.wait(0.5);

    // this should even be in the '.list-view .selected' context, but it needs more logic for threads
    I.waitForText('Test subject', 5, '.list-view');

    I.waitNumberOfVisibleElements('.list-view .selectable', 2);
    I.clickToolbar('~Delete');
    I.seeNumberOfVisibleElements('.list-view .selectable', 1);
});
