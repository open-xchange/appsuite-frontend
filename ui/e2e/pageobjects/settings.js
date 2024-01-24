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

const { I } = inject();

// data-point selectors for main content
const MAPPING = {
    'Basic Settings': 'io.ox/core/settings/detail/view',
    'Address Book': 'io.ox/contacts/settings/detail/view',
    'Calendar2': 'io.ox/calendar/settings/detail/view',
    'Drive': 'io.ox/files/settings/detail/view',
    'Mail': 'io.ox/mail/settings/detail/view',
    'Portal': 'io.ox/portal/settings/detail/view',
    'Tasks': 'io.ox/tasks/settings/detail/view'
};

module.exports = {

    locators: {
        tree: locate({ css: '.io-ox-settings-window .leftside .tree-container' }).as('Tree'),
        main: locate({ css: '.io-ox-settings-window .rightside' }).as('Main content')
    },

    waitForApp() {
        I.waitForElement(this.locators.tree);
        I.waitForElement(this.locators.main);
    },

    select(label) {
        const ID = MAPPING[label];
        I.waitForText(label, 5, this.locators.tree);
        I.click(label, this.locators.tree);
        I.waitForElement(ID ?
            this.locators.main.find(`.scrollable-pane > [data-point="${ID}"]`) :
            this.locators.main.find('h1').withText(label)
        );
    }
};
