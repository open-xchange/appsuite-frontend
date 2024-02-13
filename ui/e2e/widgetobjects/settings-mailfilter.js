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

const { I, dialogs } = inject();

module.exports = {

    locators: {
        tree: locate({ css: '.io-ox-settings-window .leftside .tree-container' }).as('Tree'),
        main: locate({ css: '.io-ox-settings-window .rightside' }).as('Main content'),
        dialog: locate({ css: '.modal[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"]' }).as('Create/Edit dialog'),
        lastaction: locate({ css: '.io-ox-mailfilter-edit .actions > li:last-of-type' }).as('Last action')
    },

    waitForApp() {
        I.waitForText('Filter Rules', 5, this.locators.tree);
        I.click('Filter Rules', this.locators.tree);
        I.waitForElement(this.locators.main.find('h1').withText('Mail Filter Rules'));
    },

    newRule(name) {
        I.click('Add new rule');
        I.waitForVisible(this.locators.dialog);
        I.waitForFocus('.modal-dialog .form-control');
        I.see('Create new rule');
        I.see('This rule applies to all messages. Please add a condition to restrict this rule to specific messages.');
        I.see('Please define at least one action.');
        // set rulename
        I.fillField('rulename', name);
    },

    addCondition(condition, value, field = 'values') {
        I.click('Add condition');
        I.clickDropdown(condition);
        I.waitForDetached('.dropdown.open');
        I.fillField(field, value);
    },

    addSubjectCondition(value) {
        I.click('Add condition');
        I.clickDropdown('Subject');
        I.waitForDetached('.dropdown.open');
        I.fillField('values', value);
    },

    addSimpleAction(label) {
        I.click('Add action');
        I.clickDropdown(label);
        I.waitForDetached('.dropdown.open');
    },

    addAction(label, value) {
        I.click('Add action');
        I.clickDropdown(label);
        I.waitForDetached('.dropdown.open');
        I.fillField(this.locators.lastaction.find('input[name]'), value);
    },

    setFlag(flag) {
        I.click('Add action');
        I.clickDropdown('Set color flag');
        I.waitForDetached('.dropdown.open');
        I.waitForVisible('~Set color');
        I.click('~Set color');

        I.waitForVisible('.flag-dropdown');
        I.click(flag, '.flag-dropdown');
    },

    save() {
        dialogs.clickButton('Save');
        I.waitForDetached(this.locators.dialog);
        I.waitForVisible('.settings-detail-pane li.settings-list-item[data-id="0"]');
    }

};
