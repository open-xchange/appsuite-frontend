/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

Feature('Mailfilter');

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

Scenario('adds and removes a autoforward rule', function ({ I, mail, dialogs }) {
    I.login('app=io.ox/settings');
    I.waitForVisible('.io-ox-settings-main .rightside h1');
    I.see('Basic settings', '.rightside h1');

    I.waitForVisible({ css: 'li[data-id="virtual/settings/io.ox/mail"]' });
    I.selectFolder('Mail');
    I.waitForVisible('.rightside  .io-ox-mail-settings');
    I.see('Mail', '.rightside h1');

    I.waitForElement({ css: '[data-action="edit-auto-forward"]' });
    I.click('Auto forward ...', '.form-group.buttons [data-action="edit-auto-forward"]');

    // check for all expexted elements
    dialogs.waitForVisible();
    I.seeElement('.modal-header input[name="active"]');

    // buttons
    I.see('Cancel', dialogs.locators.footer);
    I.see('Apply changes', dialogs.locators.footer);

    // // form elements
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

    I.fillField({ css: 'input[name="to"]' }, 'test@oxtest.com');

    // button enabled?
    dialogs.clickButton('Apply changes');
    I.waitForDetached('.modal-dialog');

    I.see('Auto forward ...', { css: '[data-action="edit-auto-forward"]' });

    I.waitForElement({ css: '[data-action="edit-auto-forward"] .fa-toggle-on' });
    I.waitForInvisible({ css: '[data-point="io.ox/mail/auto-forward/edit"]' });

    // check notification in mail
    I.openApp('Mail');
    mail.waitForApp();
    I.waitForElement({ css: 'a[data-action="edit-autoforward-notice"]' });
    I.see('Auto forwarding is active', { css: 'a[data-action="edit-autoforward-notice"]' });

    I.click({ css: 'a[data-action="edit-autoforward-notice"]' });
    dialogs.waitForVisible();

    I.seeInField({ css: 'input[name="to"]' }, 'test@oxtest.com');
    I.seeElement({ css: 'input[name="processSub"]:checked' });

    dialogs.clickButton('Cancel');
    I.waitForDetached('.modal-dialog');
});
