/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2020 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
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

Scenario('[OXUIB-645] XSS using script code as module at app loader', async function ({ I, drive, dialogs }) {
    I.login('app=io.ox/files');
    drive.waitForApp();
    I.clickToolbar('New');
    I.clickDropdown('Add note');
    I.waitForElement('.io-ox-editor .title');
    I.fillField('.io-ox-editor .title', 'OXUIB-645.js');
    I.fillField('.io-ox-editor .content', 'document.write("XSS");');
    I.click('Save');
    I.wait(1);
    I.click('Close');
    I.click(locate('.list-item').withText('OXUIB-645.js'));
    drive.shareItem('Create sharing link');
    dialogs.waitForVisible();
    I.waitForNetworkTraffic();
    let url = await I.grabValueFrom('.input-group.link-group .form-control');
    url = new URL(url);
    dialogs.clickButton('Close');
    I.waitToHide('.modal');
    const module = `${new Array(60).join('/..')}${url.pathname}?dl=1&cut=`;
    I.amOnPage('ui#!!&app=io.ox/files:foo,' + encodeURIComponent(module));
    I.refreshPage();
    drive.waitForApp();
});

Scenario('[OXUIB-872] XSS using script code as module at app loader', async function ({ I, drive }) {
    I.login('app=io.ox/files');
    drive.waitForApp();
    I.clickToolbar('New');
    I.clickDropdown('Note');
    I.waitForElement('.io-ox-editor .title');
    I.fillField('.io-ox-editor .title', 'OXUIB-872.js');
    I.fillField('.io-ox-editor .content', 'document.write("XSS");');
    I.click('Save');
    I.wait(1);
    I.click('Close');
    I.click(locate('.list-item').withText('OXUIB-872.js'));
    drive.shareItem(true);
    I.selectOption('Who can access this file?', 'Anyone with the link and invited people');
    I.waitForNetworkTraffic();
    I.waitForElement('button[aria-label="Copy to clipboard"]:not([data-clipboard-text=""])');
    let url = await I.grabAttributeFrom('button[aria-label="Copy to clipboard"]', 'data-clipboard-text');
    url = new URL(url);
    I.click('Share', '.modal');
    I.waitToHide('.modal');
    const module = `${new Array(60).join('/%252e.')}${url.pathname}?dl=1&cut=`;
    I.amOnPage('#!!&app=io.ox/files:foo,' + module);
    I.refreshPage();
    drive.waitForApp();
});
