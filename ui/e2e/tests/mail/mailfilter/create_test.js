/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

/// <reference path="../../../steps.d.ts" />

Feature('Mailfilter');

Before(async function ({ users }) {
    await users.create();
    await users.create();
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

Scenario('[C7787] Add filter rule', async function ({ I, users, mail, dialogs }) {
    await I.haveSetting({
        'io.ox/mail': { messageFormat: 'text' }
    }, { user: users[1] });

    I.login('app=io.ox/settings', { user: users[0] });
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
    dialogs.waitForVisible();
    I.see('Create new rule');
    I.see('This rule applies to all messages. Please add a condition to restrict this rule to specific messages.');
    I.see('Please define at least one action.');

    // add action
    I.click('Add action');
    I.click('Redirect to');
    I.fillField('to', users[2].get('primaryEmail'));

    // warnig gone?
    I.dontSee('Please define at least one action.');

    // action and all components visible?
    I.seeElement('.io-ox-mailfilter-edit [data-action-id="0"]');
    I.see('Redirect to');
    I.seeElement('.io-ox-mailfilter-edit [data-action-id="0"] button.remove');

    // add condition
    I.click('Add condition');
    I.click('Subject');
    I.fillField('.tests [name="values"]', 'Test subject');

    // alert gone?
    I.dontSee('This rule applies to all messages. Please add a condition to restrict this rule to specific messages.');

    // condition and all components visible?
    I.see('Subject', '.list-title');
    I.see('Contains', '.dropdown-label');
    I.dontSeeElement('.io-ox-mailfilter-edit [data-test-id="0"] .row.has-error');
    I.seeElement('.modal button[data-action="save"]');
    I.seeElement('.modal [data-action-id="0"] button.remove');
    // save the form
    dialogs.clickButton('Save');

    I.waitForVisible('.settings-detail-pane li.settings-list-item[data-id="0"]');

    I.logout();

    I.login('app=io.ox/mail', { user: users[1] });
    mail.waitForApp();

    // compose mail for user 0
    mail.newMail();
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', users[0].get('primaryEmail'));
    I.fillField('.io-ox-mail-compose [name="subject"]', 'Test subject');
    I.fillField({ css: 'textarea.plain-text' }, 'Test text');
    I.seeInField({ css: 'textarea.plain-text' }, 'Test text');

    mail.send();
    I.waitForElement('~Sent, 1 total. Right click for more options.', 30);


    I.logout();

    I.login('app=io.ox/mail', { user: users[2] });
    mail.waitForApp();

    // check for mail
    I.waitForVisible('.io-ox-mail-window .leftside ul li.unread');
    I.click('.io-ox-mail-window .leftside ul li.unread');
    I.waitForVisible('.io-ox-mail-window .mail-detail-pane .subject');
    I.see('Test subject', '.mail-detail-pane');
});

function createFilterRule(I, name, condition, comparison, value, flag, skipConditionProp) {
    I.login('app=io.ox/settings&folder=virtual/settings/io.ox/mailfilter');
    I.waitForVisible('.settings-detail-pane .io-ox-mailfilter-settings h1');
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
    I.click(condition);

    if (!skipConditionProp) {
        I.fillField('values', value);
        I.click('Contains');
        I.waitForElement('.dropdown.open');
        I.see(comparison, '.dropdown.open');
        I.click(comparison, '.dropdown.open');
    }

    // add action
    I.click('Add action');
    I.click('Set color flag');
    I.click('.actions .dropdown-toggle');
    I.waitForVisible('.flag-dropdown');
    I.click(flag, '.flag-dropdown');

}

Scenario('[C7810] Filter mail using contains', async function ({ I, users }) {
    let [user] = users;
    await I.haveSetting({
        'io.ox/mail': { messageFormat: 'text' }
    });

    createFilterRule(I, 'TestCase0395', 'Subject', 'Contains', 'TestCasexxx0395', 'Red');
    // save the form
    I.click('Save');
    I.waitForVisible('.settings-detail-pane li.settings-list-item[data-id="0"]');
    I.openApp('Mail');

    // compose mail
    I.clickToolbar('Compose');
    I.waitForElement('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input');
    I.wait(1);
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', user.get('primaryEmail'));
    I.fillField('.io-ox-mail-compose [name="subject"]', 'xxxTestCase0395xxx');
    I.fillField({ css: 'textarea.plain-text' }, 'This is a test');
    I.seeInField({ css: 'textarea.plain-text' }, 'This is a test');

    I.click('Send');

    // second mail
    I.clickToolbar('Compose');
    I.waitForElement('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input');
    I.wait(1);
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', user.get('primaryEmail'));
    I.fillField('.io-ox-mail-compose [name="subject"]', 'TestCasexxx0395');
    I.fillField({ css: 'textarea.plain-text' }, 'This is a test');
    I.seeInField({ css: 'textarea.plain-text' }, 'This is a test');

    I.click('Send');

    I.waitForElement('~Sent, 2 total. Right click for more options.', 30);
    I.waitForElement('~Inbox, 2 unread, 2 total. Right click for more options.', 30);

    I.waitForElement(locate('.list-item-row').withChild('.flag_1').withText('TestCasexxx0395'), 30);
    I.waitForElement(locate('.list-item-row').withChild(':not(.flag_1)').withText('xxxTestCase0395xxx'));
});

Scenario('[C7811] Filter mail using is exactly', async function ({ I, users }) {
    let [user] = users;
    await I.haveSetting({
        'io.ox/mail': { messageFormat: 'text' }
    });

    createFilterRule(I, 'TestCase0396', 'Subject', 'Is exactly', 'TestCase0396', 'Red');
    // save the form
    I.click('Save');
    I.waitForVisible('.io-ox-settings-window .settings-detail-pane li.settings-list-item[data-id="0"]');
    I.openApp('Mail');

    // compose mail
    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    I.wait(1);
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', user.get('primaryEmail'));
    I.fillField('.io-ox-mail-compose [name="subject"]', 'TestCase0396');
    I.fillField({ css: 'textarea.plain-text' }, 'This is a test');
    I.seeInField({ css: 'textarea.plain-text' }, 'This is a test');

    I.click('Send');

    // second mail
    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    I.wait(1);
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', user.get('primaryEmail'));
    I.fillField('.io-ox-mail-compose [name="subject"]', 'xxxTestCase0396xxx');
    I.fillField({ css: 'textarea.plain-text' }, 'This is a test');
    I.seeInField({ css: 'textarea.plain-text' }, 'This is a test');

    I.click('Send');

    I.waitForElement('~Sent, 2 total. Right click for more options.', 30);
    I.waitForElement('~Inbox, 2 unread, 2 total. Right click for more options.', 30);

    I.waitForElement(locate('.list-item-row').withChild('.flag_1').withText('TestCase0396'), 30);
    I.waitForElement(locate('.list-item-row').withChild(':not(.flag_1)').withText('xxxTestCase0396xxx'));

});

Scenario('[C7812] Filter mail using matches', async function ({ I, users }) {
    let [user] = users;
    await I.haveSetting({
        'io.ox/mail': { messageFormat: 'text' }
    });

    createFilterRule(I, 'TestCase0397', 'Subject', 'Matches', '*Case0397*', 'Red');
    // save the form
    I.click('Save');
    I.waitForVisible('.settings-detail-pane li.settings-list-item[data-id="0"]');
    I.openApp('Mail');

    // compose mail
    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    I.wait(1);
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', user.get('primaryEmail'));
    I.fillField('.io-ox-mail-compose [name="subject"]', 'xxxTestCase0397xxx');
    I.fillField({ css: 'textarea.plain-text' }, 'This is a test');
    I.seeInField({ css: 'textarea.plain-text' }, 'This is a test');

    I.click('Send');

    // second mail
    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    I.wait(1);
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', user.get('primaryEmail'));
    I.fillField('.io-ox-mail-compose [name="subject"]', 'xxx0397xxx');
    I.fillField({ css: 'textarea.plain-text' }, 'This is a test');
    I.seeInField({ css: 'textarea.plain-text' }, 'This is a test');

    I.click('Send');

    I.waitForElement('~Sent, 2 total. Right click for more options.', 30);
    I.waitForElement('~Inbox, 2 unread, 2 total. Right click for more options.', 30);

    I.waitForElement(locate('.list-item-row').withChild('.flag_1').withText('xxxTestCase0397xxx'), 30);
    I.waitForElement(locate('.list-item-row').withChild(':not(.flag_1)').withText('xxx0397xxx'));

});

Scenario('[C7813] Filter mail using regex', async function ({ I, users }) {
    let [user] = users;
    await I.haveSetting({
        'io.ox/mail': { messageFormat: 'text' }
    });

    createFilterRule(I, 'TestCase0398', 'Subject', 'Regex', 'TestCase0398.*', 'Red');
    // save the form
    I.click('Save');
    I.waitForVisible('.settings-detail-pane li.settings-list-item[data-id="0"]');
    I.openApp('Mail');

    // compose mail
    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    I.wait(1);
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', user.get('primaryEmail'));
    I.fillField('.io-ox-mail-compose [name="subject"]', 'TestCase0398xxx');
    I.fillField({ css: 'textarea.plain-text' }, 'This is a test');
    I.seeInField({ css: 'textarea.plain-text' }, 'This is a test');

    I.click('Send');

    // second mail
    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    I.wait(1);
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', user.get('primaryEmail'));
    I.fillField('.io-ox-mail-compose [name="subject"]', 'xxxTestCase398xxx');
    I.fillField({ css: 'textarea.plain-text' }, 'This is a test');
    I.seeInField({ css: 'textarea.plain-text' }, 'This is a test');

    I.click('Send');

    I.waitForElement('~Sent, 2 total. Right click for more options.', 30);
    I.waitForElement('~Inbox, 2 unread, 2 total. Right click for more options.', 30);

    I.waitForElement(locate('.list-item-row').withChild('.flag_1').withText('TestCase0398xxx'), 30);
    I.waitForElement(locate('.list-item-row').withChild(':not(.flag_1)').withText('xxxTestCase398xxx'));

});

Scenario('Filter mail by size Filter mail using IsBiggerThan', async function ({ I, users, mail }) {
    let [user] = users;
    await I.haveSetting({
        'io.ox/mail': { messageFormat: 'text' }
    });

    createFilterRule(I, 'TestCase0400', 'Size', 'Is bigger than', null, 'Red', true);
    I.fillField('sizeValue', '512');
    // save the form
    I.click('Save');

    await I.executeAsyncScript(function (done) {
        require(['settings!io.ox/core', 'io.ox/files/api'], function (settings, filesAPI) {
            var blob = new window.Blob(['fnord'], { type: 'text/plain' });
            filesAPI.upload({
                folder: settings.get('folder/infostore'), file: blob, filename: 'Principia.txt', params: {} }
            ).done(done);
        });
    });

    I.waitForVisible('.settings-detail-pane li.settings-list-item[data-id="0"]');
    I.openApp('Mail');

    // compose mail
    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    I.wait(1);
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', user.get('primaryEmail'));
    I.fillField('.io-ox-mail-compose [name="subject"]', 'TestCase0400');
    I.fillField({ css: 'textarea.plain-text' }, 'This is a test');
    I.seeInField({ css: 'textarea.plain-text' }, 'This is a test');

    // Open Filepicker
    I.click(mail.locators.compose.drivefile);

    I.waitForText('Principia.txt');
    I.click(locate('div.name').withText('Principia.txt').inside('.io-ox-fileselection'));
    // Add the file
    I.click('Add');

    // Wait for the filepicker to close
    I.waitForDetached('.io-ox-fileselection');

    I.click('Send');

    I.waitForElement('~Sent, 1 total. Right click for more options.', 30);
    I.waitForElement('~Inbox, 1 unread, 1 total. Right click for more options.', 30);

    I.waitForElement(locate('.list-item-row').withChild('.flag_1').withText('TestCase0400'), 30);
});

Scenario('Filter mail using validated size', async function ({ I }) {
    await I.haveSetting({
        'io.ox/mail': { messageFormat: 'text' }
    });

    createFilterRule(I, 'TestCaseSome', 'Size', null, null, 'Red', true);
    let disabledButton = locate({ css: '.modal-footer .btn-primary[disabled]' }).as('Disabled button'),
        enabledButton = locate({ css: '.modal-footer .btn-primary:not([disabled])' }).as('Enabled button');

    // valid
    I.say('Enter valid value for Byte');
    I.fillField('sizeValue', '3');
    I.waitForElement(enabledButton);

    // invalid
    I.say('Switch to GB that causes value to be invalid');
    I.click('Byte');
    I.waitForElement('.dropdown.open');
    I.see('GB', '.dropdown.open');
    I.click('GB', '.dropdown.open');
    I.waitForElement(disabledButton);

    // valid
    I.say('Enter valid value for GB');
    I.fillField('sizeValue', '1');
    I.waitForElement(enabledButton);

    // invalid, add action (triggers redraw)
    I.say('Enter invalid value for GB and trigger redraw');
    I.fillField('sizeValue', '3');
    I.click('Add action');
    I.click('Keep');
    I.waitForElement(disabledButton);
});

Scenario('[C7815] Filter mail using IsSmallerThan', async function ({ I, users }) {
    let [user] = users;
    await I.haveSetting({
        'io.ox/mail': { messageFormat: 'text' }
    });

    createFilterRule(I, 'TestCase0401', 'Size', null, null, 'Red', true);

    I.click('Is bigger than');
    I.waitForElement('.dropdown.open');
    I.see('Is smaller than', '.dropdown.open');
    I.click('Is smaller than', '.dropdown.open');

    I.fillField('sizeValue', '2048');
    // save the form
    I.click('Save');

    I.waitForVisible('.settings-detail-pane li.settings-list-item[data-id="0"]');
    I.openApp('Mail');

    // compose mail
    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    I.wait(1);
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', user.get('primaryEmail'));
    I.fillField('.io-ox-mail-compose [name="subject"]', 'TestCase0401');
    I.fillField({ css: 'textarea.plain-text' }, 'This is a test');
    I.seeInField({ css: 'textarea.plain-text' }, 'This is a test');

    I.click('Send');

    I.waitForElement('~Sent, 1 total. Right click for more options.', 30);
    I.waitForElement('~Inbox, 1 unread, 1 total. Right click for more options.', 30);
    I.waitForElement(locate('.list-item-row').withChild('.flag_1').withText('TestCase0401'), 30);
});

Scenario('[C83386] Create mail filter based on mail', async function ({ I, users, mail, dialogs }) {
    await I.haveSetting({
        'io.ox/mail': { messageFormat: 'text' }
    }, { user: users[0] });

    I.login('app=io.ox/mail', { user: users[0] });
    mail.waitForApp();

    // compose mail for user 1
    mail.newMail();
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', users[1].get('primaryEmail'));
    I.fillField('.io-ox-mail-compose [name="subject"]', 'Test subject');
    I.fillField({ css: 'textarea.plain-text' }, 'Test text');
    I.seeInField({ css: 'textarea.plain-text' }, 'Test text');

    mail.send();
    I.waitForElement('~Sent, 1 total. Right click for more options.', 30);

    I.logout();

    I.login('app=io.ox/mail', { user: users[1] });
    mail.waitForApp();

    // check for mail
    I.waitForVisible('.io-ox-mail-window .leftside ul li.unread');
    I.click('.io-ox-mail-window .leftside ul li.unread');
    I.waitForVisible('.io-ox-mail-window .mail-detail-pane .subject');
    I.see('Test subject', '.mail-detail-pane');
    I.waitForElement('~Trash');
    I.retry(5).click('~More actions', '.inline-toolbar');
    I.clickDropdown('Create filter rule');
    dialogs.waitForVisible();
    I.waitForText('Create new rule');

    // add action
    I.click('Add action');
    I.click('File into');

    I.click('Select folder');
    I.waitForElement('.folder-picker-dialog');

    I.waitForElement({ css: '[data-id="default0/INBOX/Trash"]' }, '.folder-picker-dialog');
    I.click({ css: '[data-id="default0/INBOX/Trash"]' }, '.folder-picker-dialog');
    I.waitForElement({ css: '[data-id="default0/INBOX/Trash"].selected' }, '.folder-picker-dialog');
    I.wait(1);
    I.click('Select');
    // save the form
    dialogs.clickButton('Save');
    I.waitForDetached('.modal-dialog');

    I.logout();

    I.login('app=io.ox/mail', { user: users[0] });
    mail.waitForApp();

    // compose mail for user 1
    mail.newMail();
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', users[1].get('primaryEmail'));
    I.fillField('.io-ox-mail-compose [name="subject"]', 'Test subject');
    I.fillField({ css: 'textarea.plain-text' }, 'Test text');
    I.seeInField({ css: 'textarea.plain-text' }, 'Test text');

    mail.send();
    I.waitForDetached('.io-ox-mail-compose-window');
    I.waitForElement('~Sent, 1 total. Right click for more options.', 30);

    I.logout();

    I.login('app=io.ox/mail', { user: users[1] });
    mail.waitForApp();

    // check for mail
    I.waitForVisible('.io-ox-mail-window .mail-detail-pane .subject');
    I.see('Test subject', '.io-ox-mail-window .mail-detail-pane .subject');
    I.waitForElement('~Trash, 1 unread, 1 total. Right click for more options.', 30);

});

Scenario('[C274412] Filter mail by size', async function ({ I, users, mail, dialogs }) {
    function createOrEditFilterRule(I, name, oldSize, newSize, edit) {
        I.openApp('Settings', { folder: 'virtual/settings/io.ox/mailfilter' });
        I.waitForText('Mail Filter Rules', 30, '.settings-detail-pane h1');

        if (edit) {
            I.click('Edit', '.settings-list-view');
            dialogs.waitForVisible();
        } else {
            I.click('Add new rule');
            dialogs.waitForVisible();
            I.see('Create new rule');
            I.fillField('rulename', name);

            // add condition
            I.click('Add condition');
            I.click({ css: '[data-value="size"' });

            // add action
            I.click('Add action');
            I.click('Set color flag');
        }

        I.click(oldSize);
        I.waitForElement('.dropdown.open');
        I.see(newSize, '.dropdown.open');
        I.click(newSize, '.dropdown.open');

        I.fillField('sizeValue', '1');

        dialogs.clickButton('Save');
        I.waitForDetached('.modal-dialog');
        I.waitForVisible('.settings-detail-pane li.settings-list-item[data-id="0"]');
    }
    let [user] = users;
    let listItem = locate('.list-item-row').withChild('.flag_1').withText('C274412').as('Mail in list view');

    await I.haveSetting({
        'io.ox/mail': { messageFormat: 'text' }
    });

    I.login();

    I.say('Create filter rule');
    createOrEditFilterRule(I, 'C274412', 'Byte', 'Byte');

    I.openApp('Mail');
    mail.waitForApp();

    // compose mail
    I.say('Compose #1');
    mail.newMail();
    I.fillField('To', user.get('primaryEmail'));
    I.fillField('Subject', 'C274412');
    I.fillField({ css: 'textarea.plain-text' }, 'This is a test');
    I.seeInField({ css: 'textarea.plain-text' }, 'This is a test');
    I.attachFile('.io-ox-mail-compose-window .composetoolbar input[type="file"]', 'e2e/media/files/generic/2MB.dat');

    mail.send();
    I.waitForElement('~Sent, 1 total. Right click for more options.', 30);
    I.waitForElement('~Inbox, 1 unread, 1 total. Right click for more options.', 30);
    I.waitForText('C274412', 5, '.subject');

    I.waitForElement(listItem, 30);
    I.click(listItem);

    I.waitForElement('.inline-toolbar-container [data-action="io.ox/mail/actions/delete"]');
    I.click('Delete', '.inline-toolbar-container');
    I.waitForElement('~Inbox');

    createOrEditFilterRule(I, null, 'Byte', 'kB', true);

    I.openApp('Mail');
    mail.waitForApp();

    // compose mail
    I.say('Compose #2');
    mail.newMail();
    I.fillField('To', user.get('primaryEmail'));
    I.fillField('Subject', 'C274412');
    I.fillField({ css: 'textarea.plain-text' }, 'This is a test');
    I.seeInField({ css: 'textarea.plain-text' }, 'This is a test');
    I.attachFile('.io-ox-mail-compose-window .composetoolbar input[type="file"]', 'e2e/media/files/generic/2MB.dat');

    mail.send();
    I.waitForElement('~Sent, 2 total. Right click for more options.', 30);
    I.waitForElement('~Inbox, 1 unread, 1 total. Right click for more options.', 30);
    I.waitForText('C274412', 5, '.subject');

    I.waitForElement(listItem, 30);
    I.click(listItem);

    I.waitForElement('.inline-toolbar-container [data-action="io.ox/mail/actions/delete"]');
    I.click('Delete', '.inline-toolbar-container');
    I.waitForElement('~Inbox');

    createOrEditFilterRule(I, null, 'kB', 'MB', true);

    I.openApp('Mail');
    mail.waitForApp();

    // compose mail
    I.say('Compose #3');
    mail.newMail();
    I.fillField('To', user.get('primaryEmail'));
    I.fillField('Subject', 'C274412');
    I.fillField({ css: 'textarea.plain-text' }, 'This is a test');
    I.seeInField({ css: 'textarea.plain-text' }, 'This is a test');
    I.attachFile('.io-ox-mail-compose-window .composetoolbar input[type="file"]', 'e2e/media/files/generic/2MB.dat');

    mail.send();
    I.waitForElement('~Sent, 3 total. Right click for more options.', 30);
    I.waitForElement('~Inbox, 1 unread, 1 total. Right click for more options.', 30);
    I.waitForText('C274412', 5, '.subject');

    I.waitForElement(listItem, 30);
});
