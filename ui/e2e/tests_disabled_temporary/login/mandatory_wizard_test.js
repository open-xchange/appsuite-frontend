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

/// <reference path="../../steps.d.ts" />

Feature('General > Mandatory Wizard');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C7341] Use first run mandatory wizard', async function ({ I, users, contacts, mail }) {
    const [user] = users;
    const first_name = 'John';
    const last_name = 'Wayne';
    await user.hasCapability('mandatory_wizard');

    I.amOnPage('ui');
    I.waitForInvisible('#background-loader.busy', 30);
    I.waitForFocus('#io-ox-login-username');
    // make sure we have an english UI
    I.click('.dropdown');
    I.clickDropdown('English (United States)');
    I.fillField('User name', `${user.get('name')}@${user.context.id}`);
    I.fillField('Password', user.get('password'));
    I.click('Sign in');
    I.waitForInvisible('#background-loader.busy', 20);
    I.waitForText('Welcome to OX App Suite');
    I.click('Start tour');
    I.waitForFocus('.form-control');
    I.fillField('first_name', first_name);
    I.fillField('last_name', last_name);
    I.pressKey('Enter');
    I.click('Next');
    let listenerID = I.registerNodeRemovalListener('.wizard-container');
    I.click('Finish');
    I.waitForNodeRemoval(listenerID);
    I.waitForInvisible('#background-loader.busy', 30);
    // mail is the default app, so wait for it to load to make sure the UI is ready
    mail.waitForApp();
    contacts.editMyContact();
    I.seeInField('first_name', first_name);
    I.seeInField('last_name', last_name);
});
