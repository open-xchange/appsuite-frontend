/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2020 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */
/// <reference path="../../steps.d.ts" />
Feature('Chat messages');

Before(async (users) => {
    await Promise.all([
        users.create(),
        users.create()
    ]);
    await users[0].context.hasCapability('chat');
});

After(async (users) => {
    await Promise.all([
        users.removeAll()
    ]);
});

Scenario.skip('Start a new chat', async (I, users) => {
    await session('Alice', async () => {
        I.login({ user: users[0] });
        I.waitForText('New Chat', 30);
        I.click('New Chat');
        I.clickDropdown('Private chat');
        I.waitForText(`${users[1].get('primaryEmail')}`);
        I.click(locate('.address-picker li').withText(`${users[1].get('primaryEmail')}`));
        I.click('Start conversation');
        I.waitForElement('.ox-chat .controls');
        I.fillField('Message', 'Wazzuuuuup?');
        I.pressKey('Enter');
    });
    await session('Bob', async () => {
        I.login({ user: users[1] });
        I.waitForText('User', 30, '.ox-chat');
        I.click(locate('.ox-chat li').withText('User'));
        I.fillField('Message', 'Nothing, just chillin\', some killin\'');
    });
    await session('Alice', async () => {
        I.see('is typing');
        I.dontSee('some killin');
    });
    await session('Bob', async () => {
        I.click('~Send');
    });
    await session('Alice', async () => {
        I.waitForText('some killin');
        I.dontSee('is typing');
    });
});
