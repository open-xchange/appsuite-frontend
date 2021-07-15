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

Feature('General > Code Loading');

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

Scenario('[XSS] [OXUIB-400] No malicious code execution when code loading fails', async function ({ I, drive }) {
    I.login('app=io.ox/files:foo,xx/../../xxx");document.write("XSS");//');
    // will fail if xss was succesfull -> page is overwritten
    drive.waitForApp();
});

Scenario('[OXUIB-645] XSS using script code as module at app loader', async function ({ I, drive }) {
    I.login('app=io.ox/files');
    drive.waitForApp();
    I.clickToolbar('New');
    I.clickDropdown('Note');
    I.waitForElement('.io-ox-editor .title');
    I.fillField('.io-ox-editor .title', 'OXUIB-645.js');
    I.fillField('.io-ox-editor .content', 'document.write("XSS");');
    I.click('Save');
    I.wait(1);
    I.click('Close');
    I.click(locate('.list-item').withText('OXUIB-645.js'));
    drive.shareItem(true);
    I.selectOption('Who can access this file?', 'Anyone with the link and invited people');
    I.waitForNetworkTraffic();
    I.waitForElement('button[aria-label="Copy to clipboard"]:not([data-clipboard-text=""])');
    let url = await I.grabAttributeFrom('button[aria-label="Copy to clipboard"]', 'data-clipboard-text');
    url = new URL(url);
    I.click('Share', '.modal');
    I.waitToHide('.modal');
    const module = `${new Array(60).join('/..')}${url.pathname}?dl=1&cut=`;
    I.amOnPage('ui#!!&app=io.ox/files:foo,' + encodeURIComponent(module));
    I.refreshPage();
    drive.waitForApp();
});
