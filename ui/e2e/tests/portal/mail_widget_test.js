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

/// <reference path="../../steps.d.ts" />

const expect = require('chai').expect;

Feature('Portal');

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});


Scenario('adding a mail containing XSS code', async function ({ I, users, portal, dialogs }) {
    let [user] = users;
    await I.haveMail({
        attachments: [{
            content: '<img src="x" onerror="alert(1337);">\r\n',
            content_type: 'text/plain',
            raw: true,
            disp: 'inline'
        }],
        from: [[user.get('displayname'), user.get('primaryEmail')]],
        sendtype: 0,
        subject: 'Test subject <img src="x" onerror="alert(666);">',
        to: [[user.get('displayname'), user.get('primaryEmail')]]
    });

    I.login('app=io.ox/mail');
    I.waitForVisible('.io-ox-mail-window');
    I.waitForText('Test subject', 5, '.io-ox-mail-window .leftside');

    // click on first email
    I.click('.io-ox-mail-window .leftside ul li.list-item');
    I.clickToolbar({ css: '.io-ox-mail-window .classic-toolbar [data-action="more"]' });
    I.click('Add to portal', '.dropdown.open .dropdown-menu');
    I.waitForDetached('#io-ox-refresh-icon .fa-spin');

    I.openApp('Portal');

    portal.waitForApp();

    I.waitForVisible('.io-ox-portal-window .widgets li.widget:first-child');
    let widgetId = await I.grabAttributeFrom('.io-ox-portal-window .widgets li.widget:first-child', 'data-widget-id');
    widgetId = Array.isArray(widgetId) ? widgetId[0] : widgetId; // differs in puppeteer vs. webdriver
    let type = await I.grabAttributeFrom('.io-ox-portal-window .widgets li.widget:first-child', 'data-widget-type');
    type = Array.isArray(type) ? type[0] : type; // differs in puppeteer vs. webdriver
    expect(type).to.equal('stickymail');

    I.waitForText('Test subject <img src="x" onerror="alert(666);">', 5, `.io-ox-portal-window .widgets li.widget[data-widget-id="${widgetId}"] .title`);

    I.click(`.io-ox-portal-window .widgets li.widget[data-widget-id="${widgetId}"] .disable-widget`);
    dialogs.waitForVisible();
    dialogs.clickButton('Delete');
    I.waitForDetached(`.io-ox-portal-window .widgets li.widget[data-widget-id="${widgetId}"]`);
});
