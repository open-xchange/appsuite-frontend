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
        suggestion: locate({ css: '.tt-dropdown-menu .tt-suggestion:nth-of-type(1)' }).as('First suggestion'),
        suggestions: locate({ css: '.tt-dropdown-menu' }).as('Suggestion dropdown')
    },

    select(elementName, within) {
        let context = within === '*' ? '//span[@class="tt-dropdown-menu"]' : `//div[contains(@class, "${within}")]//span[@class="tt-dropdown-menu"]`;

        I.waitForText(elementName, 10, context);
        I.wait(1);

        // searched entry could be a resource or user where the DOM structure differs
        I.retry(5).click(`${context}//div[@class="participant-name"]/strong[text()="${elementName}"]|` +
            `//div[@class="participant-email"]/span/strong[text()="${elementName}"]`);
    },

    selectFirst() {
        I.waitForVisible(this.locators.suggestion, 5);
        I.waitForEnabled(this.locators.suggestion, 5);
        I.click(this.locators.suggestion);
        I.waitForInvisible(this.locators.suggestions);
    }
};
