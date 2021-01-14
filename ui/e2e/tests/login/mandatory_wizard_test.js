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
