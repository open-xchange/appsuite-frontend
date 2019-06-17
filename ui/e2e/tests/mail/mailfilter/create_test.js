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
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

Scenario('[C7787] Add filter rule', async function (I, users) {
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
    I.seeElement('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] [data-action-id="0"]');
    I.see('Redirect to');
    I.seeElement('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] [data-action-id="0"] a.remove');

    // add condition
    I.click('Add condition');
    I.click('Subject');
    I.fillField('.tests [name="values"]', 'Test subject');

    // alert gone?
    I.dontSee('This rule applies to all messages. Please add a condition to restrict this rule to specific messages.');

    // condition and all components visible?
    I.see('Subject', '.list-title');
    I.see('Contains', '.dropdown-label');
    I.dontSeeElement('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] [data-test-id="0"] .row.has-error');
    I.seeElement('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] button[data-action="save"]');
    I.seeElement('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] [data-action-id="0"] a.remove');
    // save the form
    I.click('Save');

    I.waitForVisible('.io-ox-settings-window .settings-detail-pane li.settings-list-item[data-id="0"]');

    I.logout();

    I.login('app=io.ox/mail', { user: users[1] });

    // compose mail for user 0
    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    I.wait(1);
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', users[0].get('primaryEmail'));
    I.fillField('.io-ox-mail-compose [name="subject"]', 'Test subject');
    I.fillField({ css: 'textarea.plain-text' }, 'Test text');
    I.seeInField({ css: 'textarea.plain-text' }, 'Test text');

    I.click('Send');
    I.waitForElement('~Sent, 1 total');


    I.logout();

    I.login('app=io.ox/mail', { user: users[2] });

    // check for mail
    I.waitForVisible('.io-ox-mail-window .leftside ul li.unread');
    I.click('.io-ox-mail-window .leftside ul li.unread');
    I.waitForVisible('.io-ox-mail-window .mail-detail-pane .subject');
    I.see('Test subject', '.mail-detail-pane');
});

