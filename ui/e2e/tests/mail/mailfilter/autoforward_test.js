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
