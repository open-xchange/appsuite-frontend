/**
* This work is provided under the terms of the CREATIVE COMMONS PUBLIC
* LICENSE. This work is protected by copyright and/or other applicable
* law. Any use of the work other than as authorized under this license
* or copyright law is prohibited.
*
* http://creativecommons.org/licenses/by-nc-sa/2.5/
* © 2019 OX Software GmbH, Germany. info@open-xchange.com
*
* @author Christoph Kopp <christoph.kopp@open-xchange.com>
*/

/// <reference path="../../../steps.d.ts" />

Feature('Mailfilter');

Before(async function ({ users }) {
    await Promise.all([
        users.create(),
        users.create()
    ]);
});

After(async function ({ users }) {
    await users.removeAll();
});

Scenario('[C7801] Keep filtered mail', async function ({ I, users, mail, mailfilter }) {
    const [user] = users;
    await I.haveSetting({
        'io.ox/mail': { messageFormat: 'text' }
    });

    I.login('app=io.ox/settings&folder=virtual/settings/io.ox/mailfilter');

    mailfilter.waitForApp();
    mailfilter.newRule('C7801');
    mailfilter.addSubjectCondition('C7801');
    mailfilter.addSimpleAction('Keep');
    mailfilter.save();

    I.openApp('Mail');

    // compose mail
    mail.newMail();
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', user.get('primaryEmail'));
    I.fillField('.io-ox-mail-compose [name="subject"]', 'C7801');
    I.fillField({ css: 'textarea.plain-text' }, 'This is a test');
    I.seeInField({ css: 'textarea.plain-text' }, 'This is a test');

    mail.send();
    I.waitForElement('~Sent, 1 total. Right click for more options.', 30);
    I.waitForElement('~Inbox, 1 unread, 1 total. Right click for more options.', 30);
    I.waitForText('C7801', 5, '.subject');
});

Scenario('[C7802] Discard filtered mail', async function ({ I, users, mailfilter }) {
    const [user] = users;
    await I.haveSetting({
        'io.ox/mail': { messageFormat: 'text' }
    });

    I.login('app=io.ox/settings&folder=virtual/settings/io.ox/mailfilter');

    mailfilter.waitForApp();
    mailfilter.newRule('TestCase0387');
    mailfilter.addSubjectCondition('TestCase0387');
    mailfilter.addSimpleAction('Discard');
    mailfilter.save();

    I.openApp('Mail');

    // compose mail
    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    I.wait(1);
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', user.get('primaryEmail'));
    I.fillField('.io-ox-mail-compose [name="subject"]', 'TestCase0387');
    I.fillField({ css: 'textarea.plain-text' }, 'This is a test');
    I.seeInField({ css: 'textarea.plain-text' }, 'This is a test');

    I.click('Send');
    I.waitForElement('~Sent, 1 total. Right click for more options.', 30);
    I.wait(1);
    I.seeElement('~Inbox');

});

Scenario('[C7803] Redirect filtered mail', async function ({ I, users, mailfilter }) {

    await I.haveSetting({
        'io.ox/mail': { messageFormat: 'text' }
    });

    I.login('app=io.ox/settings&folder=virtual/settings/io.ox/mailfilter');

    mailfilter.waitForApp();
    mailfilter.newRule('TestCase0388');
    mailfilter.addSubjectCondition('TestCase0388');
    mailfilter.addAction('Redirect to', users[1].get('primaryEmail'));
    mailfilter.save();

    I.openApp('Mail');

    // compose mail
    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    I.wait(1);
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', users[0].get('primaryEmail'));
    I.fillField('.io-ox-mail-compose [name="subject"]', 'TestCase0388');
    I.fillField({ css: 'textarea.plain-text' }, 'This is a test');
    I.seeInField({ css: 'textarea.plain-text' }, 'This is a test');

    I.click('Send');

    I.waitForElement('~Sent, 1 total. Right click for more options.', 30);
    I.wait(1);
    I.seeElement('~Inbox');
    I.logout();

    I.login('app=io.ox/mail', { user: users[1] });
    I.waitForElement('~Inbox, 1 unread, 1 total. Right click for more options.', 30);
    I.waitForText('TestCase0388', 5, '.subject');

});

