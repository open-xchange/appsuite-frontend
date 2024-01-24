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
        addWidget: locate({ css: 'button.add-widget' }).as('Add Widget'),
        dropdown: locate({ css: '.io-ox-portal-settings-dropdown' }).as('Dropdown'),
        list: locate({ css: '.widgets' }).as('Widget list')
    },

    waitForApp() {
        I.waitForVisible({ css: '.io-ox-portal' });
        I.waitForText('Add widget', 10, '.io-ox-portal');
    },

    openDropdown() {
        I.click(this.locators.addWidget);
        I.waitForVisible(this.locators.dropdown);
    },

    addWidget(name) {
        this.openDropdown();
        I.click(`${name}`, this.locators.dropdown);
        if (name === 'Inbox') {
            dialogs.waitForVisible();
            dialogs.clickButton('Save');
        }
        I.waitForElement(`~${name}`);
    }

};
