/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2020 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Anne Matthes <anne.matthes@open-xchange.com>
 */
/// <reference path="../../steps.d.ts" />

const { expect } = require('chai');

Feature('Chat - Delivery states');

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

Scenario('Update delivery states in private chats', async (I, users, chat) => {
    const unreadColor = 'rgb(51, 51, 51)';
    const readColor = 'rgb(2, 120, 212)';

    await session('Alice', async () => {
        I.login({ user: users[0] });
        chat.createPrivateChat(users[1].userdata.email1);
        I.waitForVisible('#firstCheck', 3, '.ox-chat');
        expect((await I.grabCssPropertyFrom('.ox-chat #firstCheck', 'stroke'))[0]).to.equal(unreadColor);
        expect((await I.grabCssPropertyFrom('.ox-chat #secondCheck', 'display'))[0]).to.equal('none');
    });

    await session('Bob', async () => {
        I.login({ user: users[1] });
        I.waitForText('New Chat', 30);
    });

    await session('Alice', async () => {
        expect((await I.grabCssPropertyFrom('.ox-chat #secondCheck', 'display'))[0]).to.equal('block');
        expect((await I.grabCssPropertyFrom('.ox-chat #firstCheck', 'stroke'))[0]).to.equal(unreadColor);
        expect((await I.grabCssPropertyFrom('.ox-chat #secondCheck', 'stroke'))[0]).to.equal(unreadColor);
    });

    await session('Bob', async () => {
        I.waitForText('User', 30, '.ox-chat');
        I.click(locate('.ox-chat li').withText('User'));
        I.waitForText('Hello.', 3, '.messages');
    });

    await session('Alice', async () => {
        I.wait(1);
        expect((await I.grabCssPropertyFrom('.ox-chat #firstCheck', 'stroke'))[0]).to.equal(readColor);
        expect((await I.grabCssPropertyFrom('.ox-chat #secondCheck', 'stroke'))[0]).to.equal(readColor);
    });
});

Scenario.skip('Update delivery states in groups', async (I, users, chat) => {
    await users.create();
    const groupTitle = 'Test Group';
    const emails = [users[1].userdata.email1, users[2].userdata.email1];
    const unreadColor = 'rgb(51, 51, 51)';
    const readColor = 'rgb(2, 120, 212)';

    await session('Alice', async () => {
        I.login({ user: users[0] });
        I.waitForText('New Chat', 30);
        I.click('New Chat');
        I.clickDropdown('Group chat');
        chat.fillNewGroupForm(groupTitle, emails);
        I.click(locate({ css: 'button' }).withText('Create chat'), '.ox-chat-popup');
        chat.sendMessage('Hey group!');

        I.waitForVisible('#firstCheck', 3, '.ox-chat');
        expect((await I.grabCssPropertyFrom('.ox-chat #firstCheck', 'stroke'))[0]).to.equal(unreadColor);
        expect((await I.grabCssPropertyFrom('.ox-chat #secondCheck', 'display'))[0]).to.equal('none');
    });

    await session('Bob', async () => {
        I.login({ user: users[1] });
        I.waitForText('New Chat', 30);
    });

    await session('Alice', async () => {
        expect((await I.grabCssPropertyFrom('.ox-chat #firstCheck', 'stroke'))[0]).to.equal(unreadColor);
        expect((await I.grabCssPropertyFrom('.ox-chat #secondCheck', 'display'))[0]).to.equal('none');
    });

    await session('Charlie', async () => {
        I.login({ user: users[2] });
        I.waitForText('New Chat', 30);
    });

    await session('Alice', async () => {
        pause();
        expect((await I.grabCssPropertyFrom('.ox-chat #secondCheck', 'display'))[0]).to.equal('block');
        expect((await I.grabCssPropertyFrom('.ox-chat #firstCheck', 'stroke'))[0]).to.equal(unreadColor);
        expect((await I.grabCssPropertyFrom('.ox-chat #secondCheck', 'stroke'))[0]).to.equal(unreadColor);
    });

    await session('Bob', async () => {
        I.waitForText(groupTitle, 30, '.ox-chat');
        I.click(locate('.ox-chat li').withText(groupTitle));
        I.waitForText('Hello.', 3, '.messages');
    });

    await session('Alice', async () => {
        I.wait(1);
        expect((await I.grabCssPropertyFrom('.ox-chat #secondCheck', 'display'))[0]).to.equal('block');
        expect((await I.grabCssPropertyFrom('.ox-chat #firstCheck', 'stroke'))[0]).to.equal(unreadColor);
        expect((await I.grabCssPropertyFrom('.ox-chat #secondCheck', 'stroke'))[0]).to.equal(unreadColor);
        pause();
    });

    await session('Charlie', async () => {
        I.waitForText(groupTitle, 30, '.ox-chat');
        I.click(locate('.ox-chat li').withText(groupTitle));
        I.waitForText('Hello.', 3, '.messages');
    });

    await session('Alice', async () => {
        I.wait(1);
        expect((await I.grabCssPropertyFrom('.ox-chat #firstCheck', 'stroke'))[0]).to.equal(readColor);
        expect((await I.grabCssPropertyFrom('.ox-chat #secondCheck', 'stroke'))[0]).to.equal(readColor);
    });
});
