/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Daniel Pondruff <daniel.pondruff@open-xchange.com>
 */

/// <reference path="../../steps.d.ts" />

Feature('Mail > Delete');

Before(async ({ users }) => {
    await users.create();
    await users.create();
});
After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C7405] - Delete E-Mail', function ({ I, users }) {
    const [user] = users,
        testrailID = 'C7405',
        timestamp = Math.round(+new Date() / 1000);
    I.haveSetting('io.ox/mail//messageFormat', 'text');
    I.login('app=io.ox/mail', { user });
    I.waitForVisible('.io-ox-mail-window');
    I.clickToolbar('Compose');
    I.waitForFocus('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input');
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', users[1].userdata.primaryEmail);
    I.pressKey('Enter');
    I.fillField('.io-ox-mail-compose [name="subject"]', '' + testrailID + ' - ' + timestamp);
    I.fillField({ css: 'textarea.plain-text' }, '' + testrailID + ' - ' + timestamp);
    I.click('Send');
    I.waitForDetached('.io-ox-mail-compose');
    I.logout();
    I.login('app=io.ox/mail', { user: users[1] });
    I.selectFolder('Inbox');
    I.waitForVisible('.selected .contextmenu-control');
    I.retry(5).click({ css: '[title="' + testrailID + ' - ' + timestamp + '"]' });
    I.clickToolbar('Delete');
    I.retry(5).dontSee(testrailID + ' - ' + timestamp);
    I.selectFolder('Trash');
    I.retry(5).see(testrailID + ' - ' + timestamp);
});

Scenario('[C7406] - Delete several E-Mails', async function ({ I, users }) {
    const [user] = users,
        testrailID = 'C7406',
        timestamp = Math.round(+new Date() / 1000);
    I.haveSetting('io.ox/mail//messageFormat', 'text');
    let mailcount = 2;
    let i;
    for (i = 0; i < mailcount; i++) {
        await I.haveMail({
            attachments: [{
                content: 'C7406\r\n',
                content_type: 'text/plain',
                raw: true,
                disp: 'inline'
            }],
            from: [[user.get('displayname'), user.get('primaryEmail')]],
            sendtype: 0,
            subject: testrailID + ' - ' + timestamp + ' - ' + [i + 1],
            to: [[user.get('displayname'), user.get('primaryEmail')]]
        });
    }
    I.login('app=io.ox/mail', { user: users[0] });
    I.selectFolder('Inbox');
    I.waitForVisible('.selected .contextmenu-control');
    for (i = 0; i < mailcount; i++) {
        I.waitForElement({ css: '[title="' + testrailID + ' - ' + timestamp + ' - ' + [i + 1] + '"]' });
        I.click({ css: '[title="' + testrailID + ' - ' + timestamp + ' - ' + [i + 1] + '"]' });
        I.clickToolbar('Delete');
        I.waitForDetached({ css: '[title="' + testrailID + ' - ' + timestamp + ' - ' + [i + 1] + '"]' });
    }
    I.selectFolder('Trash');
    let loopcounter = 0;
    while (await I.grabNumberOfVisibleElements('.mail-item .list-item') !== 2) {
        I.waitForElement('.fa-spin-paused.fa-refresh');
        I.click('#io-ox-refresh-icon');
        I.waitForElement('.fa-spin-paused.fa-refresh');
        I.wait(1);
        loopcounter++;
        if (loopcounter === 15) {
            break;
        }
    }
    I.waitForElement({ css: '[title="' + testrailID + ' - ' + timestamp + ' - 1"]' });
    I.waitForElement({ css: '[title="' + testrailID + ' - ' + timestamp + ' - 2"]' });
});

Scenario('[C265146] Delete with setting selectBeforeDelete=false', async function ({ I, users }) {

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

    const [user1, user2] = users;

    await I.haveSetting(
        'io.ox/mail//features/selectBeforeDelete', false, { user: user2 });
    await I.haveMail(getTestMail(user1, user2, {
        subject: 'Test Mail 1',
        content: 'Testing is still fun'
    }));
    await I.haveMail(getTestMail(user1, user2, {
        subject: 'Test Mail 2',
        content: 'Testing is still awesome'
    }));

    I.login('app=io.ox/mail', { user: user2 });
    let loc = locate('li.list-item.selectable').withAttr({ 'data-index': '0' });
    I.waitForText('Test Mail 1');
    I.retry(5).click(loc);
    I.clickToolbar('Delete');
    I.waitForText('No message selected');
});
