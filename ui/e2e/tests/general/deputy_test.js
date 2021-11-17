/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
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

/// <reference path="../../steps.d.ts" />

Feature('General > Deputy Management');

Before(async ({ users }) => {
    await users.create();
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('Show manage deputies button in settings', async ({ I, users }) => {
    await users[0].hasConfig('com.openexchange.deputy.enabled', true);
    I.login(['app=io.ox/settings', 'folder=virtual/settings/io.ox/core']);
    I.waitForText('Manage deputies');

    I.click('Manage deputies');
    I.waitForElement('.deputy-dialog-body');
});

Scenario('Show manage deputies button in foldertrees', async ({ I, users, calendar, mail }) => {
    await users[0].hasConfig('com.openexchange.deputy.enabled', true);
    I.login('app=io.ox/calendar');
    calendar.waitForApp();

    I.waitForElement('[data-id="virtual/flat/event/private"] li:first-child .contextmenu-control');
    I.click('[data-id="virtual/flat/event/private"] li:first-child .contextmenu-control');
    I.waitForText('Manage deputies', '.smart-dropdown-container.open.context-dropdown');
    I.click('Manage deputies', '.smart-dropdown-container.open.context-dropdown');
    I.waitForElement('.deputy-dialog-body');
    I.click('Close');

    I.openApp('Mail');
    mail.waitForApp();

    I.waitForElement('[data-id="virtual/standard"] li:first-child .contextmenu-control');
    I.click('[data-id="virtual/standard"] li:first-child .contextmenu-control');
    I.waitForText('Manage deputies', '.smart-dropdown-container.open.context-dropdown');
    I.click('Manage deputies', '.smart-dropdown-container.open.context-dropdown');
    I.waitForElement('.deputy-dialog-body');
});

Scenario('Can add edit and remove deputies', async ({ I, users }) => {
    await users[0].hasConfig('com.openexchange.deputy.enabled', true);
    I.login(['app=io.ox/settings', 'folder=virtual/settings/io.ox/core']);

    I.waitForText('Manage deputies');
    I.click('Manage deputies');

    I.waitForElement('.deputy-dialog-body .add-participant.tt-input');
    I.fillField('Add people', users[1].userdata.primaryEmail);
    I.pressKey('Enter');

    I.waitForText('The deputy has the following permissions');
    I.click('Deputy can send emails on your behalf');
    I.click('Save');

    I.waitForText('Allowed to send emails on your behalf, Inbox (Viewer), Calendar (Viewer)');
    I.seeElement('.deputy-list-view li .flex-item');
    I.click('Edit');

    I.waitForText('The deputy has the following permissions');
    I.click('Deputy can send emails on your behalf');
    I.selectOption('Inbox', 'Author (create/edit/delete emails)');
    I.selectOption('Calendar', 'None');
    I.click('Save');

    I.waitForText('Inbox (Author), Calendar (None)');
    I.click('.btn.remove');

    I.waitForText('Do you want to remove ' + users[1].userdata.sur_name + ', ' + users[1].userdata.given_name + ' from your deputy list?');
    I.click('Remove');

    I.waitForText('Manage deputies');
    I.waitForInvisible('.deputy-list-view li .flex-item');
});
