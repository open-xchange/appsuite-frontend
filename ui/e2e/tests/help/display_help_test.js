/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
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

const { expect } = require('chai');

Feature('General > Help');

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

Scenario('Hide and show Help topics based on user capabilities', async function ({ I, users, contacts, topbar }) {

    const checkIfDisplayNone = async (capability) => {
        I.waitForElement(`.listitem.cap-${capability}`);
        const displayProperties = await I.grabCssPropertyFromAll(locate(`.listitem.cap-${capability}`), 'display');
        const result = displayProperties.every(displayProperty => displayProperty === 'none');
        expect(result, `expected ${capability} section to be hidden`).to.be.true;
    };

    // Disable calendar
    await users[0].hasModuleAccess({ calendar: false });

    I.login('app=io.ox/contacts', { user: users[0] });

    contacts.waitForApp();

    //open help window
    topbar.help();

    // Check if help shows info about disabled capability
    await within({ frame: '.inline-help-iframe' }, async () => {
        I.wait(1);
        I.waitForText('Start Page');
        I.click('Start Page');
        I.waitForElement('li.listitem.cap-tasks');
        I.scrollTo('.listitem.cap-tasks');
        I.waitForText('Tasks');
        await checkIfDisplayNone('calendar');
    });

    // additionally disable tasks
    await users[0].hasModuleAccess({ tasks: false });
    I.refreshPage();
    contacts.waitForApp();

    // open help window
    topbar.help();

    // Check if help shows info about disabled capability
    await within({ frame: '.inline-help-iframe' }, async () => {
        I.wait(1);
        I.waitForText('Start Page');
        I.click('Start Page');
        I.waitForElement('li.listitem.cap-infostore');
        I.scrollTo('li.listitem.cap-infostore');
        I.waitForText('Drive');

        await checkIfDisplayNone('calendar');
        await checkIfDisplayNone('tasks');
    });

    // additionally disable drive
    await users[0].hasModuleAccess({ infostore: false });

    //close help
    I.refreshPage();
    contacts.waitForApp();

    //open help window
    topbar.help();

    // Check if help shows info about disabled capability
    await within({ frame: '.inline-help-iframe' }, async () => {
        I.wait(1);
        I.waitForText('Start Page');
        I.click('Start Page');

        await checkIfDisplayNone('calendar');
        await checkIfDisplayNone('tasks');
        await checkIfDisplayNone('infostore');
    });

    I.logout();
});
