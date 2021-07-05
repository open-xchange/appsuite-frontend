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

Feature('Chat > History');

Before(async ({ users }) => {
    await Promise.all([
        users.create(),
        users.create()
    ]);
    await users[0].context.hasCapability('chat');
});

After(async ({ users }) => {
    await users[0].context.doesntHaveCapability('chat');
    await users.removeAll();
});

Scenario('Close chat, check in history and reopen chat', async ({ I, users, chat }) => {
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
