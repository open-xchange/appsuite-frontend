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

Feature('Chat > User settings');

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

Scenario('Last used chat will be re-opened on next start', async ({ I, users, chat }) => {
    I.login({ user: users[0] });
    chat.openChat();
    chat.createPrivateChat(users[1].userdata.email1);
    I.waitForText('Hello.', 3, '.ox-chat');
    I.waitForNetworkTraffic();

    I.refreshPage();
    I.waitForVisible('#io-ox-core', 30);
    chat.openChat();
    I.waitForText('Hello.', 30, '.ox-chat');
});

Scenario('Last used chat will not be re-opened on next start', async ({ I, users, chat }) => {
    I.login({ user: users[0] });
    chat.openChat();
    chat.createPrivateChat(users[1].userdata.email1);
    I.waitForText('Hello.', 3, '.ox-chat');

    // change settings
    I.click('~Settings');
    I.clickDropdown('Settings');
    I.waitForElement('.folder.virtual.open[data-model="virtual/settings/main"]');
    I.click({ css: 'li[data-id="virtual/settings/chat"]' });
    I.waitForText('View options', 3, '.scrollable-pane');
    I.click('Select last chat on start', '.scrollable-pane');

    // check
    I.refreshPage();
    I.waitForNetworkTraffic();
    chat.openChat();
    I.waitForText('User', 3, '.ox-chat');
    I.dontSee('Hello.', '.ox-chat');
});

Scenario('Sort and group chats', async ({ I, users, contexts, chat, dialogs }) => {
    const context = await contexts.create();
    context.hasCapability('chat');
    const alice = await users.create(users.getRandom(), context);
    const bob = await users.create(users.getRandom(), context);
    const charlie = await users.create(users.getRandom(), context);

    const groupTitle = 'A Test Group';
    const channelTitle = 'B Test Channel';
    const emails = [bob.userdata.email1, charlie.userdata.email1];

    I.login({ user: alice });
    chat.openChat();
    // create a private chat
    chat.createPrivateChat(bob.userdata.email1);
    I.click('~Close chat', '.ox-chat');

    // create a group chat
    I.waitForText('New Chat', 30);
    I.click('New Chat');
    I.clickDropdown('Group chat');
    chat.fillNewGroupForm(groupTitle, emails);
    I.click(locate({ css: 'button' }).withText('Create chat'), '.ox-chat-popup');
    chat.sendMessage('Hey group!');
    I.click('~Close chat', '.ox-chat');

    // create a channel
    I.waitForText('New Chat', 30);
    I.click('New Chat');
    I.clickDropdown('Channel');
    chat.fillNewChannelForm(channelTitle);
    dialogs.clickButton('Create channel');
    chat.sendMessage('First message');
    I.click('~Close chat', '.ox-chat');

    I.waitForText(channelTitle, 3, 'li[aria-label="Chats"] > ul > li:nth-child(1)');
    I.waitForText(groupTitle, 3, 'li[aria-label="Chats"] > ul >  li:nth-child(2)');
    I.waitForText('User', 3, 'li[aria-label="Chats"] > ul > li:nth-child(3)');
    I.dontSee('Private chats', '.ox-chat .left-navigation');
    I.dontSee('Group chats', '.ox-chat .left-navigation');
    I.dontSee('Channels', '.ox-chat .left-navigation');

    // change settings
    I.click('~Settings');
    I.clickDropdown('Settings');
    I.waitForElement('.folder.virtual.open[data-model="virtual/settings/main"]');
    I.click({ css: 'li[data-id="virtual/settings/chat"]' });
    I.waitForText('View options', 3, '.scrollable-pane');
    I.click('Select last chat on start', '.scrollable-pane');

    I.click('Alphabetical', '.scrollable-pane');
    I.waitForText(groupTitle, 3, 'li[aria-label="Chats"] > ul > li:nth-child(1)');
    I.waitForText(channelTitle, 3, 'li[aria-label="Chats"] > ul > li:nth-child(2)');
    I.waitForText('User', 3, 'li[aria-label="Chats"] > ul > li:nth-child(3)');

    I.click('Last activity', '.scrollable-pane');
    I.waitForText(channelTitle, 3, 'li[aria-label="Chats"] > ul > li:nth-child(1)');
    I.waitForText(groupTitle, 3, 'li[aria-label="Chats"] > ul > li:nth-child(2)');
    I.waitForText('User', 3, 'li[aria-label="Chats"] > ul > li:nth-child(3)');

    I.click('Group chats by type', '.scrollable-pane');

    I.waitForText('Private chats', 30, '.ox-chat .left-navigation');
    I.waitForText('User', 3, '.ox-chat .left-navigation li[aria-label="Private chats"]');
    I.waitForText('Group chats', 3, '.ox-chat .left-navigation');
    I.waitForText(groupTitle, 3, '.ox-chat .left-navigation li[aria-label="Group chats"]');
    I.waitForText('Channels', 3, '.ox-chat .left-navigation');
    I.waitForText(channelTitle, 3, '.ox-chat .left-navigation li[aria-label="Channels"]');
});