function createFilterRule(I, name, condition, comparison, value, flag, skipConditionProp) {
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

Scenario('[C7810] Filter mail using contains', async function (I, users) {
    let [user] = users;
    await I.haveSetting({
        'io.ox/mail': { messageFormat: 'text' }
    });

    createFilterRule(I, 'TestCase0395', 'Subject', 'Contains', 'TestCasexxx0395', 'Red');
    // save the form
    I.click('Save');
    I.waitForVisible('.io-ox-settings-window .settings-detail-pane li.settings-list-item[data-id="0"]');
    I.openApp('Mail');

    // compose mail
    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    I.wait(1);
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', user.get('primaryEmail'));
    I.fillField('.io-ox-mail-compose [name="subject"]', 'xxxTestCase0395xxx');
    I.fillField({ css: 'textarea.plain-text' }, 'This is a test');
    I.seeInField({ css: 'textarea.plain-text' }, 'This is a test');

    I.click('Send');

    // second mail
    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    I.wait(1);
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', user.get('primaryEmail'));
    I.fillField('.io-ox-mail-compose [name="subject"]', 'TestCasexxx0395');
    I.fillField({ css: 'textarea.plain-text' }, 'This is a test');
    I.seeInField({ css: 'textarea.plain-text' }, 'This is a test');

    I.click('Send');

    I.waitForElement('~Sent, 2 total');
    I.waitForElement('~Inbox, 2 unread, 2 total');

    I.waitForElement(locate('.list-item-row').withChild('.flag_1').withText('TestCasexxx0395'));
    I.waitForElement(locate('.list-item-row').withChild(':not(.flag_1)').withText('xxxTestCase0395xxx'));
});

Scenario('[C7811] Filter mail using is exactly', async function (I, users) {
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

    I.waitForElement('~Sent, 2 total');
    I.waitForElement('~Inbox, 2 unread, 2 total');

    I.waitForElement(locate('.list-item-row').withChild('.flag_1').withText('TestCase0396'));
    I.waitForElement(locate('.list-item-row').withChild(':not(.flag_1)').withText('xxxTestCase0396xxx'));

});

Scenario('[C7812] Filter mail using matches', async function (I, users) {
    let [user] = users;
    await I.haveSetting({
        'io.ox/mail': { messageFormat: 'text' }
    });

    createFilterRule(I, 'TestCase0397', 'Subject', 'Matches', '*Case0397*', 'Red');
    // save the form
    I.click('Save');
    I.waitForVisible('.io-ox-settings-window .settings-detail-pane li.settings-list-item[data-id="0"]');
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

    I.waitForElement('~Sent, 2 total');
    I.waitForElement('~Inbox, 2 unread, 2 total');

    I.waitForElement(locate('.list-item-row').withChild('.flag_1').withText('xxxTestCase0397xxx'));
    I.waitForElement(locate('.list-item-row').withChild(':not(.flag_1)').withText('xxx0397xxx'));

});

Scenario('[C7813] Filter mail using regex', async function (I, users) {
    let [user] = users;
    await I.haveSetting({
        'io.ox/mail': { messageFormat: 'text' }
    });

    createFilterRule(I, 'TestCase0398', 'Subject', 'Regex', 'TestCase0398.*', 'Red');
    // save the form
    I.click('Save');
    I.waitForVisible('.io-ox-settings-window .settings-detail-pane li.settings-list-item[data-id="0"]');
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

    I.waitForElement('~Sent, 2 total');
    I.waitForElement('~Inbox, 2 unread, 2 total');

    I.waitForElement(locate('.list-item-row').withChild('.flag_1').withText('TestCase0398xxx'));
    I.waitForElement(locate('.list-item-row').withChild(':not(.flag_1)').withText('xxxTestCase398xxx'));

});

Scenario('[C7814] Filter mail using IsBiggerThan', async function (I, users) {
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

    I.waitForVisible('.io-ox-settings-window .settings-detail-pane li.settings-list-item[data-id="0"]');
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
    I.click('Attachments');
    I.click('Add from Drive');

    I.waitForText('Principia.txt');
    I.click(locate('div.name').withText('Principia.txt').inside('.io-ox-fileselection'));
    // Add the file
    I.click('Add');

    // Wait for the filepicker to close
    I.waitForDetached('.io-ox-fileselection');

    I.click('Send');

    I.waitForElement('~Sent, 1 total');
    I.waitForElement('~Inbox, 1 unread, 1 total');

    I.waitForElement(locate('.list-item-row').withChild('.flag_1').withText('TestCase0400'));
});

Scenario('[C7815] Filter mail using IsSmallerThan', async function (I, users) {
    let [user] = users;
    await I.haveSetting({
        'io.ox/mail': { messageFormat: 'text' }
    });

    createFilterRule(I, 'TestCase0401', 'Size', null, null, 'Red', true);

    I.click('Is bigger than');
    I.waitForElement('.dropdown.open');
    I.see('Is smaller than', '.dropdown.open');
    I.click('Is smaller than', '.dropdown.open');

    I.fillField('sizeValue', '930');
    // save the form
    I.click('Save');

    I.waitForVisible('.io-ox-settings-window .settings-detail-pane li.settings-list-item[data-id="0"]');
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

    I.waitForElement('~Sent, 1 total');
    I.waitForElement('~Inbox, 1 unread, 1 total');
    I.waitForElement(locate('.list-item-row').withChild('.flag_1').withText('TestCase0401'));
});

Scenario('[C83386] Create mail filter based on mail', async function (I, users) {
    await I.haveSetting({
        'io.ox/mail': { messageFormat: 'text' }
    }, { user: users[0] });

    I.login('app=io.ox/mail', { user: users[0] });

    // compose mail for user 1
    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    I.wait(1);
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', users[1].get('primaryEmail'));
    I.fillField('.io-ox-mail-compose [name="subject"]', 'Test subject');
    I.fillField({ css: 'textarea.plain-text' }, 'Test text');
    I.seeInField({ css: 'textarea.plain-text' }, 'Test text');

    I.click('Send');
    I.waitForDetached('.io-ox-mail-compose-window');
    I.waitForElement('~Sent, 1 total');

    I.logout();

    I.login('app=io.ox/mail', { user: users[1] });

    // check for mail
    I.waitForVisible('.io-ox-mail-window .leftside ul li.unread');
    I.click('.io-ox-mail-window .leftside ul li.unread');
    I.waitForVisible('.io-ox-mail-window .mail-detail-pane .subject');
    I.see('Test subject', '.mail-detail-pane');
    I.waitForElement('~Trash');
    I.click('~More actions', '.inline-toolbar');
    I.waitForElement('.dropdown.open');
    I.see('Create filter rule', '.dropdown.open');
    I.click('Create filter rule');
    I.waitForText('Create new rule');

    // add action
    I.click('Add action');
    I.click('File into');

    I.click('Select folder');
    I.waitForElement('.folder-picker-dialog');

    I.waitForElement('[data-id="default0/INBOX/Trash"]', '.folder-picker-dialog');
    I.click('[data-id="default0/INBOX/Trash"]', '.folder-picker-dialog');
    I.waitForElement('[data-id="default0/INBOX/Trash"].selected', '.folder-picker-dialog');
    I.wait(1);
    I.click('Ok');
    // save the form
    I.click('Save');
    I.waitForDetached('.modal-backdrop.in');

    I.logout();

    I.login('app=io.ox/mail', { user: users[0] });

    // compose mail for user 1
    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    I.wait(1);
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', users[1].get('primaryEmail'));
    I.fillField('.io-ox-mail-compose [name="subject"]', 'Test subject');
    I.fillField({ css: 'textarea.plain-text' }, 'Test text');
    I.seeInField({ css: 'textarea.plain-text' }, 'Test text');

    I.click('Send');
    I.waitForDetached('.io-ox-mail-compose-window');
    I.waitForElement('~Sent, 1 total');

    I.logout();

    I.login('app=io.ox/mail', { user: users[1] });

    // check for mail
    I.waitForVisible('.io-ox-mail-window .mail-detail-pane .subject');
    I.see('Test subject', '.mail-detail-pane');
    I.waitForElement('~Trash, 1 unread, 1 total');

});

Scenario('[C274412] Filter mail by size', async function (I, users) {
    function createOrEditFilterRule(I, name, oldSize, newSize, edit) {
        I.click('[title=Settings]');
        I.waitForVisible('#topbar-settings-dropdown');
        I.click('Settings');

        I.waitForVisible('.io-ox-settings-main');
        I.selectFolder('Mail');
        I.waitForVisible('.rightside h1');

        // open mailfilter settings
        I.selectFolder('Filter Rules');

        // checks the h1 and the empty message
        I.waitForVisible('.io-ox-settings-window .settings-detail-pane .io-ox-mailfilter-settings h1');
        I.see('Mail Filter Rules');

        if (edit) {
            I.click('Edit', '.settings-list-view');
            I.waitForElement('.modal-dialog');
        } else {
            I.click('Add new rule');
            I.see('Create new rule');
            I.fillField('rulename', name);

            // add condition
            I.click('Add condition');
            I.click('[data-value="size"');

            // add action
            I.click('Add action');
            I.click('Set color flag');
        }

        I.click(oldSize);
        I.waitForElement('.dropdown.open');
        I.see(newSize, '.dropdown.open');
        I.click(newSize, '.dropdown.open');

        I.fillField('sizeValue', '1');

        I.click('Save');
        I.waitForDetached('.modal-dialog');
        I.waitForVisible('.io-ox-settings-window .settings-detail-pane li.settings-list-item[data-id="0"]');
    }

    let [user] = users;
    await I.haveSetting({
        'io.ox/mail': { messageFormat: 'text' }
    });

    I.login();

    createOrEditFilterRule(I, 'C274412', 'Byte', 'Byte');

    I.openApp('Mail');

    // compose mail
    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    I.wait(1);
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', user.get('primaryEmail'));
    I.fillField('.io-ox-mail-compose [name="subject"]', 'C274412');
    I.fillField({ css: 'textarea.plain-text' }, 'This is a test');
    I.seeInField({ css: 'textarea.plain-text' }, 'This is a test');
    I.attachFile('.mail-input [name="file"]', 'e2e/media/files/generic/2MB.dat');

    I.click('Send');
    I.wait(1);
    I.waitForElement('~Sent, 1 total');
    I.waitForElement('~Inbox, 1 unread, 1 total');
    I.see('C274412', '.subject');

    I.waitForElement(locate('.list-item-row').withChild('.flag_1').withText('C274412'));
    I.click(locate('.list-item-row').withChild('.flag_1').withText('C274412'));

    I.waitForElement('.inline-toolbar-container [data-action="io.ox/mail/actions/delete"]');
    I.click('Delete', '.inline-toolbar-container');
    I.waitForElement('~Inbox');

    createOrEditFilterRule(I, null, 'Byte', 'kB', true);

    I.openApp('Mail');
    I.waitForElement('.io-ox-mail-window');

    // compose mail
    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    I.wait(1);
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', user.get('primaryEmail'));
    I.fillField('.io-ox-mail-compose [name="subject"]', 'C274412');
    I.fillField({ css: 'textarea.plain-text' }, 'This is a test');
    I.seeInField({ css: 'textarea.plain-text' }, 'This is a test');
    I.attachFile('.mail-input [name="file"]', 'e2e/media/files/generic/2MB.dat');

    I.click('Send');
    I.wait(1);
    I.waitForElement('~Sent, 2 total');
    I.waitForElement('~Inbox, 1 unread, 1 total');
    I.see('C274412', '.subject');

    I.waitForElement(locate('.list-item-row').withChild('.flag_1').withText('C274412'));
    I.click(locate('.list-item-row').withChild('.flag_1').withText('C274412'));

    I.waitForElement('.inline-toolbar-container [data-action="io.ox/mail/actions/delete"]');
    I.click('Delete', '.inline-toolbar-container');
    I.waitForElement('~Inbox');

    createOrEditFilterRule(I, null, 'kB', 'MB', true);

    I.openApp('Mail');
    I.waitForElement('.io-ox-mail-window');

    // compose mail
    I.clickToolbar('Compose');
    I.waitForVisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    I.wait(1);
    I.fillField('.io-ox-mail-compose div[data-extension-id="to"] input.tt-input', user.get('primaryEmail'));
    I.fillField('.io-ox-mail-compose [name="subject"]', 'C274412');
    I.fillField({ css: 'textarea.plain-text' }, 'This is a test');
    I.seeInField({ css: 'textarea.plain-text' }, 'This is a test');
    I.attachFile('.mail-input [name="file"]', 'e2e/media/files/generic/2MB.dat');

    I.click('Send');
    I.wait(1);
    I.waitForElement('~Sent, 3 total');
    I.waitForElement('~Inbox, 1 unread, 1 total');
    I.see('C274412', '.subject');

    I.waitForElement(locate('.list-item-row').withChild('.flag_1').withText('C274412'));
});
