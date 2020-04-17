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

Before(async function (users) {
    await users.create();
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

function createFilterRule(I, name, action) {
    I.login('app=io.ox/settings');
    I.waitForVisible('.io-ox-settings-main');
    I.selectFolder('Mail');
    I.waitForVisible('.rightside h1');

    // open mailfilter settings
    I.selectFolder('Filter Rules');

    // checks the h1 and the empty message
    I.waitForVisible('.io-ox-settings-window .settings-detail-pane .io-ox-mailfilter-settings h1');
    I.see('Mail Filter Rules');

    I.see('There is no rule defined');

    // create a test rule and check the inintial display
    I.click('Add new rule');
    I.see('Create new rule');
    I.see('This rule applies to all messages. Please add a condition to restrict this rule to specific messages.');
    I.see('Please define at least one action.');

    I.fillField('rulename', name);

    // add condition
    I.click('Add condition');
    I.click('Subject');
    I.fillField('values', name);

    // add action
    I.click('Add action');
    I.click(action);

}

Scenario('[C7801] Keep filtered mail', async function (I, users, mail) {
    let [user] = users;
    await I.haveSetting({
        'io.ox/mail': { messageFormat: 'text' }
    });

    createFilterRule(I, 'C7801', 'Keep');
    // save the form
    I.click('Save');
    I.waitForVisible('.settings-detail-pane li.settings-list-item[data-id="0"]');

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

Scenario('[C7802] Discard filtered mail', async function (I, users) {
    let [user] = users;
    await I.haveSetting({
        'io.ox/mail': { messageFormat: 'text' }
    });

    createFilterRule(I, 'TestCase0387', 'Discard');
    // save the form
    I.click('Save');
    I.waitForVisible('.io-ox-settings-window .settings-detail-pane li.settings-list-item[data-id="0"]');

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

Scenario('[C7803] Redirect filtered mail', async function (I, users) {

    await I.haveSetting({
        'io.ox/mail': { messageFormat: 'text' }
    });

    createFilterRule(I, 'TestCase0388', 'Redirect to');
    I.fillField('to', users[1].get('primaryEmail'));
    // save the form
    I.click('Save');
    I.waitForVisible('.settings-detail-pane li.settings-list-item[data-id="0"]');

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

Scenario('[C7804] Move to Folder filtered mail', async function (I, users) {

    let folder = 'TestCase0389';

    await I.haveSetting({
        'io.ox/mail': { messageFormat: 'text' }
    });
    await I.haveFolder({ title: folder, module: 'mail', parent: 'default0/INBOX' });

    createFilterRule(I, 'TestCase0389', 'File into');
    I.click('Select folder');
    I.waitForVisible(locate('.folder-picker-dialog [data-id="virtual/myfolders"] .folder-arrow'));

    I.click('.folder-picker-dialog [data-id="virtual/myfolders"] .folder-arrow');
    I.waitForVisible(`.folder-picker-dialog [data-id="default0/INBOX/${folder}"]`, 5);
    I.click(`.folder-picker-dialog [data-id="default0/INBOX/${folder}"]`);
    I.waitForVisible(`.folder-picker-dialog [data-id="default0/INBOX/${folder}"].selected`, 5);
    I.wait(1);
    I.click('Ok');

    // save the form
    I.click('Save');
    I.waitForVisible('.settings-detail-pane li.settings-list-item[data-id="0"]');

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

// only works for external accounts
Scenario.skip('[C7805] Reject with reason filtered mail', async function (I, users) {

    await I.haveSetting({
        'io.ox/mail': { messageFormat: 'text' }
    });

    createFilterRule(I, 'TestCase0390', 'Reject with reason');
    I.fillField('text', 'TestCase0390');

    // save the form
    I.click('Save');
    I.waitForVisible('.io-ox-settings-window .settings-detail-pane li.settings-list-item[data-id="0"]');

    I.openApp('Mail');

    // compose mail
    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    I.wait(1);
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', users[0].get('primaryEmail'));
    I.fillField('.io-ox-mail-compose [name="subject"]', 'TestCase0390');
    I.fillField({ css: 'textarea.plain-text' }, 'This is a test');
    I.seeInField({ css: 'textarea.plain-text' }, 'This is a test');

    I.click('Send');

    I.waitForElement('~Sent, 1 total');
    I.wait(1);
    I.waitForElement('~Inbox, 1 unread, 1 total');
    I.see('Automatically rejected mail', '.subject');
    I.see('The following reason was given: TestCase0390', '.text-preview');

});

Scenario('[C7806] Mark mail as filtered mail', async function (I, users) {

    await I.haveSetting({
        'io.ox/mail': { messageFormat: 'text' }
    });

    createFilterRule(I, 'TestCase0391', 'Mark mail as');

    // save the form
    I.click('Save');
    I.waitForVisible('.settings-detail-pane li.settings-list-item[data-id="0"]');

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

Scenario('[C7807] Tag mail with filtered mail', async function (I, users) {

    await I.haveSetting({
        'io.ox/mail': { messageFormat: 'text' }
    });

    createFilterRule(I, 'TestCase0392', 'Set color flag');

    // save the form
    I.click('Save');
    I.waitForVisible('.settings-detail-pane li.settings-list-item[data-id="0"]');

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

Scenario('[C7809] Mark mail as deleted filtered mail', async function (I, users) {

    await I.haveSetting({
        'io.ox/mail': { messageFormat: 'text' }
    });

    createFilterRule(I, 'TestCase0394', 'Mark mail as');
    I.click('seen');
    I.waitForElement('.dropdown.open');
    I.click('deleted');

    // save the form
    I.click('Save');
    I.waitForVisible('.settings-detail-pane li.settings-list-item[data-id="0"]');

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
    I.see('TestCase0394', '.unread.deleted .subject');

});
