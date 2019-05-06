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

Before(async function (users) {
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

Scenario('adds and removes a autoforward rule', function (I) {
    I.login('app=io.ox/settings');
    I.waitForVisible('.io-ox-settings-main .rightside h1');
    I.see('Basic settings', '.rightside h1');

    I.waitForVisible('li[data-id="virtual/settings/io.ox/mail"]');
    I.selectFolder('Mail');
    I.waitForVisible('.rightside  .io-ox-mail-settings');
    I.see('Mail', '.rightside h1');

    I.waitForElement('[data-action="edit-auto-forward"]');
    I.see('Auto forward ...', '[data-action="edit-auto-forward"]');
    I.click('Auto forward ...', '.form-group.buttons [data-action="edit-auto-forward"]');
    I.waitForElement('[data-point="io.ox/mail/auto-forward/edit"]');

    // check for all expexted elements
    I.seeElement('.modal-header input[name="active"]');

    // buttons
    I.see('Cancel', '.modal-footer');
    I.see('Apply changes', '.modal-footer');

    // // form elements
    I.seeElement('input[name="to"][disabled]');
    I.seeElement('input[name="copy"][disabled]');
    I.seeElement('input[name="processSub"][disabled]');

    // enable
    I.click('.modal-header .checkbox.switch.large');

    I.seeElement('input[name="to"]:not([disabled])');
    I.seeElement('input[name="copy"]:not([disabled])');
    I.seeElement('input[name="processSub"]:not([disabled])');

    // button disabled?
    I.seeElement('.modal-footer [data-action="save"][disabled]');

    I.fillField('input[name="to"]', 'test@oxtest.com');

    // button enabled?
    I.waitForElement('.modal-footer [data-action="save"]:not([disabled])');

    I.click('.modal-footer button[data-action="save"]');

    I.see('Auto forward ...', '[data-action="edit-auto-forward"]');

    I.waitForElement('[data-action="edit-auto-forward"] .fa-toggle-on');
    I.waitForInvisible('[data-point="io.ox/mail/auto-forward/edit"]');

    // check notification in mail
    I.openApp('Mail');
    I.waitForElement('.window-container.io-ox-mail-window');
    I.waitForElement('a[data-action="edit-autoforward-notice"]');
    I.seeElement('a[data-action="edit-autoforward-notice"]');
    I.see('Auto forwarding is active', 'a[data-action="edit-autoforward-notice"]');

    I.click('a[data-action="edit-autoforward-notice"]');
    I.waitForElement('[data-point="io.ox/mail/auto-forward/edit"]');

    I.seeInField('input[name="to"]', 'test@oxtest.com');
    I.seeElement('input[name="processSub"]:checked');

    I.click('Cancel', '.modal-footer');

    I.logout();
});
