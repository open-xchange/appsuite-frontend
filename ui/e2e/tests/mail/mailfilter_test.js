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

///  <reference path="../../steps.d.ts" />

Feature('Mailfilter');

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});


Scenario('add and removes Mail Filter Rules', async function ({ I, dialogs }) {
    I.login('app=io.ox/settings&folder=virtual/settings/io.ox/mailfilter');
    I.waitForVisible('.io-ox-settings-main');

    // checks the h1 and the empty message
    I.waitForVisible('.settings-detail-pane .io-ox-mailfilter-settings h1');
    I.see('Mail Filter Rules');
    I.see('There is no rule defined');

    // create a test rule and check the inintial display
    I.click('Add new rule');
    dialogs.waitForVisible();
    I.waitForText('Create new rule', 5, dialogs.locators.header);
    I.see('This rule applies to all messages. Please add a condition to restrict this rule to specific messages.');
    I.see('Please define at least one action.');

    // add action
    I.click('Add action');
    I.clickDropdown('Keep');

    // warnig gone?
    I.dontSee('Please define at least one action.');

    // action and all components visible?
    I.seeNumberOfVisibleElements('.io-ox-mailfilter-edit ol.actions > li', 1);
    I.see('Keep');
    I.seeElement('.io-ox-mailfilter-edit ol.actions .remove');

    // add condition
    I.click('Add condition');
    I.clickDropdown('From');

    // alert gone?
    I.dontSee('This rule applies to all messages. Please add a condition to restrict this rule to specific messages.');

    // condition and all components visible?
    I.see('From', '.list-title');
    I.see('Contains', '.dropdown-label');
    I.seeElement('.io-ox-mailfilter-edit [data-test-id="0"] .row.has-error');
    I.seeElement('.modal button[data-action="save"][disabled]');
    I.fillField('values', 'Test Value');
    I.dontSeeElement('.io-ox-mailfilter-edit [data-test-id="0"] .row.has-error');
    I.seeElement('.modal button[data-action="save"]');
    I.seeElement('.io-ox-mailfilter-edit [data-action-id="0"] .remove');

    // add nested condition
    I.click('Add condition');
    I.click('Nested condition');

    // nested condition and all components visible?
    I.see('continue if any of these conditions are met');

    // add a test inside the nested condition
    I.click('Add condition', { css: 'li.nestedrule' });
    I.click('From', '.smart-dropdown-container');

    // condition and all components visible?
    I.see('From', '.io-ox-mailfilter-edit .nested[data-test-id="1_0"] .list-title');
    I.seeElement('.modal button[data-action="save"][disabled]');
    I.fillField('.io-ox-mailfilter-edit [data-test-id="1_0"] input[name="values"]', 'Test Value');
    I.dontSeeElement('.modal button[data-action="save"][disabled]');
    I.seeElement('.modal button[data-action="save"]');

    // add an action which includes the folder picker
    I.click('Add action');
    I.click('File into');

    I.see('File into', '.list-title');
    I.see('Select folder', '.folderselect');
    I.seeElement('.io-ox-mailfilter-edit [data-action-id="1"] .remove');

    // open folder picker
    I.click('Select folder');
    dialogs.waitForVisible();
    I.see('Select folder', '.modal-dialog h1');

    // create a new folder
    I.waitForElement('[data-point="io.ox/core/folder/picker"] li.selected', 5, dialogs.locators.main);
    dialogs.clickButton('Create folder');

    // cancel the add popup
    I.waitForElement('.modal[data-point="io.ox/core/folder/add-popup"]');
    I.waitForText('Add new folder', 5, dialogs.locators.header);
    dialogs.clickButton('Cancel');
    I.waitForText('Select folder', 5, dialogs.locators.header);

    // cancel the picker
    dialogs.clickButton('Cancel');
    I.waitForText('Create new rule', 5, dialogs.locators.header);
    I.dontSeeElement('.modal[data-point="io.ox/core/folder/picker"]');

    // cancel the form
    dialogs.clickButton('Cancel');

    // create a fresh rule
    I.click('Add new rule');

    // add a "from" condition
    I.click('Add condition');
    I.clickDropdown('From');

    // add "keep" action
    I.click('Add action');
    I.clickDropdown('Keep');

    // set comparison to "Exists"
    I.click('Contains');
    I.clickDropdown('Exists');

    // check if "Exists" is properly set
    I.see('Exists', '.dropdown-label');
    I.seeElement('.io-ox-mailfilter-edit [data-test-id="0"] input[name="values"]:disabled');

    // reset comparison to "Contains"
    I.click('Exists');
    I.clickDropdown('Contains');

    // set the value
    I.fillField('.io-ox-mailfilter-edit [data-test-id="0"] input[name="values"]', 'Test Value');

    // check if "Contains" is properly set
    I.see('Contains', '.dropdown-label');

    // add a "header" test
    I.click('Add condition');
    I.click('Header');
    I.seeElement('.io-ox-mailfilter-edit li[data-test-id="1"] .row.has-error input[name="headers"]');
    I.seeElement('.io-ox-mailfilter-edit li[data-test-id="1"] .row.has-error input[name="values"]');
    I.dontSeeElement('.io-ox-mailfilter-edit li[data-test-id="0"] .row.has-error');
    I.fillField('.io-ox-mailfilter-edit [data-test-id="1"] input[name="headers"]', 'Test headers');
    I.dontSeeElement('.io-ox-mailfilter-edit li[data-test-id="1"] .row.has-error input[name="headers"]');
    I.fillField('.io-ox-mailfilter-edit [data-test-id="1"] input[name="values"]', 'Test values');
    I.dontSeeElement('.io-ox-mailfilter-edit li[data-test-id="1"] .row.has-error input[name="values"]');
    I.click('.io-ox-mailfilter-edit li[data-test-id="1"] .dropdownlink span');
    I.click('.smart-dropdown-container .dropdown-menu a[data-value="exists"]');
    I.seeElement('.io-ox-mailfilter-edit li[data-test-id="1"] input[name="values"]:disabled');
    I.seeInField('.io-ox-mailfilter-edit [data-test-id="1"] input[name="values"]', '');

    // save the form
    dialogs.clickButton('Save');
    I.waitForDetached('.io-ox-mailfilter-edit .modal-dialog');
    // wait for requests to settle
    I.waitForDetached('#io-ox-refresh-icon .fa-spin');
    I.waitNumberOfVisibleElements('.settings-detail-pane li.settings-list-item', 1);

    // open the saved rule
    I.retry(2).click('Edit', '.settings-detail-pane li.settings-list-item[data-id="0"]');

    // ckeck if the rule is correctly displayed
    I.dontSeeElement('.io-ox-mailfilter-edit li[data-test-id="0"] .row.has-error');
    I.seeInField('.io-ox-mailfilter-edit [data-test-id="0"] input[name="values"]', 'Test Value');

    I.dontSeeElement('.io-ox-mailfilter-edit li[data-test-id="1"] .row.has-error input[name="headers"]');
    I.dontSeeElement('.io-ox-mailfilter-edit li[data-test-id="1"] .row.has-error input[name="values"]');
    I.seeInField('.io-ox-mailfilter-edit [data-test-id="1"] input[name="headers"]', 'Test headers');
    I.seeElement('.io-ox-mailfilter-edit li[data-test-id="1"] input[name="values"]:disabled');
    I.seeInField('.io-ox-mailfilter-edit [data-test-id="1"] input[name="values"]', '');

    I.see('Keep', '.io-ox-mailfilter-edit [data-action-id="0"] .list-title');
    I.seeElement('.io-ox-mailfilter-edit [data-action-id="0"] .remove');

    // set the comparison to "contains"
    I.click('.io-ox-mailfilter-edit li[data-test-id="1"] .dropdownlink span');
    I.click('Contains', '.smart-dropdown-container .dropdown-menu');

    // check if "Exists" is properly set
    I.see('Contains', '.io-ox-mailfilter-edit [data-test-id="0"] .dropdown-label');
    I.dontSeeElement('.io-ox-mailfilter-edit li[data-test-id="1"] input[name="values"]:disabled');
    I.fillField('.io-ox-mailfilter-edit [data-test-id="1"] input[name="values"]', 'Test values');
    I.seeInField('.io-ox-mailfilter-edit [data-test-id="1"] input[name="headers"]', 'Test headers');

    // save the form
    dialogs.clickButton('Save');
    I.waitForDetached('.io-ox-mailfilter-edit .modal-dialog');
    // wait for requests to settle
    I.waitForDetached('#io-ox-refresh-icon .fa-spin');
    I.waitNumberOfVisibleElements('.settings-detail-pane li.settings-list-item', 1);

    // open the saved rule
    I.click('Edit', '.settings-detail-pane li.settings-list-item[data-id="0"]');

    // ckeck if the rule is correctly displayed
    I.waitForVisible('.io-ox-mailfilter-edit');
    I.dontSeeElement('.io-ox-mailfilter-edit li[data-test-id="0"] .row.has-error');
    I.seeInField('.io-ox-mailfilter-edit [data-test-id="0"] input[name="values"]', 'Test Value');

    I.dontSeeElement('.io-ox-mailfilter-edit li[data-test-id="1"] .row.has-error input[name="headers"]');
    I.dontSeeElement('.io-ox-mailfilter-edit li[data-test-id="1"] .row.has-error input[name="values"]');
    I.seeInField('.io-ox-mailfilter-edit [data-test-id="1"] input[name="headers"]', 'Test headers');
    I.seeInField('.io-ox-mailfilter-edit [data-test-id="1"] input[name="values"]', 'Test values');
    I.see('Keep', '.io-ox-mailfilter-edit [data-action-id="0"] .list-title');
    I.seeElement('.io-ox-mailfilter-edit [data-action-id="0"] .remove');

    I.click('Add condition');
    I.clickDropdown('Size');

    // check size validation
    I.waitForElement('.io-ox-mailfilter-edit li[data-test-id="2"] .row.has-error');
    I.seeElement('.modal button[data-action="save"][disabled]');

    // add action to redraw
    I.click('Add action');
    I.click('Keep');

    // check size validation
    I.waitForElement('.io-ox-mailfilter-edit li[data-test-id="2"] .row.has-error');
    I.seeElement('.modal button[data-action="save"][disabled]');
    I.fillField('.io-ox-mailfilter-edit [data-test-id="2"] input[name="sizeValue"]', 'sdsds');

    // check size validation
    I.seeElement('.io-ox-mailfilter-edit li[data-test-id="2"] .row.has-error');
    I.seeElement('.modal button[data-action="save"][disabled]');

    // add action to redraw
    I.click('Add action');
    I.click('Discard');

    // check size validation
    I.seeElement('.io-ox-mailfilter-edit li[data-test-id="2"] .row.has-error');
    I.seeElement('.modal button[data-action="save"][disabled]');

    I.fillField('.io-ox-mailfilter-edit [data-test-id="2"] input[name="sizeValue"]', '22');

    // check size validation
    I.dontSeeElement('.io-ox-mailfilter-edit li[data-test-id="2"] .row.has-error');
    I.dontSeeElement('.modal button[data-action="save"][disabled]');
    I.seeElement('.modal button[data-action="save"]');

    // ckeck header validation
    I.click('.io-ox-mailfilter-edit [data-test-id="1"] [data-action="remove-test"]');
    I.click('Add condition');
    I.click('Header');

    I.seeElement('.io-ox-mailfilter-edit li[data-test-id="2"] .row.has-error');
    I.seeElement('.modal button[data-action="save"][disabled]');

    I.click('Matches', '.io-ox-mailfilter-edit li[data-test-id="2"]');
    I.clickDropdown('Exists');

    // add action to redraw
    I.click('Add action');
    I.click('Discard');

    I.seeElement('.io-ox-mailfilter-edit li[data-test-id="2"] .row.has-error');
    I.seeElement('.modal button[data-action="save"][disabled]');

    // cancel the form
    dialogs.clickButton('Cancel');

    I.click('.settings-detail-pane li.settings-list-item[data-id="0"] a[data-action="delete"]');
    dialogs.waitForVisible();
    dialogs.clickButton('Delete');
    I.waitForDetached('.modal-dialog');

    I.waitForVisible('.settings-detail-pane .hint');
});

