/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Luca Stein <luca.stein@open-xchange.com>
 */

Feature('General > Help');

Before(async function (users) {
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

Scenario('Hide and show Help topics based on user capabilities', async function (I, users, contacts) {

    // Disable calendar
    await users[0].doesntHaveCapability('calendar');

    I.login('app=io.ox/contacts', { user: users[0] });

    contacts.waitForApp();

    //open help window
    I.waitForElement('.io-ox-context-help');
    I.click('.io-ox-context-help');
    I.waitForElement('.io-ox-help-window');

    // Check if help shows info about disabled capability
    await within({ frame: '.inline-help-iframe' }, () => {
        I.waitForText('Start Page');
        I.click('Start Page');
        I.waitForText('Tasks');
        I.dontSee('Calendar');
    });

    // Disable tasks
    await users[0].doesntHaveCapability('tasks');
    I.refreshPage();
    contacts.waitForApp();

    // open help window
    I.waitForElement('.io-ox-context-help');
    I.click('.io-ox-context-help');
    I.waitForElement('.io-ox-help-window');

    // Check if help shows info about disabled capability
    await within({ frame: '.inline-help-iframe' }, () => {
        I.waitForText('Start Page');
        I.click('Start Page');
        I.waitForText('Drive');
        I.dontSee('Calendar');
        I.dontSee('Tasks');
    });

    // Disable Drive
    await users[0].doesntHaveCapability('infostore');

    //close help
    I.refreshPage();
    contacts.waitForApp();

    //open help window
    I.waitForElement('.io-ox-context-help');
    I.click('.io-ox-context-help');
    I.waitForElement('.io-ox-help-window');

    // Check if help shows info about disabled capability
    await within({ frame: '.inline-help-iframe' }, () => {
        I.waitForText('Start Page');
        I.click('Start Page');
        I.retry(5).dontSee('Calendar');
        I.dontSee('Tasks');
        I.dontSee('Drive');
    });

    I.logout();
});