Scenario('[C7804] Move to Folder filtered mail', async function ({ I, users, mailfilter }) {

    const folder = 'TestCase0389';

    await I.haveSetting({
        'io.ox/mail': { messageFormat: 'text' }
    });
    await I.haveFolder({ title: folder, module: 'mail', parent: 'default0/INBOX' });

    I.login('app=io.ox/settings&folder=virtual/settings/io.ox/mailfilter');

    mailfilter.waitForApp();
    mailfilter.newRule('TestCase0389');
    mailfilter.addSubjectCondition('TestCase0389');
    mailfilter.addSimpleAction('File into');

    I.click('Select folder');
    I.waitForVisible(locate('.folder-picker-dialog [data-id="virtual/myfolders"] .folder-arrow'));

    I.click('.folder-picker-dialog [data-id="virtual/myfolders"] .folder-arrow');
    I.waitForVisible(`.folder-picker-dialog [data-id="default0/INBOX/${folder}"]`, 5);
    I.click(`.folder-picker-dialog [data-id="default0/INBOX/${folder}"]`);
    I.waitForVisible(`.folder-picker-dialog [data-id="default0/INBOX/${folder}"].selected`, 5);
    I.wait(1);
    I.click('Select');

    mailfilter.save();

    I.openApp('Mail');

    // compose mail
    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    I.wait(1);
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', users[0].get('primaryEmail'));
    I.fillField('.io-ox-mail-compose [name="subject"]', 'TestCase0389');
    I.fillField({ css: 'textarea.plain-text' }, 'This is a test');
    I.seeInField({ css: 'textarea.plain-text' }, 'This is a test');

    I.click('Send');

    I.waitForVisible('~Sent, 1 total. Right click for more options.', 30);
    I.wait(1);
    I.waitForVisible('~Inbox', 30);
    I.click('.io-ox-mail-window .window-sidepanel [data-id="virtual/myfolders"] .folder-arrow');
    I.waitForVisible(`.io-ox-mail-window .window-sidepanel [data-id="default0/INBOX/${folder}"]`, 5);
    I.click(`.io-ox-mail-window .window-sidepanel [data-id="default0/INBOX/${folder}"]`);
    I.waitForVisible(`.io-ox-mail-window .window-sidepanel [data-id="default0/INBOX/${folder}"].selected`, 5);
    I.wait(1);
    I.waitForVisible('~TestCase0389, 1 unread. Right click for more options.', 30);
    I.see('TestCase0389', '.subject');

});

Scenario('[C7805] Reject with reason filtered mail', async function ({ I, users, mail, mailfilter }) {
    const [user1, user2] = users;

    await I.haveSetting({
        'io.ox/mail': { messageFormat: 'text' }
    }, { user: user2 });

    I.login('app=io.ox/settings&folder=virtual/settings/io.ox/mailfilter');
    mailfilter.waitForApp();
    mailfilter.newRule('TestCase0390');
    mailfilter.addSubjectCondition('TestCase0390');
    mailfilter.addSimpleAction('Reject with reason');
    I.fillField('text', 'TestCase0390');
    mailfilter.save();

    I.logout();

    I.login(['app=io.ox/mail'], { user: user2 });
    mail.waitForApp();
    mail.newMail();

    // compose mail
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', user1.get('primaryEmail'));
    I.fillField('.io-ox-mail-compose [name="subject"]', 'TestCase0390');
    I.fillField({ css: 'textarea.plain-text' }, 'This is a test');
    I.seeInField({ css: 'textarea.plain-text' }, 'This is a test');

    I.click('Send');
    I.waitForElement({ css: '[aria-label^="Sent, 1 total"]' }, 10);
    I.waitForElement({ css: '[aria-label^="Inbox, 1 unread, 1 total"]' });

    I.waitForText('Rejected: TestCase0390', 5, '.subject .drag-title');
    I.click('.list-item.selectable.unread');
    I.waitForText('was automatically rejected: TestCase0390', 5, '.text-preview');

});

