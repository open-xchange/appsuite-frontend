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

Feature('A11y for Login page');

Before(async function (users) {
    await users.create();
});

Scenario.skip('Login page is accessible', async function (I) {
    I.amOnPage('/');

    I.waitForVisible('~Sign in');
    const currentView = await I.grabAxeReport();
    expect(currentView).to.be.accessible;
});
