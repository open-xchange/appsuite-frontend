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

const { I } = inject();


module.exports = {

    locators: {
        popup: locate({ css: '.addressbook-popup' }).as('Addressbook Popup'),
        searchfield: locate({ css: '.addressbook-popup .search-field' }).as('Search field'),
        results: locate({ css: '.addressbook-popup' }).find({ css: '.list-item' }).as('Results')
    },

    ready() {
        I.waitForVisible(this.locators.popup, 5);
    },

    add(name) {
        this.ready();
        this.search(name);
        this.selectFirst();
    },

    search(query) {
        // custom helper doesn't support locators yet
        I.waitForFocus('.addressbook-popup .search-field');
        I.fillField(this.locators.searchfield, query);
        I.waitForVisible(this.locators.results);
    },

    selectFirst() {
        I.waitForEnabled(this.locators.results);
        I.waitForEnabled(this.locators.results.first().as('First list item'));
        I.click(this.locators.results.first().as('First list item'));
        I.waitForVisible(locate({ css: '.list-item.selected' }).as('Selected list item'));
    },

    close() {
        I.click('Select');
        I.waitToHide(this.locators.popup);
    }
};
