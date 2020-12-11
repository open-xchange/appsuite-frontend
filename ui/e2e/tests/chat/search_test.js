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
Feature('Chat > Search');

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

Scenario.skip('Search for a word - full text', async (I, users, chat) => {
    await users.create();

    const groupTitle = 'Test Group';
    const emails = [users[1].userdata.email1, users[2].userdata.email1];

    I.login({ user: users[0] });
    chat.openChat();
    chat.createPrivateChat(users[1].userdata.email1);
    chat.sendMessage('Berlin Bangkok Brisbane');

    I.click('~Close chat', '.ox-chat');

    I.click('New Chat');
    I.clickDropdown('Group chat');
    chat.fillNewGroupForm(groupTitle, emails);
    I.click(locate({ css: 'button' }).withText('Create chat'), '.ox-chat-popup');
    chat.sendMessage('Kairo Mumbai Berlin Lima');
    chat.sendMessage('Berlin');

    I.click('~Close chat', '.ox-chat');

    I.waitForElement('~Search or start new chat', 3, '.ox-chat');
    I.fillField('~Search or start new chat', 'Berlin');

    // find in 2xprivate and group
});

Scenario('Search for a user and a private chat', async (I, users, chat) => {
    I.login({ user: users[0] });
    chat.openChat();
    I.waitForText('New Chat', 30);

    I.waitForElement('~Search or start new chat', 3, '.ox-chat');
    I.fillField('~Search or start new chat', users[1].userdata.given_name);
    I.waitForElement(`.search-result li[data-email="${users[1].userdata.email1}"]`, 3, '.ox-chat');
    I.click(`.search-result li[data-email="${users[1].userdata.email1}"]`, '.ox-chat');
    I.waitForElement('.ox-chat .controls');
    chat.sendMessage('Hey!');

    I.click('~Close chat', '.ox-chat');
    I.waitForElement('~Search or start new chat', 3, '.ox-chat');
    I.fillField('~Search or start new chat', users[1].userdata.sur_name);

    I.waitForElement(`.search-result li[data-email="${users[1].userdata.email1}"]`, 10, '.ox-chat');
    I.click(`.search-result li[data-email="${users[1].userdata.email1}"]`, '.ox-chat');
    I.waitForText('Hey!', 3, '.ox-chat .messages');
});

Scenario('Search for a group name', async (I, users, chat) => {
    await users.create();

    const groupTitle = 'Test Group';
    const emails = [users[1].userdata.email1, users[2].userdata.email1];

    I.login({ user: users[0] });
    chat.openChat();
    I.waitForText('New Chat', 30);

    I.click('New Chat');
    I.clickDropdown('Group chat');
    chat.fillNewGroupForm(groupTitle, emails);
    I.click(locate({ css: 'button' }).withText('Create chat'), '.ox-chat-popup');
    I.waitForElement('~Close chat', 3, '.ox-chat');
    I.click('~Close chat', '.ox-chat');


    I.waitForElement('~Search or start new chat', 3, '.ox-chat');
    I.fillField('~Search or start new chat', groupTitle);
    I.waitForElement(locate('.title').withText(groupTitle), 3, '.ox-chat .search-result');
    I.retry(3).click(locate('.title').withText(groupTitle), '.ox-chat .search-result');
    I.waitForElement('.message.system', 3, '.ox-chat');
    I.seeNumberOfVisibleElements('.message.system', 2);
});

Scenario('Search for a channel name', async (I, users, contexts, chat, dialogs) => {
    const context = await contexts.create();
    context.hasCapability('chat');
    const alice = await users.create(users.getRandom(), context);
    const bob = await users.create(users.getRandom(), context);

    const channelTitle = 'Channel 1.0';
    const channelTitle2 = 'Channel 2.0';

    await session('Alice', async () => {
        I.login({ user: alice });
        chat.openChat();
        I.waitForText('New Chat', 30);
        I.click('New Chat');
        I.clickDropdown('Channel');
        chat.fillNewChannelForm(channelTitle);
        dialogs.clickButton('Create channel');
        I.waitForElement('.ox-chat .controls');
        chat.sendMessage('Berlin Lima');
        I.waitForElement('~Close chat', 3, '.ox-chat');
        I.click('~Close chat', '.ox-chat');

        I.waitForText('New Chat', 30);
        I.click('New Chat');
        I.clickDropdown('Channel');
        chat.fillNewChannelForm(channelTitle2);
        dialogs.clickButton('Create channel');
        I.waitForElement('.ox-chat .controls');
        chat.sendMessage('Berlin Lima');
        I.waitForElement('~Close chat', 3, '.ox-chat');
        I.click('~Close chat', '.ox-chat');

        I.waitForElement('~Search or start new chat', 3, '.ox-chat');
        I.fillField('~Search or start new chat', 'Channel');
        I.waitForElement(locate('.title').withText(channelTitle), 3, '.ox-chat .search-result');
        I.waitForElement(locate('.title').withText(channelTitle2), 3, '.ox-chat .search-result');
        I.fillField('~Search or start new chat', channelTitle);
        I.waitForInvisible(locate('.title').withText(channelTitle2), 3, '.ox-chat .search-result');
        I.retry(5).click(locate('.title').withText(channelTitle), '.ox-chat .search-result');
        I.waitForElement('.message.system', 3, '.ox-chat');
        I.seeNumberOfVisibleElements('.message.system', 2);
    });

    await session('Bob', async () => {
        I.login({ user: bob });
        chat.openChat();
        I.waitForText('New Chat', 30);
        I.waitForElement('~Search or start new chat', 3, '.ox-chat');
        I.fillField('~Search or start new chat', channelTitle);
        I.waitForText('No search results', 5, '.ox-chat .search-result');
    });

    await context.remove();
});
