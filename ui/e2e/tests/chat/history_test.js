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

Feature('Chat history');

Before(async (users) => {
    await Promise.all([
        users.create(),
        users.create()
    ]);
    await users[0].context.hasCapability('chat');
});

After(async (users) => {
    await users[0].context.doesntHaveCapability('chat');
    await users.removeAll();
});

Scenario('Close chat, check in history and reopen chat', async (I, users, chat) => {
    await session('Alice', async () => {
        I.login({ user: users[0] });
        chat.openChat();
        chat.createPrivateChat(users[1].userdata.email1);
    });

    await session('Bob', async () => {
        I.login({ user: users[1] });
        chat.openChat();
        I.waitForText('User', 30, '.ox-chat');
        I.waitForNetworkTraffic();

        // check history
        I.click(locate({ css: 'button' }).withText('History'), '.ox-chat');
        I.waitForText('User', 3, '.ox-chat');
        I.waitForText('Open', 3, '.ox-chat');
        I.click('~Close chat', '.ox-chat');

        // close chat
        I.waitForText('User', 3, '.ox-chat');
        I.click('User', '.ox-chat .chats-row');
        I.waitForElement('~More actions', 3, '.ox-chat');
        I.click('~More actions', '.ox-chat');
        I.waitForElement('.smart-dropdown-container.more-dropdown');
        I.click('Close chat', '.smart-dropdown-container.more-dropdown');
        I.waitForText('New Chat', 3, '.ox-chat');
        I.waitForDetached('User', 3, '.ox-chat .chats-row');

        // reopen chat
        I.click(locate({ css: 'button' }).withText('History'), '.ox-chat');
        I.waitForText('Open', 3, '.ox-chat');
        I.click('Open', '.ox-chat');
        I.waitForText('Hello.', 3, '.ox-chat');
        I.click('~Close chat', '.ox-chat');
        I.waitForText('User', 3, '.ox-chat');
    });
});
