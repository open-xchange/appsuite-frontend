/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
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