Scenario('adds and removes Mail Filter Rules with modified config', function ({ I, users }) {
    let [user] = users;
    user.hasConfig('com.openexchange.mail.filter.blacklist.actions', 'keep');
    user.hasConfig('com.openexchange.mail.filter.blacklist.tests.from.comparisons', 'contains');
    user.hasConfig('com.openexchange.mail.filter.blacklist.tests.header.comparisons', 'matches');

    I.haveMailFilterRule({ rulename: 'rule with keep', active: true, flags: [], test: { id: 'from', comparison: 'contains', values: ['test'] }, actioncmds: [{ id: 'keep' }] });
    I.haveMailFilterRule({ rulename: 'rule with discard', active: true, flags: [], test: { id: 'from', comparison: 'contains', values: ['test'] }, actioncmds: [{ id: 'discard' }, { id: 'stop' }] });
    I.haveMailFilterRule({
        rulename: 'New rule', active: true, flags: [], test: { id: 'allof', tests: [
            { id: 'from', comparison: 'contains', values: ['test value'] },
            { id: 'header', comparison: 'matches', headers: ['test name'], values: ['test value'] }
        ] }, actioncmds: [{ id: 'discard' }]
    });

    I.login('app=io.ox/settings');
    I.waitForVisible('.io-ox-settings-main');
    I.selectFolder('Mail');
    I.waitForVisible('.rightside h1');

    // open mailfilter settings
    I.selectFolder('Filter Rules');

    // checks the h1 and the empty message

    I.waitForVisible('.io-ox-settings-window .settings-detail-pane .io-ox-mailfilter-settings h1');
    I.see('Mail Filter Rules');

    // two rules with all components should be pressent

    I.see('This rule contains unsupported properties.', '.io-ox-mailfilter-settings li[data-id="0"] .warning-message');
    I.seeElement('.io-ox-mailfilter-settings li[data-id="1"] [data-action="edit"]');
    I.seeElement('.io-ox-mailfilter-settings li[data-id="1"] [data-action="toggle"]');
    I.seeElement('.io-ox-mailfilter-settings li[data-id="1"] [data-action="toggle-process-subsequent"]');
    I.seeElement('.io-ox-mailfilter-settings li[data-id="1"] [data-action="delete"]');

    // open the second rule
    I.click('Edit', '.io-ox-mailfilter-settings li[data-id="1"]');
    I.waitForElement({ css: '[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"]' });
    I.seeInField({ css: '[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] input[name="rulename"]' }, 'rule with discard');

    // check if all components are present as expected if an usupported comparison is involved
    I.see('From', { css: 'li[data-test-id="0"] .list-title' });
    I.see('contains', { css: 'li[data-test-id="0"] .dropdownlink span.unsupported' });
    I.click('contains');
    I.dontSee('contains', '.dropdown-menu');
    I.see('Contains not', '.dropdown-menu');
    I.click('Contains not');
    I.dontSeeElement({ css: 'li[data-test-id="0"] .dropdownlink span.unsupported' });
    I.see('Contains not', { css: 'li[data-test-id="0"] .dropdownlink span' });
    I.dontSeeCheckboxIsChecked('Process subsequent rules');

    // check input handling for exists comparison for single test
    I.click('Contains not');
    I.click('Exists');
    I.seeElement({ css: 'li[data-test-id="0"] input:disabled' });
    I.seeInField({ css: '[data-test-id="0"] input[name="values"]' }, '');
    I.click('Exists');
    I.click('Contains not');
    I.dontSeeElement({ css: 'li[data-test-id="0"] input:disabled' });
    I.seeElement({ css: 'li[data-test-id="0"] .row.has-error' });
    I.seeElement({ css: 'li[data-test-id="0"] .row.has-error' });
    I.fillField({ css: '[data-test-id="0"] input[name="values"]' }, 'Test Value');
    I.dontSeeElement({ css: 'li[data-test-id="0"] .row.has-error' });

    // add condition
    I.click('Add condition');
    I.click('To');
    I.seeElement({ css: 'li[data-test-id="1"] .row.has-error' });
    I.fillField({ css: '[data-test-id="1"] input[name="values"]' }, 'Test Value');
    I.dontSeeElement({ css: 'li[data-test-id="1"] .row.has-error' });

    // remove first condition and check
    I.click({ css: 'li[data-test-id="0"] [data-action="remove-test"]' });
    I.see('To', { css: 'li[data-test-id="0"]' });

    // for header
    I.click('Add condition');
    I.click('Header');
    I.seeElement({ css: 'li[data-test-id="1"] .row.has-error input[name="headers"]' });
    I.seeElement({ css: 'li[data-test-id="1"] .row.has-error input[name="values"]' });
    I.fillField({ css: 'li[data-test-id="1"] input[name="headers"]' }, 'Test Value');
    I.dontSeeElement({ css: 'li[data-test-id="1"] .row.has-error input[name="headers"]' });
    I.fillField({ css: 'li[data-test-id="1"] input[name="values"]' }, 'Test Value');
    I.dontSeeElement({ css: 'li[data-test-id="1"] .row.has-error input[name="values"]' });
    I.click('Regex', { css: 'li[data-test-id="1"]' });
    I.click('Exists', '.smart-dropdown-container .dropdown-menu');
    I.seeElement({ css: 'li[data-test-id="1"] input[name="values"]:disabled' });
    I.seeInField({ css: '[data-test-id="1"] input[name="values"]' }, '');

    // action redirect is limitd to MAXREDIRECTS?
    I.click('Add action');
    I.click('Redirect to');
    I.click('Add action');
    I.click('Redirect to');
    I.click('Add action');
    I.click('Redirect to');
    I.click('Add action');
    I.click('Redirect to');
    I.click('Add action');
    I.dontSee('Redirect to', '.dropdown-menu');
    I.click('Discard');

    I.click('Cancel');

    // open the second rule
    I.waitForVisible('.io-ox-mailfilter-settings li[data-id="2"] [data-action="edit"]');
    I.click('Edit', '.io-ox-mailfilter-settings li[data-id="2"]');
    I.waitForElement({ css: '[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"]' });
    I.seeInField('rulename', 'New rule');

    // check if all components are present as expected if an usupported comparison is involved and switched to "exist"
    I.see('From', { css: 'li[data-test-id="0"]' });
    I.see('contains', { css: 'li[data-test-id="0"] .dropdownlink span.unsupported' });
    I.see('Header', { css: 'li[data-test-id="1"]' });
    I.see('matches', { css: 'li[data-test-id="1"] .dropdownlink span.unsupported' });
    I.click('matches', { css: 'li[data-test-id="1"]' });
    I.click('Exists', '.smart-dropdown-container');
    I.dontSeeElement({ css: 'li[data-test-id="1"] .dropdownlink span.unsupported' });
    I.see('Exists', { css: 'li[data-test-id="1"] .dropdownlink' });
    I.dontSeeElement({ css: 'li[data-test-id="1"] input[name="headers"]:disabled' });
    I.seeElement({ css: 'li[data-test-id="1"] input[name="values"]:disabled' });

    I.click('Cancel');
});

