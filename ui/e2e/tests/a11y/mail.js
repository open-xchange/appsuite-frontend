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


