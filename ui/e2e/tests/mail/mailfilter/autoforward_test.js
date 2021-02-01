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
    await users.create();
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

Scenario('[C7786] Set auto-forward', async function ({ I, users, mail, dialogs }) {
    await I.haveSetting({
        'io.ox/mail': { messageFormat: 'text' }
    }, { user: users[0] });

    I.login('app=io.ox/settings', { user: users[0] });
    I.waitForVisible('.io-ox-settings-main .rightside h1');
    I.see('Basic settings', '.rightside h1');

    I.waitForVisible({ css: 'li[data-id="virtual/settings/io.ox/mail"]' });
    I.selectFolder('Mail');
    I.waitForVisible('.rightside .io-ox-mail-settings');
    I.see('Mail', '.rightside h1');

    I.waitForElement({ css: '[data-action="edit-auto-forward"]' });
    I.see('Auto forward ...', { css: '[data-action="edit-auto-forward"]' });
    I.click('Auto forward ...', '.form-group.buttons [data-action="edit-auto-forward"]');
    dialogs.waitForVisible();

    // check for all expexted elements
    I.seeElement('.modal-header input[name="active"]');

    // buttons
    I.see('Cancel', dialogs.locators.footer);
    I.see('Apply changes', dialogs.locators.footer);

    // form elements
    I.seeElement({ css: 'input[name="to"][disabled]' });
    I.seeElement({ css: 'input[name="copy"][disabled]' });
    I.seeElement({ css: 'input[name="processSub"][disabled]' });

    // enable
    I.click('.checkbox.switch.large', dialogs.locators.header);

    I.seeElement({ css: 'input[name="to"]:not([disabled])' });
    I.seeElement({ css: 'input[name="copy"]:not([disabled])' });
    I.seeElement({ css: 'input[name="processSub"]:not([disabled])' });

    // button disabled?
    I.seeElement('.modal-footer [data-action="save"][disabled]');

    I.fillField({ css: 'input[name="to"]' }, users[1].get('primaryEmail'));

    // button enabled?
    dialogs.clickButton('Apply changes');

    I.see('Auto forward ...', { css: '[data-action="edit-auto-forward"]' });

    I.waitForElement({ css: '[data-action="edit-auto-forward"] .fa-toggle-on' });
    I.waitForInvisible({ css: '[data-point="io.ox/mail/auto-forward/edit"]' });

    I.openApp('Mail');
    mail.waitForApp();

    // compose mail for user 0
    mail.newMail();
    // I.clickToolbar('Compose');
    // I.waitForVisible('.io-ox-mail-compose textarea.plain-text,.io-ox-mail-compose .contenteditable-editor');
    // I.wait(1);
    I.fillField('To', users[0].get('primaryEmail'));
    I.fillField('Subject', 'Test subject');
    I.fillField({ css: 'textarea.plain-text' }, 'Test text');
    I.seeInField({ css: 'textarea.plain-text' }, 'Test text');

    mail.send();
    I.waitForDetached('.io-ox-mail-compose');

    I.logout();

    I.login('app=io.ox/mail', { user: users[1] });
    mail.waitForApp();

    // check for mail
    I.waitForVisible('.io-ox-mail-window .leftside ul li.unread');
    I.click('.io-ox-mail-window .leftside ul li.unread');
    I.waitForVisible('.io-ox-mail-window .mail-detail-pane .subject');
    I.see('Test subject', '.mail-detail-pane');

});
