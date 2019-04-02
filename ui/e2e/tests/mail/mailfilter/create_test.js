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

Feature('Mail > Mailfilter');

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
