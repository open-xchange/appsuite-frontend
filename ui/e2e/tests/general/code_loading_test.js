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

const expect = require('chai').expect;

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
    I.selectOption('Who can access this file?', 'Anyone with the public link and invited people');
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
    I.selectOption('Who can access this file?', 'Anyone with the public link and invited people');
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

Scenario('[OXUIB-1172] Allowlist bypass using E-Mail "deep links"', async ({ I, users, mail }) => {
    await I.haveMail({
        folder: 'default0/INBOX',
        path: 'media/mails/OXUIB-1172.eml'
    }, users[0]);

    I.login('app=io.ox/mail');
    mail.waitForApp();

    I.waitForText('This mail has a deeplink');
    I.click('.list-view .list-item');
    I.waitForElement('.mail-detail-frame');
    within({ frame: '.mail-detail-frame' }, async () => {
        I.waitForText('Click this link');
        const classes = await I.grabAttributeFrom(locate('a').withText('Click this link'), 'class');
        expect(classes || '').to.not.contain('deep-link-app');
    });
});

Scenario('[XSS] [OXUIB-1933] No malicious code execution when portal app with upsell ad gets loaded', async function ({ I, users, portal }) {

    const script = `require(['io.ox/core/yell'], function (yell) {
                        yell('error', 'XSS23')
                    })`;

    await Promise.all([
        users[0].context.hasCapability('upsell'),
        I.haveSetting('plugins/upsell//ads', {
            xssad: {
                slides: {
                    en_US: {
                        slide1: {
                            type: 'text-only',
                            text: `XSS <script>${script}</script> XSS`
                        }
                    }
                }
            }
        }),
        I.haveSetting('io.ox/portal//widgets/user', {
            upsellads_0: {
                color: 'default',
                enabled: true,
                id: 'upsellads_0',
                index: 1,
                inverse: false,
                plugin: 'plugins/portal/upsellads/register',
                props: {
                    ad: 'xssad'
                },
                userWidget: true
            }
        })
    ]);

    I.login('app=io.ox/portal');
    portal.waitForApp();
    I.waitForDetached('#io-ox-refresh-icon .fa-spin', 20);
    I.dontSee('XSS23');
});
