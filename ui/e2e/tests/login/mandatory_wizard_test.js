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

Before(async (users) => {
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});

// TODO: shaky (element (body) is not in DOM or there is no element(body) with text "Welcome to OX App Suite" after 30 sec)
Scenario.skip('[C7341] Use first run mandatory wizard', async function (I, users) {
    const [user] = users;
    const first_name = 'John';
    const last_name = 'Wayne';
    await user.hasCapability('mandatory_wizard');

    I.amOnPage('/');
    I.wait(1);
    I.fillField('User name', `${user.get('name')}@${user.context.id}`);
    I.fillField('Password', user.get('password'));
    I.click('Sign in');
    I.waitForText('Welcome to OX App Suite');
    I.click('Start tour');
    I.waitForFocus('.form-control');
    I.fillField('first_name', first_name);
    I.fillField('last_name', last_name);
    I.pressKey('Enter');
    I.click('Next');
    I.click('Finish');
    I.waitForVisible('#io-ox-launcher');
    I.waitForNetworkTraffic();
    I.waitForVisible('.contact-picture');
    I.click('.contact-picture');
    I.waitForText('My contact data');
    I.click('My contact data');
    I.waitForText('My contact data');
    I.seeInField('first_name', first_name);
    I.seeInField('last_name', last_name);
});
