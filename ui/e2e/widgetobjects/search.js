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

module.exports = {

    locators: {
        box: locate({ css: '.search-box' }).as('Search box'),
        field: locate({ css: 'input[type="search"]' }).as('Search field'),
        cancel: locate({ css: '.search-box button.action-cancel' }).as('Cancel')
    },

    // introducing methods
    doSearch(query) {
        I.click(this.locators.box);
        I.waitForVisible(this.locators.field);
        I.retry(5).click(this.locators.field);
        I.wait(0.5);
        I.retry(5).fillField(this.locators.field, query);
        I.waitForElement(`[data-query="${query}"]`);
        I.pressKey('Enter');
        I.waitForVisible(this.locators.box.find({ css: `span[title="${query}"]` }).as(`Result for ${query}`), 5);
        I.waitForElement('.fa-spin-paused');
    },

    cancel() {
        I.retry(5).click(this.locators.cancel);
        I.waitToHide(this.locators.cancel);
    }
};
