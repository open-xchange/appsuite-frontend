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
 */

/// <reference path="../../../steps.d.ts" />

Feature('Mail Compose > Real drafts');

Before(async (users) => {
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});
const expect = require('chai').expect;
const iframeLocator = '.io-ox-mail-compose-window .editor iframe';
const editor = locate('.io-ox-mail-compose-window .editor iframe');
const taskbaritem = locate('.taskbar-button');

Scenario('[RD001] Refresh draft folder on change', async function (I, mail) {
    const mailSubject = 'RD001';
    const defaultText = 'Some text';

    await I.haveSetting('io.ox/mail//autoSaveAfter', 2000);
    await I.haveSetting('io.ox/mail//features/registerProtocolHandler', false);

    I.login('app=io.ox/mail');
    mail.waitForApp();
    I.selectFolder('Drafts');

    // creates space (inital save)
    I.say('1. creates space (inital save)');
    mail.newMail();
    I.waitForText('No subject');

    // update space
    I.say('2. update space');
    await within({ frame: iframeLocator }, async () => {
        I.click('.default-style');
        I.fillField({ css: 'body' }, defaultText);
    });
    I.fillField('Subject', mailSubject);
    I.waitForText(mailSubject, 5, '.list-view');
});

Scenario('[RD002] Restore open space on "edit draft"', async function (I, mail) {

    await I.haveSetting('io.ox/mail//autoSaveAfter', 5000);
    await I.haveSetting('io.ox/mail//features/registerProtocolHandler', false);

    // create space/draft
    I.login('app=io.ox/mail');
    mail.waitForApp();
    mail.newMail();
    I.wait(0.5);
    I.logout();

    // check: draft and taskbar item
    I.login('app=io.ox/mail');
    mail.waitForApp();
    I.selectFolder('Drafts');
    I.waitForText('No subject');
    I.seeElement(taskbaritem);

    // restore initially minimized taskbar item
    I.say('1. restore initially minimized taskbar item ');
    mail.selectMail('No subject');
    I.clickToolbar('Edit draft');
    I.waitForElement(editor);
    I.dontSeeElement(taskbaritem);

    // restore minimized taskbar item when clicking "edit draft
    I.say('2. restore minimized taskbar item');
    I.click('~Minimize', '.io-ox-mail-compose-window');
    I.waitForElement(taskbaritem);
    I.waitForInvisible(editor);
    I.clickToolbar('Edit draft');
    I.waitForElement(editor);
    I.dontSeeElement(taskbaritem);
    I.logout();

    // restore maximized taskbar item when clicking "edit draft
    I.say('3. restore maximized taskbar item ');
    I.login('app=io.ox/mail');
    mail.waitForApp();
    I.selectFolder('Drafts');
    I.waitForText('No subject');
    mail.selectMail('No subject');
    I.click(taskbaritem);
    I.waitForElement(editor);
    I.clickToolbar('Edit draft');
    I.wait(0.5);

    I.waitForFunction(() => window.$('.io-ox-mail-compose-window').length === 1);
});

Scenario('[RD003] Handle deleted drafts/spaces', async function (I, mail) {

    await I.haveSetting('io.ox/mail//autoSaveAfter', 2000);
    await I.haveSetting('io.ox/mail//features/registerProtocolHandler', false);

    let cidbefore, cidafter;

    I.login('app=io.ox/mail');
    mail.waitForApp();
    I.selectFolder('Drafts');

    // creates space (inital save)
    I.say('1. creates space (inital save)');
    mail.newMail();
    I.click('~Minimize', '.io-ox-mail-compose-window');
    I.waitForElement(taskbaritem);
    I.waitForInvisible(editor);
    I.wait(0.5);
    cidbefore = await I.executeScript(() => { return _.last(ox.ui.apps.models).cid; });

    // delete space by deleting draft
    I.say('2. delete space by deleting draft');
    mail.selectMail('No subject');
    I.waitForElement('.classic-toolbar [data-action="io.ox/mail/actions/delete"]');
    I.click('.classic-toolbar [data-action="io.ox/mail/actions/delete"]');

    // wait for notitifation dialog
    I.say('3. wait for notitication dialog');
    I.click(taskbaritem);
    I.waitForElement(editor);
    I.waitForElement('.modal.flex');

    // clone and update cid
    I.say(`4. clone and update cid (old: ${cidbefore})`);
    I.click('Restore');
    I.waitForElement('.io-ox-mail-compose-window .io-ox-busy');
    I.waitForDetached('.io-ox-mail-compose-window .io-ox-busy');
    cidafter = await I.executeScript(() => { return _.last(ox.ui.apps.models).cid; });

    I.say(`5. check cid (new: ${cidafter})`);
    expect(cidbefore).is.not.equal(cidafter);
});
