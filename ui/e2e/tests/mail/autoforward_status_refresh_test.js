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

Feature('Mailfilter');

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

Scenario('checks if an auto forward rule is correctly listed after a status update', function ({ I, dialogs }) {

    I.haveMailFilterRule({
        'rulename': 'autoforward',
        'actioncmds': [
            { 'id': 'redirect', 'to': 'test@tester.com', 'copy': true }
        ],
        'active': true,
        'flags': ['autoforward'],
        'test': { 'id': 'true' }
    });

    I.login('app=io.ox/settings');
    I.waitForVisible('.io-ox-settings-main');
    I.waitForElement({ css: '[data-id="virtual/settings/io.ox/mail"]' });

    I.selectFolder('Mail');

    I.waitForVisible('.io-ox-settings-window .settings-detail-pane .io-ox-mail-settings h1');
    I.waitForVisible({ css: '[data-action="edit-auto-forward"] .fa-toggle-on' });
    I.click('Auto forward ...');

    dialogs.waitForVisible();
    I.click('.checkbox.switch.large', dialogs.locators.header);
    dialogs.clickButton('Apply changes');
    I.waitForDetached('.modal-dialog');

    I.selectFolder('Filter Rules');
    I.waitForElement('.io-ox-settings-window .io-ox-mailfilter-settings');
    I.waitForElement('.io-ox-mailfilter-settings .settings-list-item.disabled');
});

Scenario('checks if an avacation notice rule is correctly listed after a status update', function ({ I, users, dialogs }) {
    let [user] = users;

    I.haveMailFilterRule({
        'active': true,
        'actioncmds': [
            { 'days': '7', 'subject': 'test', 'text': 'test', 'id': 'vacation', 'addresses': [user.userdata.primaryEmail] }
        ],
        'test': { 'id': true },
        'flags': ['vacation'],
        'rulename': 'vacation notice'
    });

    I.login('app=io.ox/settings');
    I.waitForVisible('.io-ox-settings-main');
    I.waitForElement({ css: '[data-id="virtual/settings/io.ox/mail"]' });

    I.selectFolder('Mail');
    I.waitForVisible('.io-ox-settings-window .settings-detail-pane .io-ox-mail-settings h1');
    I.waitForVisible({ css: '[data-action="edit-vacation-notice"] .fa-toggle-on' });

    I.click('Vacation notice ...');

    dialogs.waitForVisible();
    I.click('.checkbox.switch.large', dialogs.locators.header);
    dialogs.clickButton('Apply changes');
    I.waitForDetached('.modal-dialog');

    I.selectFolder('Filter Rules');
    I.waitForElement('.io-ox-settings-window .io-ox-mailfilter-settings');
    I.waitForElement('.io-ox-mailfilter-settings .settings-list-item.disabled');
});