Scenario('[C7806] Mark mail as filtered mail', async function ({ I, users, mailfilter }) {

    await I.haveSetting({
        'io.ox/mail': { messageFormat: 'text' }
    });

    I.login('app=io.ox/settings&folder=virtual/settings/io.ox/mailfilter');

    mailfilter.waitForApp();
    mailfilter.newRule('TestCase0391');
    mailfilter.addSubjectCondition('TestCase0391');
    mailfilter.addSimpleAction('Mark mail as');
    mailfilter.save();

    I.openApp('Mail');

    // compose mail
    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    I.wait(1);
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', users[0].get('primaryEmail'));
    I.fillField('.io-ox-mail-compose [name="subject"]', 'TestCase0391');
    I.fillField({ css: 'textarea.plain-text' }, 'This is a test');
    I.seeInField({ css: 'textarea.plain-text' }, 'This is a test');

    I.click('Send');

    I.waitForElement('~Sent, 1 total. Right click for more options.', 30);
    I.waitForElement('~Inbox, 1 total. Right click for more options.', 30);

});

Scenario('[C7807] Tag mail with filtered mail', async function ({ I, users, mailfilter }) {

    await I.haveSetting({
        'io.ox/mail': { messageFormat: 'text' }
    });

    // createFilterRule(I, 'TestCase0392', 'Set color flag');

    I.login('app=io.ox/settings&folder=virtual/settings/io.ox/mailfilter');

    mailfilter.waitForApp();
    mailfilter.newRule('TestCase0392');
    mailfilter.addSubjectCondition('TestCase0392');
    mailfilter.setFlag('Red');
    mailfilter.save();

    I.openApp('Mail');

    // compose mail
    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    I.wait(1);
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', users[0].get('primaryEmail'));
    I.fillField('.io-ox-mail-compose [name="subject"]', 'TestCase0392');
    I.fillField({ css: 'textarea.plain-text' }, 'This is a test');
    I.seeInField({ css: 'textarea.plain-text' }, 'This is a test');

    I.click('Send');

    I.waitForElement('~Sent, 1 total. Right click for more options.', 30);
    I.waitForElement('~Inbox, 1 unread, 1 total. Right click for more options.', 30);
    I.waitForElement('.vsplit .flag_1', 30);

});

Scenario('[C7809] Mark mail as deleted filtered mail', async function ({ I, users, mailfilter }) {

    await I.haveSetting({
        'io.ox/mail': { messageFormat: 'text' }
    });

    I.login('app=io.ox/settings&folder=virtual/settings/io.ox/mailfilter');

    mailfilter.waitForApp();
    mailfilter.newRule('TestCase0394');
    mailfilter.addSubjectCondition('TestCase0394');
    mailfilter.addSimpleAction('Mark mail as');

    I.click('seen');
    I.waitForElement('.dropdown.open');
    I.click('deleted');

    mailfilter.save();

    I.openApp('Mail');

    // compose mail
    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    I.wait(1);
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', users[0].get('primaryEmail'));
    I.fillField('.io-ox-mail-compose [name="subject"]', 'TestCase0394');
    I.fillField({ css: 'textarea.plain-text' }, 'This is a test');
    I.seeInField({ css: 'textarea.plain-text' }, 'This is a test');

    I.click('Send');

    I.waitForElement('~Sent, 1 total. Right click for more options.', 30);
    I.waitForElement('~Inbox, 1 unread, 1 total. Right click for more options.', 30);
    I.waitForText('TestCase0394', 5, '.unread.deleted .subject');

});
