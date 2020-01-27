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
const { expect } = require('chai');

Feature('General > Help');

Before(async function (users) {
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

Scenario('Hide and show Help topics based on user capabilities', async function (I, users, contacts) {

    const checkIfDisplayNone = async (capability) => {
        I.waitForElement(`.listitem.cap-${capability}`);
        const displayProperties = await I.grabCssPropertyFrom(locate(`.listitem.cap-${capability}`), 'display');
        const result = displayProperties.every(displayProperty => displayProperty === 'none');
        expect(result).to.be.true;
    };

    // Disable calendar
    await users[0].doesntHaveCapability('calendar');

    I.login('app=io.ox/contacts', { user: users[0] });

    contacts.waitForApp();

    //open help window
    I.waitForElement('.io-ox-context-help');
    I.click('.io-ox-context-help');
    I.waitForElement('.io-ox-help-window');
    I.waitForVisible('.inline-help-iframe');

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

    // Disable tasks
    await users[0].doesntHaveCapability('tasks');
    I.refreshPage();
    contacts.waitForApp();

    // open help window
    I.waitForElement('.io-ox-context-help');
    I.click('.io-ox-context-help');
    I.waitForElement('.io-ox-help-window');
    I.waitForVisible('.inline-help-iframe');

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

    // Disable Drive
    await users[0].doesntHaveCapability('infostore');

    //close help
    I.refreshPage();
    contacts.waitForApp();

    //open help window
    I.waitForElement('.io-ox-context-help');
    I.click('.io-ox-context-help');
    I.waitForElement('.io-ox-help-window');
    I.waitForVisible('.inline-help-iframe');

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
