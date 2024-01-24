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

Scenario('checks if an auto forward rule with copy statement is handled correctly', function ({ I, dialogs }) {

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
    I.seeCheckboxIsChecked('Keep a copy of the message');

    dialogs.clickButton('Cancel');
    I.waitForDetached('.modal-dialog');
});

Scenario('checks if an auto forward rule with keep statement is handled correctly', function ({ I, dialogs }) {
    I.haveMailFilterRule({
        'rulename': 'autoforward',
        'actioncmds': [
            { 'id': 'redirect', 'to': 'test@tester.com' },
            { 'id': 'keep' }
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
    I.seeCheckboxIsChecked('Keep a copy of the message');

    dialogs.clickButton('Cancel');
    I.waitForDetached('.modal-dialog');
});

Scenario('checks if an auto forward rule with keep statement is written correctly', function ({ I, users, dialogs }) {
    let [user] = users;

    user.hasConfig('com.openexchange.mail.filter.blacklist.actions', 'copy');

    I.login('app=io.ox/settings');
    I.waitForVisible('.io-ox-settings-main');
    I.waitForElement({ css: '[data-id="virtual/settings/io.ox/mail"]' });

    I.selectFolder('Mail');

    I.waitForVisible('.io-ox-settings-window .settings-detail-pane .io-ox-mail-settings h1');
    I.waitForElement({ css: '[data-action="edit-auto-forward"]' });
    I.click('Auto forward ...');

    dialogs.waitForVisible();
    I.click('.checkbox.switch.large', dialogs.locators.header);
    I.fillField('Forward all incoming emails to this address', 'test@tester.com');
    I.checkOption('Keep a copy of the message');
    dialogs.clickButton('Apply changes');
    I.waitForDetached('.modal-dialog');

    I.waitForVisible({ css: '[data-action="edit-auto-forward"] .fa-toggle-on' });
    I.click('Auto forward ...');
    dialogs.waitForVisible();
    I.seeCheckboxIsChecked('Keep a copy of the message');
    dialogs.clickButton('Cancel');
    I.waitForDetached('.modal-dialog');
    I.waitForVisible({ css: '[data-action="edit-auto-forward"] .fa-toggle-on' });
});

Scenario('checks if an auto forward rule with copy statement is written correctly', function ({ I, dialogs }) {

    I.login('app=io.ox/settings');
    I.waitForVisible('.io-ox-settings-main');
    I.waitForElement({ css: '[data-id="virtual/settings/io.ox/mail"]' });

    I.selectFolder('Mail');

    I.waitForVisible('.io-ox-settings-window .settings-detail-pane .io-ox-mail-settings h1');
    I.waitForElement({ css: '[data-action="edit-auto-forward"]' });
    I.click('Auto forward ...');

    dialogs.waitForVisible();
    I.click('.checkbox.switch.large', dialogs.locators.header);
    I.fillField('Forward all incoming emails to this address', 'test@tester.com');
    I.checkOption('Keep a copy of the message');

    dialogs.clickButton('Apply changes');
    I.waitForDetached('.modal-dialog');

    I.waitForVisible({ css: '[data-action="edit-auto-forward"] .fa-toggle-on' });
    I.click('Auto forward ...');
    dialogs.waitForVisible();
    I.seeCheckboxIsChecked('Keep a copy of the message');
    dialogs.clickButton('Cancel');
    I.waitForDetached('.modal-dialog');
    I.waitForVisible({ css: '[data-action="edit-auto-forward"] .fa-toggle-on' });
});
