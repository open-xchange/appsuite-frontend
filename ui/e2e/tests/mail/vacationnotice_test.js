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

Feature('Mailfilter > Vacation notice');

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

Scenario('adds and removes a vacation notice', function ({ I, mail, dialogs }) {
    I.login('app=io.ox/settings');
    I.waitForVisible('.rightside h1');
    I.see('Basic settings', '.rightside h1');

    I.waitForElement('.tree-container li[data-id="virtual/settings/io.ox/mail"]');
    I.selectFolder('Mail');
    I.waitForVisible('.rightside  .io-ox-mail-settings');
    I.see('Mail', '.rightside h1');

    I.waitForVisible('.settings-detail-pane [data-action="edit-vacation-notice"]');
    I.see('Vacation notice ...', '.settings-detail-pane [data-action="edit-vacation-notice"]');
    I.click('Vacation notice ...', '.settings-detail-pane [data-action="edit-vacation-notice"]');
    dialogs.waitForVisible();

    // check for all expexted elements
    I.seeElement('.modal-header input[name="active"]');

    // buttons
    I.see('Cancel', dialogs.locators.footer);
    I.see('Apply changes', dialogs.locators.footer);

    // form elements
    I.seeElement('.modal input[name="activateTimeFrame"][disabled]');
    I.seeElement('.modal input[name="dateFrom"][disabled]');
    I.seeElement('.modal input[name="dateUntil"][disabled]');
    I.seeElement('.modal input[name="subject"][disabled]');
    I.seeElement('.modal textarea[name="text"][disabled]');
    I.see('Show advanced options');

    // enable
    I.click('.checkbox.switch.large', dialogs.locators.header);


    I.seeElement('.modal input[name="activateTimeFrame"]:not([disabled])');
    I.seeElement('.modal input[name="subject"]:not([disabled])');
    I.seeElement('.modal textarea[name="text"]:not([disabled])');

    I.fillField('.modal input[name="subject"]', 'Subject');
    I.fillField('.modal textarea[name="text"]', 'Text');

    dialogs.clickButton('Apply changes');

    I.see('Vacation notice ...', '.settings-detail-pane [data-action="edit-vacation-notice"]');

    I.waitForElement('.settings-detail-pane [data-action="edit-vacation-notice"] .fa-toggle-on');
    I.waitForInvisible('.modal[data-point="io.ox/mail/vacation-notice/edit"]');

    // check notification in mail
    I.openApp('Mail');
    mail.waitForApp();
    I.waitForElement('.alert a[data-action="edit-vacation-notice"]');
    I.see('Your vacation notice is active', '.alert a[data-action="edit-vacation-notice"]');

    I.click('.alert a[data-action="edit-vacation-notice"]');
    dialogs.waitForVisible();

    I.seeInField('.modal input[name="subject"]', 'Subject');
    I.seeInField('.modal textarea[name="text"]', 'Text');

    I.seeElement('.modal input[name="dateFrom"][disabled]');
    I.seeElement('.modal input[name="dateUntil"][disabled]');

    I.checkOption('Send vacation notice during this time only');

    I.waitForElement('.modal input[name="dateFrom"]:not([disabled])');
    I.seeElement('.modal input[name="dateFrom"]:not([disabled])');

    I.waitForElement('.modal input[name="dateUntil"]:not([disabled])');
    I.seeElement('.modal input[name="dateUntil"]:not([disabled])');

    dialogs.clickButton('Cancel');
    I.waitForDetached('.modal-dialog');
});
