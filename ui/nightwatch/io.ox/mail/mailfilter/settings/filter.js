/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

describe('Mailfilter', function () {

    it('adds and removes Mail Filter Rules', function (client) {
        client
            .login('app=io.ox/settings')
            .waitForElementVisible('.io-ox-settings-main', 20000)
            .selectFolder({ id: 'virtual/settings/io.ox/mail' })
            .waitForElementVisible('.io-ox-settings-main li[data-id="virtual/settings/io.ox/mailfilter"]', 20000);

        // open mailfilter settings
        client.selectFolder({ id: 'virtual/settings/io.ox/mailfilter' });

        // checks the h1 and the empty message
        client
            .waitForElementVisible('.io-ox-settings-window .settings-detail-pane .io-ox-mailfilter-settings h1', 10000)
            .assert.containsText('.io-ox-settings-window .settings-detail-pane .io-ox-mailfilter-settings h1', 'Mail Filter Rules')
            .assert.containsText('.io-ox-settings-window .settings-detail-pane .hint', 'There is no rule defined');

        // create a test rule and check the inintial display
        client
            .click('.io-ox-settings-window .settings-detail-pane button[data-action="add"]')
            .waitForElementVisible('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] .modal-title', 10000)
            .assert.containsText('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] .modal-title', 'Create new rule')
            .assert.containsText('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] .alert.alert-info', 'This rule applies to all messages. Please add a condition to restrict this rule to specific messages.')
            .assert.containsText('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] .alert.alert-danger', 'Please define at least one action.');

        // add action
        client
            .click('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] .add-action a')
            .waitForElementVisible('.smart-dropdown-container .dropdown-menu a[data-value="keep"]', 10000)
            .click('.smart-dropdown-container .dropdown-menu a[data-value="keep"]');

        // warnig gone?
        client
            .assert.elementNotPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] .alert.alert-danger');

        // action and all components visible?
        client
            .assert.elementPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] [data-action-id="0"]')
            .assert.containsText('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] [data-action-id="0"] .list-title', 'Keep')
            .assert.elementPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] [data-action-id="0"] a.remove');

        // add condition
        client
            .click('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] .add-condition a')
            .waitForElementVisible('.smart-dropdown-container .dropdown-menu a[data-value="from"]', 10000)
            .click('.smart-dropdown-container .dropdown-menu a[data-value="from"]');

        // alert gone?
        client
            .assert.elementNotPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] .alert.alert-info');

        // condition and all components visible?
        client
            .assert.elementPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] [data-test-id="0"]')
            .assert.containsText('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] [data-test-id="0"] .list-title', 'From')
            .assert.containsText('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] [data-test-id="0"] .dropdown-label', 'Contains')
            .assert.elementPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] [data-test-id="0"] input[name="values"]')
            .assert.elementPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] [data-test-id="0"] .row.has-error')
            .assert.elementPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] button[data-action="save"][disabled]')
            .setValue('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] [data-test-id="0"] input[name="values"]', 'Test Value')
            .assert.elementNotPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] [data-test-id="0"] .row.has-error')
            .assert.elementNotPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] button[data-action="save"][disabled]')
            .assert.elementPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] [data-test-id="0"] a.remove');

        // add nested condition
        client
            .click('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] .add-condition a')
            .waitForElementVisible('.smart-dropdown-container .dropdown-menu a[data-value="nested"]', 10000)
            .click('.smart-dropdown-container .dropdown-menu a[data-value="nested"]');

        // nested condition and all components visible?
        client
            .waitForElementVisible('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li.nestedrule', 10000)
            .assert.containsText('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li.nestedrule .appliesto .dropdown-toggle', 'continue if any of these conditions are met')
            .assert.containsText('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li.nestedrule .add-condition .dropdown-toggle', 'Add condition');

        // add a test inside the nested condition
        client
            .click('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li.nestedrule .add-condition a')
            .waitForElementVisible('.smart-dropdown-container .dropdown-menu a[data-value="from"]', 10000)
            .click('.smart-dropdown-container .dropdown-menu a[data-value="from"]');

        // condition and all components visible?
        client
            .assert.elementPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li.nested[data-test-id="1_0"]')
            .assert.containsText('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] .nested[data-test-id="1_0"] .list-title', 'From')
            .assert.elementPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] button[data-action="save"][disabled]')
            .setValue('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] [data-test-id="1_0"] input[name="values"]', 'Test Value')
            .assert.elementNotPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] button[data-action="save"][disabled]');

        // add an action which includes the folder picker
        client
            .click('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] .add-action a')
            .waitForElementVisible('.smart-dropdown-container .dropdown-menu a[data-value="move"]', 10000)
            .click('.smart-dropdown-container .dropdown-menu a[data-value="move"]');

        client
            .assert.elementPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] [data-action-id="1"]')
            .assert.containsText('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] [data-action-id="1"] .list-title', 'File into')
            .assert.containsText('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] [data-action-id="1"] .folderselect', 'Select folder')
            .assert.elementPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] [data-action-id="1"] a.remove');

        // open folder picker
        client
            .click('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] [data-action-id="1"] .folderselect')
            .waitForElementVisible('[data-point="io.ox/core/folder/picker"] .modal-dialog h1', 10000)
            .assert.containsText('[data-point="io.ox/core/folder/picker"] .modal-dialog h1', 'Select folder');

        // create a new folder
        client
            .waitForElementPresent('[data-point="io.ox/core/folder/picker"] .modal-body', 10000)
            .waitForElementPresent('[data-point="io.ox/core/folder/picker"] li.selected', 10000)
            .click('[data-point="io.ox/core/folder/picker"] .modal-footer button[data-action="create"]')
            .waitForElementVisible('.modal[data-point="io.ox/core/folder/add-popup"]', 20000);

        // cancel the add popup
        client
            .click('.modal[data-point="io.ox/core/folder/add-popup"] [data-action="cancel"]')
            .assert.elementNotPresent('.modal[data-point="io.ox/core/folder/add-popup"]');

        // cancel the picker
        client
            .waitForElementPresent('[data-point="io.ox/core/folder/picker"] .modal-footer button[data-action="cancel"]', 10000)
            .click('[data-point="io.ox/core/folder/picker"] .modal-footer button[data-action="cancel"]')
            .assert.elementNotPresent('.modal[data-point="io.ox/core/folder/picker"]');

        // cancel the form
        client
            .waitForElementPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] button[data-action="cancel"]', 10000)
            .click('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] button[data-action="cancel"]');

        // create a fresh rule
        client
            .click('.io-ox-settings-window .settings-detail-pane button[data-action="add"]')
            .waitForElementVisible('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] .modal-title', 10000);

        // add a "from" condition
        client
            .click('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] .add-condition a')
            .waitForElementVisible('.smart-dropdown-container .dropdown-menu a[data-value="from"]', 10000)
            .click('.smart-dropdown-container .dropdown-menu a[data-value="from"]');

        // add "keep" action
        client
            .click('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] .add-action a')
            .waitForElementVisible('.smart-dropdown-container .dropdown-menu a[data-value="keep"]', 10000)
            .click('.smart-dropdown-container .dropdown-menu a[data-value="keep"]');

        // set comparison to "Exists"
        client
            .waitForElementVisible('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] [data-test-id="0"]', 10000)
            .click('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] [data-test-id="0"] [data-toggle="dropdown"]')
            .waitForElementVisible('.smart-dropdown-container a[data-value="exists"]', 10000)
            .click('.smart-dropdown-container a[data-value="exists"]');

        // check if "Exists" is properly set
        client
            .assert.containsText('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] [data-test-id="0"] .dropdown-label', 'Exists')
            .assert.elementPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] [data-test-id="0"] input[name="values"]:disabled');

        // reset comparison to "Contains"
        client
            .waitForElementVisible('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] [data-test-id="0"]', 10000)
            .click('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] [data-test-id="0"] [data-toggle="dropdown"]')
            .waitForElementVisible('.smart-dropdown-container a[data-value="contains"]', 10000)
            .click('.smart-dropdown-container a[data-value="contains"]');

        // set the value
        client
            .setValue('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] [data-test-id="0"] input[name="values"]', 'Test Value');

        // check if "Contains" is properly set
        client
            .assert.containsText('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] [data-test-id="0"] .dropdown-label', 'Contains')
            .assert.elementNotPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] [data-test-id="0"] input[name="values"]:disabled')
            .assert.elementPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] [data-test-id="0"] input[name="values"]');

        // add a "header" test
        client
            .click('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] .add-condition a')
            .waitForElementVisible('.smart-dropdown-container .dropdown-menu a[data-value="cleanHeader"]', 10000)
            .click('.smart-dropdown-container .dropdown-menu a[data-value="cleanHeader"]')
            .waitForElementVisible('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li[data-test-id="0"]', 10000)
            .waitForElementVisible('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li[data-test-id="1"]', 10000)
            .assert.elementPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li[data-test-id="1"] .row.has-error input[name="headers"]')
            .assert.elementPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li[data-test-id="1"] .row.has-error input[name="values"]')
            .assert.elementNotPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li[data-test-id="0"] .row.has-error')
            .setValue('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] [data-test-id="1"] input[name="headers"]', 'Test headers')
            .assert.elementNotPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li[data-test-id="1"] .row.has-error input[name="headers"]')
            .setValue('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] [data-test-id="1"] input[name="values"]', 'Test values')
            .assert.elementNotPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li[data-test-id="1"] .row.has-error input[name="values"]')
            .click('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li[data-test-id="1"] .dropdownlink span')
            .waitForElementVisible('.smart-dropdown-container .dropdown-menu', 10000)
            .assert.elementPresent('.smart-dropdown-container .dropdown-menu a[data-value="exists"]')
            .click('.smart-dropdown-container .dropdown-menu a[data-value="exists"]')
            .assert.elementPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li[data-test-id="1"] input[name="values"]:disabled')
            .assert.value('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] [data-test-id="1"] input[name="values"]', '');

        // save the form
        client
            .waitForElementPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] button[data-action="save"]', 10000)
            .click('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] button[data-action="save"]');

        // open the saved rule
        client
            .waitForElementPresent('.io-ox-settings-window .settings-detail-pane li.settings-list-item[data-id="0"]', 10000)
            .click('.io-ox-settings-window .settings-detail-pane li.settings-list-item[data-id="0"] a[data-action="edit"]');

        // ckeck if the rule is correctly displayed
        client
            .waitForElementPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"]', 10000)
            .assert.elementNotPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li[data-test-id="0"] .row.has-error')
            .assert.value('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] [data-test-id="0"] input[name="values"]', 'Test Value')

            .assert.elementNotPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li[data-test-id="1"] .row.has-error input[name="headers"]')
            .assert.elementNotPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li[data-test-id="1"] .row.has-error input[name="values"]')
            .assert.value('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] [data-test-id="1"] input[name="headers"]', 'Test headers')
            .assert.elementPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li[data-test-id="1"] input[name="values"]:disabled')
            .assert.value('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] [data-test-id="1"] input[name="values"]', '')

            .assert.elementPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] [data-action-id="0"]')
            .assert.containsText('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] [data-action-id="0"] .list-title', 'Keep')
            .assert.elementPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] [data-action-id="0"] a.remove');

        // set the comparison to "contains"
        client
            .click('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li[data-test-id="1"] .dropdownlink span')
            .waitForElementVisible('.smart-dropdown-container .dropdown-menu', 10000)
            .assert.elementPresent('.smart-dropdown-container .dropdown-menu a[data-value="contains"]')
            .click('.smart-dropdown-container .dropdown-menu a[data-value="contains"]');

        // check if "Exists" is properly set
        client
            .assert.containsText('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] [data-test-id="0"] .dropdown-label', 'Contains')
            .assert.elementNotPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li[data-test-id="1"] input[name="values"]:disabled')
            .setValue('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] [data-test-id="1"] input[name="values"]', 'Test values')
            .assert.value('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] [data-test-id="1"] input[name="headers"]', 'Test headers');

        // save the form
        client
            .waitForElementPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] button[data-action="save"]', 10000)
            .click('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] button[data-action="save"]');

        // open the saved rule
        client
            .waitForElementNotPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"]', 10000)
            .click('.io-ox-settings-window .settings-detail-pane li.settings-list-item[data-id="0"] a[data-action="edit"]');

        // ckeck if the rule is correctly displayed
        client
            .waitForElementPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"]', 10000)
            .assert.elementNotPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li[data-test-id="0"] .row.has-error')
            .assert.value('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] [data-test-id="0"] input[name="values"]', 'Test Value')

            .assert.elementNotPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li[data-test-id="1"] .row.has-error input[name="headers"]')
            .assert.elementNotPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li[data-test-id="1"] .row.has-error input[name="values"]')
            .assert.value('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] [data-test-id="1"] input[name="headers"]', 'Test headers')
            .assert.value('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] [data-test-id="1"] input[name="values"]', 'Test values')
            .assert.elementPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] [data-action-id="0"]')
            .assert.containsText('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] [data-action-id="0"] .list-title', 'Keep')
            .assert.elementPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] [data-action-id="0"] a.remove');

        // cancel the form
        client
            .waitForElementPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] button[data-action="cancel"]', 10000)
            .click('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] button[data-action="cancel"]');

        // cleanup
        client
            .waitForElementPresent('.io-ox-settings-window .settings-detail-pane li.settings-list-item[data-id="0"]', 10000)
            .click('.io-ox-settings-window .settings-detail-pane li.settings-list-item[data-id="0"] a[data-action="delete"]')
            .waitForElementVisible('.abs.io-ox-dialog-wrapper button[data-action="delete"]', 10000)
            .click('.abs.io-ox-dialog-wrapper button[data-action="delete"]');

        client
            .waitForElementVisible('.io-ox-settings-window .settings-detail-pane .io-ox-mailfilter-settings h1', 10000)
            .assert.containsText('.io-ox-settings-window .settings-detail-pane .io-ox-mailfilter-settings h1', 'Mail Filter Rules')
            .waitForElementVisible('.io-ox-settings-window .settings-detail-pane .hint', 10000);

        client.logout();
    });

    it('adds and removes Mail Filter Rules with modified config ', function (client) {
        client
            .login('app=io.ox/settings', { prefix: 'io.ox/mail/mailfilter' })
            .waitForElementVisible('.io-ox-settings-main', 20000)
            .selectFolder({ id: 'virtual/settings/io.ox/mail' })
            .waitForElementVisible('.io-ox-settings-main li[data-id="virtual/settings/io.ox/mailfilter"]', 20000);

        // open mailfilter settings
        client.selectFolder({ id: 'virtual/settings/io.ox/mailfilter' });

        client
            .waitForElementVisible('.io-ox-settings-window .settings-detail-pane .io-ox-mailfilter-settings h1', 10000)
            .assert.containsText('.io-ox-settings-window .settings-detail-pane .io-ox-mailfilter-settings h1', 'Mail Filter Rules');

        // two rules with all components should be pressent
        client
            .assert.elementPresent('.io-ox-settings-window .settings-detail-pane .io-ox-mailfilter-settings li[data-id="25"]')
            .assert.containsText('.io-ox-settings-window .settings-detail-pane .io-ox-mailfilter-settings li[data-id="25"] .warning-message', 'This rule contains unsupported properties.')
            .assert.elementPresent('.io-ox-settings-window .settings-detail-pane .io-ox-mailfilter-settings li[data-id="26"]')
            .assert.elementPresent('.io-ox-settings-window .settings-detail-pane .io-ox-mailfilter-settings li[data-id="26"] [data-action="edit"]')
            .assert.elementPresent('.io-ox-settings-window .settings-detail-pane .io-ox-mailfilter-settings li[data-id="26"] [data-action="toggle"]')
            .assert.elementPresent('.io-ox-settings-window .settings-detail-pane .io-ox-mailfilter-settings li[data-id="26"] [data-action="toggle-process-subsequent"]')
            .assert.elementPresent('.io-ox-settings-window .settings-detail-pane .io-ox-mailfilter-settings li[data-id="26"] [data-action="delete"]');

        // open the second rule
        client
            .click('.io-ox-settings-window .settings-detail-pane .io-ox-mailfilter-settings li[data-id="26"] [data-action="edit"]')
            .waitForElementVisible('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"]', 10000)
            .assert.value('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] input[name="rulename"]', 'rule with discard');

        // check if all components are present as expected if an usupported comparison is involved
        client
            .assert.containsText('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li[data-test-id="0"] .list-title', 'From')
            .assert.containsText('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li[data-test-id="0"] .dropdownlink span.unsupported', 'contains')
            .click('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] .dropdownlink span.unsupported')
            .waitForElementVisible('.smart-dropdown-container .dropdown-menu', 10000)
            .assert.elementNotPresent('.smart-dropdown-container .dropdown-menu a[data-value="contains"]')
            .assert.elementPresent('.smart-dropdown-container .dropdown-menu a[data-value="not contains"]')
            .click('.smart-dropdown-container .dropdown-menu a[data-value="not contains"]')
            .assert.elementNotPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li[data-test-id="0"] .dropdownlink span.unsupported')
            .assert.containsText('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li[data-test-id="0"] .dropdownlink span', 'Contains not')
            .expect.element('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] .modal-footer input').to.not.be.selected;

        // check input handling for exists comparison for single test
        client
            .click('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] .dropdownlink span')
            .waitForElementVisible('.smart-dropdown-container .dropdown-menu', 10000)
            .assert.elementPresent('.smart-dropdown-container .dropdown-menu a[data-value="exists"]')
            .click('.smart-dropdown-container .dropdown-menu a[data-value="exists"]')
            .assert.elementPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li[data-test-id="0"] input:disabled')
            .assert.value('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] [data-test-id="0"] input[name="values"]', '')
            .click('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] .dropdownlink span')
            .waitForElementVisible('.smart-dropdown-container .dropdown-menu', 10000)
            .assert.elementPresent('.smart-dropdown-container .dropdown-menu a[data-value="not contains"]')
            .click('.smart-dropdown-container .dropdown-menu a[data-value="not contains"]')
            .assert.elementNotPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li[data-test-id="0"] input:disabled')
            .assert.elementPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li[data-test-id="0"] .row.has-error')
            .setValue('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] [data-test-id="0"] input[name="values"]', 'Test Value')
            .assert.value('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] [data-test-id="0"] input[name="values"]', 'Test Value')
            .assert.elementNotPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li[data-test-id="0"] .row.has-error');

        // add condition
        client
            .click('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] .add-condition a')
            .waitForElementVisible('.smart-dropdown-container .dropdown-menu a[data-value="to"]', 10000)
            .click('.smart-dropdown-container .dropdown-menu a[data-value="to"]')
            .waitForElementVisible('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li[data-test-id="0"]', 10000)
            .waitForElementVisible('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li[data-test-id="1"]', 10000)
            .assert.elementPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li[data-test-id="1"] .row.has-error')
            .assert.elementNotPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li[data-test-id="0"] .row.has-error')
            .setValue('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] [data-test-id="1"] input[name="values"]', 'Test Value')
            .assert.elementNotPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li[data-test-id="1"] .row.has-error');

        // remove first condition and check
        client
            .click('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li[data-test-id="0"] [data-action="remove-test"]')
            .waitForElementVisible('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li[data-test-id="0"]', 10000)
            .assert.containsText('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li[data-test-id="0"] .list-title', 'To');

        // for header
        client
            .click('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] .add-condition a')
            .waitForElementVisible('.smart-dropdown-container .dropdown-menu a[data-value="cleanHeader"]', 10000)
            .click('.smart-dropdown-container .dropdown-menu a[data-value="cleanHeader"]')
            .waitForElementVisible('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li[data-test-id="0"]', 10000)
            .waitForElementVisible('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li[data-test-id="1"]', 10000)
            .assert.elementPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li[data-test-id="1"] .row.has-error input[name="headers"]')
            .assert.elementPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li[data-test-id="1"] .row.has-error input[name="values"]')
            .assert.elementNotPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li[data-test-id="0"] .row.has-error')
            .setValue('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] [data-test-id="1"] input[name="headers"]', 'Test Value')
            .assert.elementNotPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li[data-test-id="1"] .row.has-error input[name="headers"]')
            .setValue('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] [data-test-id="1"] input[name="values"]', 'Test Value')
            .assert.elementNotPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li[data-test-id="1"] .row.has-error input[name="values"]')
            .click('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li[data-test-id="1"] .dropdownlink span')
            .waitForElementVisible('.smart-dropdown-container .dropdown-menu', 10000)
            .assert.elementPresent('.smart-dropdown-container .dropdown-menu a[data-value="exists"]')
            .click('.smart-dropdown-container .dropdown-menu a[data-value="exists"]')
            .assert.elementPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li[data-test-id="1"] input[name="values"]:disabled')
            .assert.value('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] [data-test-id="1"] input[name="values"]', '');

        // add action and check if the warnings disapears
        client
            .click('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] .add-action a')
            .waitForElementVisible('.smart-dropdown-container .dropdown-menu a[data-value="discard"]', 10000)
            .click('.smart-dropdown-container .dropdown-menu a[data-value="discard"]')
            .assert.elementNotPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li[data-test-id="1"] .row.has-error input[name="headers"]')
            .assert.elementNotPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li[data-test-id="1"] .row.has-error input[name="values"]');

        // action redirect is limitd to MAXREDIRECTS?
        client
            // 1
            .click('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] .add-action a')
            .waitForElementVisible('.smart-dropdown-container .dropdown-menu a[data-value="redirect"]', 10000)
            .click('.smart-dropdown-container .dropdown-menu a[data-value="redirect"]')
            // 2
            .click('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] .add-action a')
            .waitForElementVisible('.smart-dropdown-container .dropdown-menu a[data-value="redirect"]', 10000)
            .click('.smart-dropdown-container .dropdown-menu a[data-value="redirect"]')
            // 3
            .click('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] .add-action a')
            .waitForElementVisible('.smart-dropdown-container .dropdown-menu a[data-value="redirect"]', 10000)
            .click('.smart-dropdown-container .dropdown-menu a[data-value="redirect"]')
            // 4
            .click('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] .add-action a')
            .waitForElementVisible('.smart-dropdown-container .dropdown-menu a[data-value="redirect"]', 10000)
            .click('.smart-dropdown-container .dropdown-menu a[data-value="redirect"]')

            .click('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] .add-action a')
            .waitForElementVisible('.smart-dropdown-container .dropdown-menu a[data-value="discard"]', 10000)
            .assert.elementNotPresent('.smart-dropdown-container .dropdown-menu a[data-value="redirect"]')
            .click('.smart-dropdown-container .dropdown-menu a[data-value="discard"]');

        client
            .click('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] button[data-action="cancel"]');

        // open the second rule
        client
            .waitForElementVisible('.io-ox-settings-window .settings-detail-pane .io-ox-mailfilter-settings h1', 10000)
            .waitForElementVisible('.io-ox-settings-window .settings-detail-pane .io-ox-mailfilter-settings li[data-id="27"] [data-action="edit"]', 10000)
            .click('.io-ox-settings-window .settings-detail-pane .io-ox-mailfilter-settings li[data-id="27"] [data-action="edit"]')
            .waitForElementVisible('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"]', 10000)
            .assert.value('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] input[name="rulename"]', 'New rule');

        // check if all components are present as expected if an usupported comparison is involved and switched to "exist"
        client
            .assert.containsText('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li[data-test-id="0"] .list-title', 'From')
            .assert.containsText('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li[data-test-id="0"] .dropdownlink span.unsupported', 'contains')
            .assert.containsText('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li[data-test-id="1"] .list-title', 'Header')
            .assert.containsText('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li[data-test-id="1"] .dropdownlink span.unsupported', 'matches')
            .click('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li[data-test-id="1"] .dropdownlink span.unsupported')
            .waitForElementVisible('.smart-dropdown-container .dropdown-menu', 10000)
            .assert.elementPresent('.smart-dropdown-container .dropdown-menu a[data-value="exists"]')
            .click('.smart-dropdown-container .dropdown-menu a[data-value="exists"]')
            .assert.elementNotPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li[data-test-id="1"] .dropdownlink span.unsupported')
            .assert.containsText('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li[data-test-id="1"] .dropdownlink span', 'Exists')
            .assert.elementPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li[data-test-id="1"] input[name="headers"]')
            .assert.elementNotPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li[data-test-id="1"] input[name="headers"]:disabled')
            .assert.elementPresent('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] li[data-test-id="1"] input[name="values"]:disabled');

        client
            .click('[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"] button[data-action="cancel"]');

        client.logout();
    });

});
