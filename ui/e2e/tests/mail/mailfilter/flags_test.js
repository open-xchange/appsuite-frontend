/**
* This work is provided under the terms of the CREATIVE COMMONS PUBLIC
* LICENSE. This work is protected by copyright and/or other applicable
* law. Any use of the work other than as authorized under this license
* or copyright law is prohibited.
*
* http://creativecommons.org/licenses/by-nc-sa/2.5/
* © 2019 OX Software GmbH, Germany. info@open-xchange.com
*
* @author frank paczynski <frank.paczynski@open-xchange.com>
*/

/// <reference path="../../../steps.d.ts" />

const expect = require('chai').expect;

Feature('Mailfilter');

Before(async function ({ users }) {
    const user = await users.create();
    await user.hasConfig('com.openexchange.imap.attachmentMarker.enabled', true);
});

After(async function ({ users }) {
    await users.removeAll();
});

Scenario('Set IMAP tags rule: no tags', async function ({ I, users, settings, mailfilter, mail }) {
    const subject = 'TestCase0393';
    await I.haveSetting({
        'io.ox/mail': { messageFormat: 'text' }
    });

    I.say('Open mail filter pane');
    I.login('app=io.ox/settings');
    settings.waitForApp();
    settings.select('Mail');
    mailfilter.waitForApp();

    I.say('Create rule');
    mailfilter.newRule(subject);
    mailfilter.addSubjectCondition(subject);
    // flag of first rule should be overwritten
    mailfilter.addAction('Add IMAP keyword', 'a1');
    mailfilter.addAction('Set IMAP keywords', '');
    mailfilter.save();

    I.say('Compose mail');
    I.openApp('Mail');
    mail.waitForApp();
    mail.newMail();
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', users[0].get('primaryEmail'));
    I.fillField('.io-ox-mail-compose [name="subject"]', subject);
    I.fillField({ css: 'textarea.plain-text' }, 'This is a test');
    I.seeInField({ css: 'textarea.plain-text' }, 'This is a test');
    mail.send();

    I.say('Wait for mail');
    I.waitForElement('~Sent, 1 total. Right click for more options.', 30);
    I.waitForElement('~Inbox, 1 unread, 1 total. Right click for more options.', 30);

    I.say('Check (not displayed) IMAP flags');
    mail.selectMail(subject);
    const cid = await I.grabAttributeFrom({ css: '.list-view li.list-item.selected' }, 'data-cid');
    const value = await I.executeScript(function (cid) {
        return require('io.ox/mail/api').pool.get('detail').get(cid).get('user');
    }, cid);
    expect(value).to.eql([]);
});

Scenario('Set IMAP tags: two tags', async function ({ I, users, settings, mailfilter, mail }) {
    const subject = 'TestCase0399';
    await I.haveSetting({
        'io.ox/mail': { messageFormat: 'text' }
    });

    I.say('Open mail filter pane');
    I.login('app=io.ox/settings');
    settings.waitForApp();
    settings.select('Mail');
    mailfilter.waitForApp();

    I.say('Create rule');
    mailfilter.newRule(subject);
    mailfilter.addSubjectCondition(subject);
    // flag of first rule should be overwritten
    mailfilter.addAction('Add IMAP keyword', 'a1');
    mailfilter.addAction('Set IMAP keywords', '   a2    a3   ');
    mailfilter.addAction('Add IMAP keyword', 'a4');
    mailfilter.save();

    I.say('Compose mail');
    I.openApp('Mail');
    mail.waitForApp();
    mail.newMail();
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', users[0].get('primaryEmail'));
    I.fillField('.io-ox-mail-compose [name="subject"]', subject);
    I.fillField({ css: 'textarea.plain-text' }, 'This is a test');
    I.seeInField({ css: 'textarea.plain-text' }, 'This is a test');
    mail.send();

    I.say('Wait for mail');
    I.waitForElement('~Sent, 1 total. Right click for more options.', 30);
    I.waitForElement('~Inbox, 1 unread, 1 total. Right click for more options.', 30);

    I.say('Check (not displayed) IMAP flags');
    mail.selectMail(subject);
    const cid = await I.grabAttributeFrom({ css: '.list-view li.list-item.selected' }, 'data-cid');
    const value = await I.executeScript(function (cid) {
        return require('io.ox/mail/api').pool.get('detail').get(cid).get('user');
    }, cid);
    expect(value).to.eql(['$a2', '$a3', '$a4']);
});
