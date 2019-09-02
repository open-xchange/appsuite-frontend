/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Maik Schäfer <maik.schaefer@open-xchange.com>
 *
 */

/// <reference path="../../steps.d.ts" />

const { expect } = require('chai');

Feature('Login');

Before(async (users) => {
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});

Scenario('[C7336] Successful Login', function (I, users) {
    I.amOnPage('/');
    I.waitForFocus('input[name="username"]');
    I.fillField('User name', `${users[0].get('name')}@${users[0].context.id}`);
    I.fillField('Password', users[0].get('password'));
    I.click('Sign in');
    I.waitForText('No message selected');
});

Scenario('[C7337] Unsuccessful Login', function (I, users) {
    I.amOnPage('/');
    I.waitForFocus('input[name="username"]');
    I.fillField('User name', `${users[0].get('name')}@${users[0].context.id}`);
    I.fillField('Password', 'wrong password');
    I.click('Sign in');
    I.waitForText('The user name or password is incorrect.');
});

Scenario('[C7339] Stay signed in checkbox', async function (I, users) {
    I.amOnPage('/');
    I.waitForFocus('input[name="username"]');
    I.fillField('User name', `${users[0].get('name')}@${users[0].context.id}`);
    I.fillField('Password', `${users[0].get('password')}`);
    I.seeCheckboxIsChecked('Stay signed in');
    I.click('Sign in');
    I.waitForVisible('#io-ox-core');
    let cookies = await I.grabCookie(),
        secretCookie = cookies.filter(c => c.name.indexOf('open-xchange-secret') === 0)[0];

    expect(secretCookie, 'browser session cookies don\'t have expiry set').to.haveOwnProperty('expiry');
    I.refreshPage();
    I.waitForVisible('#io-ox-core');
    I.logout();

    I.waitForFocus('input[name="username"]');
    I.uncheckOption('Stay signed in');
    I.login();
    I.waitForVisible('#io-ox-core');
    cookies = await I.grabCookie();
    secretCookie = cookies.filter(c => c.name.indexOf('open-xchange-secret') === 0)[0];
    const sessionCookies = cookies.filter(c => typeof c.expiry === 'undefined');

    expect(secretCookie, 'browser session cookies don\'t have expiry set').not.to.haveOwnProperty('expiry');
    // simulate a browser restart by removing all session cookies
    for (let cookie of sessionCookies) {
        I.clearCookie(cookie.name);
    }
    I.refreshPage();
    I.waitForVisible('#io-ox-login-screen');
});

Scenario('[C7340] Successful logout', function (I) {
    I.login();
    I.logout();
    I.waitForVisible('#io-ox-login-screen');
});

Scenario('[C163025] Screen gets blured when session times out', function (I) {
    I.login();
    I.clearCookie();
    I.waitForElement('.abs.unselectable.blur');
});
