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

const { I, dialogs } = inject();

module.exports = {
    waitForApp() {
        // wait untill all importand nodes are drawn
        I.waitForElement('.file-list-view.complete');
        I.waitForVisible({ css: '.io-ox-files-window .folder-tree' }, 5);
        I.waitForVisible({ xpath: './/*[contains(@class, "io-ox-files-window")]//*[@class="classic-toolbar-container"]//*[@class="classic-toolbar" and not(ancestor::*[contains(@style, "display: none;")])]' });
        I.waitForVisible({ xpath: './/*[contains(@class, "secondary-toolbar")]//*[contains(@class, "breadcrumb-view") and not(ancestor::*[contains(@style, "display: none")])]' }, 5);
        // wait a bit because breadcrumb has some redraw issues atm (redraws 7 times)
        // TODO Fix the redraw issue
        I.wait(0.5);
    },
    waitForViewer() {
        I.waitForText('Details', 10, '.io-ox-viewer .sidebar-panel-title');
    },
    shareItem(file) {
        I.clickToolbar('Share');
        dialogs.waitForVisible();
        if (file) {
            I.waitForText('Who can access this file?');
        } else {
            I.waitForText('Who can access this folder?');
        }
    }
};
