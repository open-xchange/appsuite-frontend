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
        compose: {
            close: locate({ css: '.io-ox-mail-compose-window button[aria-label="Save and close"]' }).as('Save and Close'),
            minimize: locate({ css: '.io-ox-mail-compose-window.active button[aria-label="Minimize"]' }).as('Minimize'),
            options: locate({ css: '[data-extension-id="composetoolbar-menu"] a[aria-label="Options"]' }).as('Options dropdown'),
            localfile: locate({ css: '.composetoolbar a[aria-label="Add local file"]' }).as('Add local file'),
            drivefile: locate({ css: '.composetoolbar a[aria-label="Add from Drive"]' }).as('Add from Drive')
        }
    },

    waitForApp() {
        // wait for listview, detailview, toolbar and foldertree to be visible
        I.waitForVisible({ css: '[data-ref="io.ox/mail/listview"]' }, 5);
        I.waitForVisible({ css: '.rightside.mail-detail-pane' }, 5);
        I.waitForVisible({ css: '.io-ox-mail-window .classic-toolbar-container .classic-toolbar' }, 5);
        I.waitForVisible({ css: '[data-id="virtual/standard"]' }, 5);
        //wait for all busy classes to disappear
        I.waitForInvisible('[data-ref="io.ox/mail/listview"] .busy-indicator', 5);
    },
    selectMail(text) {
        const item = locate('.list-view li.list-item').withText(text);
        I.waitForElement(item, 30);
        I.wait(0.5);
        I.click(item);
        I.waitForFocus('.list-view li.list-item.selected');
    },
    selectMailByIndex(index) {
        const item = locate('.list-view li.list-item').withAttr({ 'data-index': index.toString() });
        I.waitForElement(item);
        I.wait(0.5);
        I.click(item);
        I.waitForFocus('.list-view li.list-item.selected');
    },
    newMail() {
        I.waitForText('Compose', 5, '.io-ox-mail-window .classic-toolbar-container');
        I.clickToolbar('~Compose new email');
        I.waitForVisible('.active .io-ox-mail-compose [placeholder="To"]', 30);
        I.waitForFocus('.active .io-ox-mail-compose [placeholder="To"]');
    },
    addAttachment(path) {
        var ext = path.match(/\.(.{3,4})$/)[1];
        I.attachFile({ css: 'input[type=file]' }, path);
        I.waitForText(ext.toUpperCase(), 5, '.inline-items.preview');
    },
    send() {
        I.waitForClickable('.btn[data-action="send"]');
        I.click('Send');
        I.wait(0.5);
        I.waitToHide('.io-ox-mail-compose-window');
        I.waitToHide('.generic-toolbar.mail-progress', 45);
    }
};