Scenario('checks if the size test is correctly displayed', function ({ I }) {

    I.haveMailFilterRule({ rulename: 'rule with size b', active: true, flags: [], test: { id: 'size', comparison: 'over', size: '20' }, actioncmds: [{ id: 'keep' }, { id: 'stop' }] });
    I.haveMailFilterRule({ rulename: 'rule with size kb', active: true, flags: [], test: { id: 'size', comparison: 'over', size: '20K' }, actioncmds: [{ id: 'keep' }, { id: 'stop' }] });
    I.haveMailFilterRule({ rulename: 'rule with size mb', active: true, flags: [], test: { id: 'size', comparison: 'over', size: '20M' }, actioncmds: [{ id: 'keep' }, { id: 'stop' }] });
    I.haveMailFilterRule({ rulename: 'rule with size gb', active: true, flags: [], test: { id: 'size', comparison: 'over', size: '1G' }, actioncmds: [{ id: 'keep' }, { id: 'stop' }] });

    I.login('app=io.ox/settings');
    I.waitForVisible('.io-ox-settings-main');
    I.selectFolder('Mail');
    I.waitForVisible('.rightside h1');

    I.selectFolder('Filter Rules');
    I.waitForVisible('.io-ox-settings-window .settings-detail-pane .io-ox-mailfilter-settings h1');
    I.see('Mail Filter Rules');

    I.seeElement('.io-ox-mailfilter-settings li[data-id="0"] [data-action="edit"]');

    I.click('Edit', '.io-ox-mailfilter-settings li[data-id="0"]');
    I.waitForElement({ css: '[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"]' });
    I.seeInField({ css: '[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] input[name="rulename"]' }, 'rule with size b');

    I.see('Size', { css: 'li[data-test-id="0"] .list-title' });

    I.see('Is bigger than', { css: 'li[data-test-id="0"] :not(.no-padding-left) .dropdownlink span' });
    I.seeInField({ css: '[data-test-id="0"] input[name="sizeValue"]' }, '20');
    I.see('Byte', { css: 'li[data-test-id="0"] .no-padding-left .dropdownlink span' });
    I.dontSeeCheckboxIsChecked('Process subsequent rules');

    I.click('Cancel', { css: '[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"]' });
    I.waitForDetached({ css: '[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"]' });

    I.seeElement('.io-ox-mailfilter-settings li[data-id="1"] [data-action="edit"]');

    I.click('Edit', '.io-ox-mailfilter-settings li[data-id="1"]');
    I.waitForElement({ css: '[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"]' });
    I.seeInField({ css: '[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] input[name="rulename"]' }, 'rule with size kb');

    I.see('Is bigger than', { css: 'li[data-test-id="0"] :not(.no-padding-left) .dropdownlink span' });
    I.seeInField({ css: '[data-test-id="0"] input[name="sizeValue"]' }, '20');
    I.see('kB', { css: 'li[data-test-id="0"] .no-padding-left .dropdownlink span' });
    I.dontSeeCheckboxIsChecked('Process subsequent rules');

    I.click('Cancel', { css: '[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"]' });
    I.waitForDetached({ css: '[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"]' });

    I.seeElement('.io-ox-mailfilter-settings li[data-id="2"] [data-action="edit"]');

    I.click('Edit', '.io-ox-mailfilter-settings li[data-id="2"]');
    I.waitForElement({ css: '[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"]' });
    I.seeInField({ css: '[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] input[name="rulename"]' }, 'rule with size mb');

    I.see('Size', 'li[data-test-id="0"] .list-title');

    I.see('Is bigger than', { css: 'li[data-test-id="0"] :not(.no-padding-left) .dropdownlink span' });
    I.seeInField({ css: '[data-test-id="0"] input[name="sizeValue"]' }, '20');
    I.see('MB', { css: 'li[data-test-id="0"] .no-padding-left .dropdownlink span' });
    I.dontSeeCheckboxIsChecked('Process subsequent rules');

    I.click('Cancel', { css: '[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"]' });
    I.waitForDetached({ css: '[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"]' });

    I.seeElement('.io-ox-mailfilter-settings li[data-id="3"] [data-action="edit"]');

    I.click('Edit', '.io-ox-mailfilter-settings li[data-id="3"]');
    I.waitForElement({ css: '[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"]' });
    I.seeInField({ css: '[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] input[name="rulename"]' }, 'rule with size gb');

    I.see('Size', 'li[data-test-id="0"] .list-title');

    I.see('Is bigger than', { css: 'li[data-test-id="0"] :not(.no-padding-left) .dropdownlink span' });
    I.seeInField({ css: '[data-test-id="0"] input[name="sizeValue"]' }, '1');
    I.see('GB', { css: 'li[data-test-id="0"] .no-padding-left .dropdownlink span' });
    I.dontSeeCheckboxIsChecked('Process subsequent rules');

    I.click('Cancel', { css: '[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"]' });
    I.waitForDetached({ css: '[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"]' });
});
