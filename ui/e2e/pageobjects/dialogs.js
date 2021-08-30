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
    // use xPath to locate foremost modal-dialog in case there are several open
    locators: {
        main: locate({ xpath: './/*[contains(@class, "modal-dialog") and not(ancestor::*[contains(@style, "display: none;")])]' }).as('Modal Main'),
        header: locate({ xpath: './/*[contains(@class, "modal-header") and not(ancestor::*[contains(@style, "display: none;")])]' }).as('Modal Header'),
        body: locate({ xpath: './/*[contains(@class, "modal-body") and not(ancestor::*[contains(@style, "display: none;")])]' }).as('Modal Body'),
        footer: locate({ xpath: './/*[contains(@class, "modal-footer") and not(ancestor::*[contains(@style, "display: none;")])]' }).as('Modal Footer')
    },

    clickButton(label) {
        const buttonLocator = locate({ xpath: `.//*[contains(@class, "modal-footer") and not(ancestor::*[contains(@style, "display: none;")])]//button[contains(., '${label}')]` }).as(label);

        // wait for button to be clickable
        I.waitForVisible(buttonLocator);
        I.waitForEnabled(buttonLocator, 10);
        I.click(label, this.locators.footer);
    },

    waitForVisible() {
        // wait for modal dialog to be visible and ready
        I.waitForVisible(this.locators.main);
        I.waitForInvisible({ xpath: './/*[contains(@class, "modal-dialog") and not(ancestor::*[contains(@style, "display: none;")]) and descendant-or-self::*[contains(@class, "io-ox-busy")]]' }, 30);
    }
};
