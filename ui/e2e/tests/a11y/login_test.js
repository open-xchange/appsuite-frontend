/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2018 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author David Bauer <david.bauer@open-xchange.com>
 */
/// <reference path="../../steps.d.ts" />

const { expect } = require('chai');

Feature('Accessibility');

BeforeSuite(async function ({ users }) {
    await users.create();
});

AfterSuite(async function ({ users }) {
    await users.removeAll();
});

// Exceptions:
// Login form does not have a visible label
const excludes = { exclude: [['#io-ox-login-username'], ['#io-ox-login-password']] };

Scenario('Login page (with exceptions)', async ({ I }) => {
    I.amOnPage('ui');
    I.waitForInvisible('#background-loader');

    expect(await I.grabAxeReport(excludes)).to.be.accessible;
});
