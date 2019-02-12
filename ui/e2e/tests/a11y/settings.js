/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2018 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author David Bauer <david.bauer@open-xchange.com>
 */
/// <reference path="../../steps.d.ts" />

const { expect } = require('chai');

function axeReport(folder, label) {
    this.login(['app=io.ox/settings', 'folder=virtual/settings/' + folder]);
    this.waitForVisible('[data-app-name="io.ox/settings"]', 5);
    this.waitForText(label, 5, 'h1');
    return this.grabAxeReport();
}

Scenario('Settings - Basic settings', async function (I) {
    expect(await axeReport.call(I, 'io.ox/core', 'Basic settings')).to.be.accessible;
});

Scenario('Settings - Account', async function (I) {
    expect(await axeReport.call(I, 'io.ox/settings/accounts', 'Accounts')).to.be.accessible;
});

Scenario('Settings - Security', async function (I) {
    expect(await axeReport.call(I, 'security', 'Security')).to.be.accessible;
});

Scenario.skip('Settings - Security - Active clients', async function (I) {
    expect(await axeReport.call(I, 'sessions', 'You are currently signed in with the following devices')).to.be.accessible;
});

Scenario('Settings - Mail', async function (I) {
    expect(await axeReport.call(I, 'io.ox/mail', 'Mail')).to.be.accessible;
});

Scenario('Settings - Mail - Compose', async function (I) {
    expect(await axeReport.call(I, 'io.ox/mail/settings/compose', 'Mail Compose')).to.be.accessible;
});

Scenario('Settings - Mail - Signatures', async function (I) {
    expect(await axeReport.call(I, 'io.ox/mail/settings/signatures', 'Signatures')).to.be.accessible;
});

Scenario('Settings - Mail - Filter Rules', async function (I) {
    expect(await axeReport.call(I, 'io.ox/mailfilter', 'Mail Filter Rules')).to.be.accessible;
});

Scenario('Settings - Calendar', async function (I) {
    expect(await axeReport.call(I, 'io.ox/calendar', 'Calendar')).to.be.accessible;
});

Scenario('Settings - Calendar - Favorite timezones', async function (I) {
    expect(await axeReport.call(I, 'io.ox/timezones', 'Favorite timezones')).to.be.accessible;
});

Scenario('Settings - Address Book', async function (I) {
    expect(await axeReport.call(I, 'io.ox/contacts', 'Address Book')).to.be.accessible;
});

Scenario('Settings - Drive', async function (I) {
    expect(await axeReport.call(I, 'io.ox/files', 'Drive')).to.be.accessible;
});

Scenario('Settings - Portal', async function (I) {
    expect(await axeReport.call(I, 'io.ox/portal', 'Portal settings')).to.be.accessible;
});

Scenario('Settings - Tasks', async function (I) {
    expect(await axeReport.call(I, 'io.ox/tasks', 'Tasks')).to.be.accessible;
});

Scenario.skip('Settings - Subscriptions', async function (I) {
    expect(await axeReport.call(I, 'io.ox/core/sub', 'Subscriptions')).to.be.accessible;
});

Scenario('Settings - Error Log', async function (I) {
    expect(await axeReport.call(I, 'errorlog', 'Error log')).to.be.accessible;
});

Scenario('Settings - Downloads', async function (I) {
    expect(await axeReport.call(I, 'io.ox/core/downloads', 'Downloads')).to.be.accessible;
});

Scenario('Settings - External Apps', async function (I) {
    expect(await axeReport.call(I, 'external/apps', 'External Apps')).to.be.accessible;
});
