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

Scenario('Mail - Vertical view w/o mail', async ({ I }) => {
    I.login('app=io.ox/mail');
    I.waitForText('Empty', 5, '.list-view');

    expect(await I.grabAxeReport()).to.be.accessible;
});

Scenario('Mail - Compact view w/o mail', async ({ I }) => {
    I.login('app=io.ox/mail');
    I.waitForText('Empty', 5, '.list-view');

    I.clickToolbar('View');
    I.click('Compact');

    expect(await I.grabAxeReport()).to.be.accessible;
});

Scenario('Mail - Horizontal view w/o mail', async ({ I }) => {
    I.login('app=io.ox/mail');
    I.waitForText('Empty', 5, '.list-view');

    I.clickToolbar('View');
    I.click('Horizontal');

    expect(await I.grabAxeReport()).to.be.accessible;
});

Scenario('Mail - List view w/o mail', async ({ I }) => {
    I.login('app=io.ox/mail');
    I.waitForText('Empty', 5, '.list-view');

    I.clickToolbar('View');
    I.click('List');

    expect(await I.grabAxeReport()).to.be.accessible;
});

Scenario('Mail - List view unified mail w/o mail', async ({ I, mail }) => {
    I.login('app=io.ox/mail');
    await I.executeAsyncScript((done) => {
        require(['io.ox/core/api/account'], function (api) {
            api.update({ id: 0, personal: null, unified_inbox_enabled: true }).done(done);
        });
    });

    I.refreshPage();
    mail.waitForApp();
    I.see('Unified mail');

    I.executeAsyncScript((done) => {
        require(['io.ox/core/api/account'], function (api) {
            api.update({ id: 0, personal: null, unified_inbox_enabled: false }).done(done);
        });
    });
    expect(await I.grabAxeReport()).to.be.accessible;
});

Scenario('Mail - Compose window (with exceptions)', async ({ I }) => {
    // Exceptions:
    // Typeahead missing label (critical), TinyMCE toolbar invalid role (minor issue)
    const excludes = { exclude: [['.to'], ['.mce-open'], ['.mce-toolbar']] };

    I.login('app=io.ox/mail');
    I.waitForElement('.mail-detail-pane');
    I.clickToolbar('Compose');
    I.waitForVisible('.window-blocker.io-ox-busy');
    I.waitForInvisible('.window-blocker.io-ox-busy');
    // Cursor needs to be moved because of drecks tooltip.
    I.moveCursorTo('.floating-header');
    I.waitForDetached('.tooltip.bottom.in');

    expect(await I.grabAxeReport(excludes)).to.be.accessible;
});

Scenario('Mail - Modal Dialog - Vacation notice (with exceptions)', async ({ I }) => {
    // Exceptions:
    // Checkbox has no visibel label (critical)
    const excludes = { exclude: [['.checkbox.switch.large']] };

    I.login('app=io.ox/mail');
    I.waitForElement('.mail-detail-pane');
    I.clickToolbar('View');
    I.click('Vacation notice');
    I.waitForElement('h1.modal-title');

    expect(await I.grabAxeReport(excludes)).to.be.accessible;
});

Scenario('Mail - Modal Dialog - Add mail account', async ({ I }) => {
    I.login('app=io.ox/mail');
    I.waitForElement('.mail-detail-pane');
    I.selectFolder('Inbox');
    I.click('Add mail account');
    I.waitForText('Your mail address');

    expect(await I.grabAxeReport()).to.be.accessible;
});

Scenario('Mail - Modal Dialog - New folder (with exceptions)', async ({ I, mail }) => {
    // Exceptions:
    // Input has no visibel label (critical)
    const excludes = { exclude: [['*[placeholder="New folder"]']] };

    I.login('app=io.ox/mail');
    mail.waitForApp();
    I.waitForText('Inbox');
    I.click({ css: 'a[title="Actions for Inbox"]' });
    I.clickDropdown('Add new folder');
    I.waitForElement('h1.modal-title');

    expect(await I.grabAxeReport(excludes)).to.be.accessible;
});

Scenario('Mail - Modal Dialog - Permissions (with exceptions)', async ({ I, mail }) => {
    // Exceptions:
    // Typeahead missing label (critical)
    // Personal message textarea has a missing label (critical)
    const excludes = { exclude: [['.tt-hint'], ['.tt-input'], ['.message-text'], ['.share-pane h5']] };

    I.login('app=io.ox/mail');
    mail.waitForApp();
    I.waitForText('Inbox');
    I.click({ css: 'a[title="Actions for Inbox"]' });
    I.clickDropdown('Permissions');
    I.waitForElement('h1.modal-title');

    expect(await I.grabAxeReport(excludes)).to.be.accessible;
});


