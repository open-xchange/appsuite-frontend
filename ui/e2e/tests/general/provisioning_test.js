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

Feature('General > Provisioning');

const expect = require('chai').expect;

Before(async ({ users }) => {
    await users.create();
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

async function hasCapability(I, capability) {
    var boolean = await I.executeScript(async function (capability) {
        var caps = await require('io.ox/core/capabilities');
        return caps.has(capability);
    }, capability);
    expect(boolean).to.equal(true, `capability '${capability}' not available`);
}

// Can be used as blueprint to enable specific capabilities
Scenario.skip('Enable cardav via url param', async function ({ I, users, portal }) {
    const capability = 'carddav';

    I.say('user #1');
    I.login('app=io.ox/portal&cap=' + capability, users[1]);
    portal.waitForApp();
    await hasCapability(I, capability);
    I.logout();

    I.say('user #2');
    I.login('app=io.ox/portal&cap=' + capability, users[1]);
    portal.waitForApp();
    await hasCapability(I, capability);

    I.say('user #2 refreshed');
    I.refreshPage();
    portal.waitForApp();
    await hasCapability(I, capability);
});

// Can be used as blueprint to enable specific capabilities
Scenario.skip('Enable carddav via config', async function ({ I, users, portal }) {
    const capability = 'carddav';
    I.say('user #1');
    await users[0].hasConfig('com.openexchange.' + capability + '.enabled', true);
    I.login('app=io.ox/portal');
    portal.waitForApp();
    await hasCapability(I, capability);

    I.say('user #2 refreshed');
    I.refreshPage();
    portal.waitForApp();
    await hasCapability(I, capability);
});

// Can be used as blueprint to enable specific capabilities
// TODO: currently broken as middleware returns "The capabilities 'carddav' are in conflict with permissions! Permissions must not be defined as capabilities."
Scenario.skip('Enable carddav via context', async function ({ I, users, portal }) {
    const capability = 'carddav';
    await users[0].context.hasCapability(capability);
    I.login('app=io.ox/portal');
    portal.waitForApp();

    await hasCapability(I, capability);
    // I.refreshPage();
    // await hasCapability(I, capability)
});

