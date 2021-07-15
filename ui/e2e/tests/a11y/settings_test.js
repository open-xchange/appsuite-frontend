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

/// <reference path="../../steps.d.ts" />

const { expect } = require('chai');

Feature('Accessibility');

BeforeSuite(async function ({ users }) {
    await users.create();
});

AfterSuite(async function ({ users }) {
    await users.removeAll();
});

function axeReport(folder, label) {
    this.login(['app=io.ox/settings', 'folder=virtual/settings/' + folder]);
    this.waitForText(label, 5, '.settings-detail-pane h1');
    return this.grabAxeReport();
}

Scenario('Settings - Basic settings', async ({ I }) => {
    expect(await axeReport.call(I, 'io.ox/core', 'Basic settings')).to.be.accessible;
});

Scenario('Settings - Account', async ({ I }) => {
    expect(await axeReport.call(I, 'io.ox/settings/accounts', 'Accounts')).to.be.accessible;
});

Scenario('Settings - Security', async ({ I }) => {
    expect(await axeReport.call(I, 'security', 'Security')).to.be.accessible;
});

Scenario('Settings - Security - Active clients', async ({ I }) => {
    expect(await axeReport.call(I, 'sessions', 'You are currently signed in with the following devices')).to.be.accessible;
});

Scenario('Settings - Mail', async ({ I }) => {
    expect(await axeReport.call(I, 'io.ox/mail', 'Mail')).to.be.accessible;
});

Scenario('Settings - Mail - Compose', async ({ I }) => {
    expect(await axeReport.call(I, 'io.ox/mail/settings/compose', 'Mail Compose')).to.be.accessible;
});

Scenario('Settings - Mail - Signatures', async ({ I }) => {
    expect(await axeReport.call(I, 'io.ox/mail/settings/signatures', 'Signatures')).to.be.accessible;
});

Scenario('Settings - Mail - Filter Rules', async ({ I }) => {
    expect(await axeReport.call(I, 'io.ox/mailfilter', 'Mail Filter Rules')).to.be.accessible;
});

Scenario('Settings - Calendar', async ({ I }) => {
    expect(await axeReport.call(I, 'io.ox/calendar', 'Calendar')).to.be.accessible;
});

Scenario('Settings - Calendar - Favorite timezones', async ({ I }) => {
    expect(await axeReport.call(I, 'io.ox/timezones', 'Favorite timezones')).to.be.accessible;
});

Scenario('Settings - Address Book', async ({ I }) => {
    expect(await axeReport.call(I, 'io.ox/contacts', 'Address Book')).to.be.accessible;
});

Scenario('Settings - Drive', async ({ I }) => {
    expect(await axeReport.call(I, 'io.ox/files', 'Drive')).to.be.accessible;
});

Scenario('Settings - Portal', async ({ I }) => {
    expect(await axeReport.call(I, 'io.ox/portal', 'Portal settings')).to.be.accessible;
});

Scenario('Settings - Tasks', async ({ I }) => {
    expect(await axeReport.call(I, 'io.ox/tasks', 'Tasks')).to.be.accessible;
});

Scenario('Settings - Subscriptions', async ({ I }) => {
    expect(await axeReport.call(I, 'io.ox/core/sub', 'Subscriptions')).to.be.accessible;
});

Scenario('Settings - Error Log', async ({ I }) => {
    expect(await axeReport.call(I, 'errorlog', 'Error log')).to.be.accessible;
});

Scenario('Settings - Downloads', async ({ I }) => {
    expect(await axeReport.call(I, 'io.ox/core/downloads', 'Downloads')).to.be.accessible;
});

Scenario('Settings - External Apps', async ({ I }) => {
    expect(await axeReport.call(I, 'external/apps', 'External Apps')).to.be.accessible;
});
