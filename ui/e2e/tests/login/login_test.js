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

const { expect } = require('chai');

Feature('Login');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});


Scenario('[C7336] Successful Login', async function ({ I, users }) {
    await users[0].hasConfig('io.ox/core//autoStart', 'io.ox/mail/main');
    I.amOnPage('ui');
    I.setCookie({ name: 'locale', value: 'en_US' });
    I.refreshPage();

    I.waitForFocus('#io-ox-login-username', 30);
    I.fillField('User name', `${users[0].get('name')}@${users[0].context.id}`);
    I.fillField('Password', users[0].get('password'));
    I.click('Sign in');
    I.waitForText('No message selected', 30);
});

Scenario('[C7337] Unsuccessful Login', function ({ I, users }) {
    I.amOnPage('ui');
    I.setCookie({ name: 'locale', value: 'en_US' });
    I.refreshPage();
    I.waitForFocus('#io-ox-login-username', 30);
    I.fillField('User name', `${users[0].get('name')}@${users[0].context.id}`);
    I.fillField('Password', 'wrong password');
    I.click('Sign in');
    I.waitForText('The user name or password is incorrect.');
});

Scenario('[C7339] Stay signed in checkbox', async function ({ I, users }) {
    I.amOnPage('ui');
    I.setCookie({ name: 'locale', value: 'en_US' });
    I.refreshPage();
    I.waitForFocus('#io-ox-login-username', 30);
    I.fillField('User name', `${users[0].get('name')}@${users[0].context.id}`);
    I.fillField('Password', `${users[0].get('password')}`);
    I.seeCheckboxIsChecked('Stay signed in');
    I.click('Sign in');
    I.waitForVisible('#io-ox-core');
    let cookies = await I.grabCookie(),
        secretCookie = cookies.filter(c => c.name.indexOf('open-xchange-secret') === 0)[0];

    const hasProperty = (o, p) => Object.prototype.hasOwnProperty.call(o, p);
    // webdriver sets "expiry" and puppeteer sets "expires"
    const expiresWithSession = c => hasProperty(c, 'expires') ? c.expires < 0 : !hasProperty(c, 'expiry');

    expect(expiresWithSession(secretCookie), 'browser session cookies do expire with session').to.equal(false);
    I.refreshPage();
    I.waitForVisible('#io-ox-topbar-account-dropdown-icon');
    I.logout();

    I.waitForFocus('#io-ox-login-username', 30);
    I.uncheckOption('Stay signed in');
    I.login();
    I.waitForVisible('#io-ox-core');
    cookies = await I.grabCookie();
    secretCookie = cookies.filter(c => c.name.indexOf('open-xchange-secret') === 0)[0];
    const sessionCookies = cookies.filter(expiresWithSession);

    expect(expiresWithSession(secretCookie), 'browser session cookies do expire with session').to.equal(true);
    // simulate a browser restart by removing all session cookies
    for (let cookie of sessionCookies) {
        I.clearCookie(cookie.name);
    }
    I.refreshPage();
    I.waitForVisible('#io-ox-login-screen');
});

Scenario('[C7340] Successful logout', function ({ I }) {
    I.login();
    I.logout();
    I.waitForVisible('#io-ox-login-screen');
});

Scenario('[C163025] Screen gets blured when session times out', function ({ I }) {
    I.login();
    I.clearCookie();
    I.waitForElement('.abs.unselectable.blur');
});

Scenario('[OXUIB-74] Redirect during autologin using LGI-0016 error', async function ({ I }) {
    I.amOnPage('ui');
    I.mockRequest('GET', `${process.env.LAUNCH_URL}/api/login?action=autologin`, {
        error: 'http://www.open-xchange.com/',
        error_params: ['http://www.open-xchange.com/'],
        code: 'LGI-0016'
    });
    I.refreshPage();
    await I.executeScript(function () {
        return require(['io.ox/core/extensions']).then(function (ext) {
            ext.point('io.ox/core/boot/login').extend({
                id: 'break redirect',
                after: 'autologin',
                login: function () {
                    _.url.redirect('http://example.com/');
                }
            });
        });
    });
    I.waitInUrl('open-xchange.com', 5);
});


Scenario('[OXUIB-651] Login not possible with Chrome and umlauts in username', async function ({ I }) {
    I.amOnPage('ui');
    I.setCookie({ name: 'locale', value: 'en_US' });
    I.refreshPage();
    I.waitForFocus('#io-ox-login-username', 30);
    I.fillField('User name', 'mister@Täst.com');
    I.pressKey('Enter');
    let email = await I.grabValueFrom('#io-ox-login-username');
    expect(email).to.equal('mister@Täst.com');
});
