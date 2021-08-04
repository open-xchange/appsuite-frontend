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

Feature('Chat > SMTP');

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

Scenario('Receive email notifications from private chats', async ({ I, users, chat }) => {
    await session('Alice', async () => {
        I.login({ user: users[0] });
        chat.openChat();
        chat.createPrivateChat(users[1].userdata.email1);
        chat.sendMessage('First message');
        chat.sendMessage('Second message');
    });

    // wait for smtp delay to collect messages and send an email notification
    I.wait(2.5);

    await session('Bob', async () => {
        I.login({ user: users[1] });
        I.waitForElement('.list-item', 30, '~Messages');
        I.click('.list-item', '~Messages');
        I.waitForText('First message');
        I.waitForText('Second message');
    });

    await session('Alice', async () => {
        chat.sendMessage('Another message');
    });

    // wait for smtp delay to collect messages and send an email notification
    I.wait(2.5);

    await session('Bob', async () => {
        I.seeNumberOfVisibleElements('.mail-item .list-item.selectable', 1);
    });
});

Scenario('Receive email notifications from groups', async ({ I, users, chat }) => {
    await session('Alice', async () => {
        I.login({ user: users[0] });
        chat.openChat();

        // create a group chat
        I.waitForText('New Chat', 30);
        I.click('New Chat');
        I.clickDropdown('Group chat');
        chat.fillNewGroupForm('Test group', [users[1].userdata.email1]);
        I.click(locate({ css: 'button' }).withText('Create chat'), '.ox-chat-popup');
        I.waitForDetached('.modal-dialog');
        chat.sendMessage('First message');
        I.click('~Close chat', '.ox-chat');

        // create private chat
        chat.createPrivateChat(users[1].userdata.email1);
        chat.sendMessage('Second message');
    });

    // wait for smtp delay to collect messages and send an email notification
    I.wait(2.5);

    await session('Bob', async () => {
        I.login({ user: users[1] });
        I.waitForElement('.list-item', 30, '~Messages');
        I.seeNumberOfVisibleElements('.mail-item .list-item.selectable', 2);
    });
});

// unskip when CAS-330 is resolved
Scenario.skip('Do not receive email notifications from a private chat', async ({ I, users, chat }) => {
    await session('Bob', async () => {
        I.login({ user: users[1] });
        I.click('~Settings');
        I.clickDropdown('Settings');
        I.click({ css: 'li[data-id="virtual/settings/io.ox/chat"]' });
        I.waitForElement('#settings-emailNotification');
        I.selectOption('#settings-emailNotification', 'Do not send any email notifications');
        I.logout();
    });

    await session('Alice', async () => {
        I.login({ user: users[0] });
        chat.openChat();

        // create private chat
        chat.createPrivateChat(users[1].userdata.email1);
        chat.sendMessage('First message');
    });

    // wait for smtp delay to collect messages and send an email notification
    I.wait(2.5);

    await session('Bob', async () => {
        I.login({ user: users[1] });
        I.waitForElement('.mail-item', 30);
        I.seeNumberOfVisibleElements('.mail-item .list-item.selectable', 0);
    });
});

Scenario.skip('Do only receive email notifications from private chats', async ({ I, users, chat }) => {
    I.login({ user: users[1] });
    I.click('~Settings');
    I.clickDropdown('Settings');
    I.waitForElement('.folder.virtual.open[data-model="virtual/settings/main"]');
    I.click({ css: 'li[data-id="virtual/settings/io.ox/chat"]' });
    I.waitForElement('#settings-emailNotification');
    I.selectOption('#settings-emailNotification', 'Send email notifications for my private chats');
    I.waitForNetworkTraffic();
    I.logout();

    I.login({ user: users[0] });
    chat.openChat();
    // create a group chat
    I.waitForText('New Chat', 30);
    I.click('New Chat');
    I.clickDropdown('Group chat');
    chat.fillNewGroupForm('Test group', [users[1].userdata.email1]);
    I.click(locate({ css: 'button' }).withText('Create chat'), '.ox-chat-popup');
    I.waitForDetached('.modal-dialog');
    chat.sendMessage('First message');
    I.click('~Close chat', '.ox-chat');
    // create private chat
    chat.createPrivateChat(users[1].userdata.email1);
    chat.sendMessage('Second message');
    I.logout();

    // wait for smtp delay to collect messages and send an email notification
    I.wait(2.5);

    I.login({ user: users[1] });
    I.waitForElement('.list-item', 30, '~Messages');
    I.seeNumberOfVisibleElements('.mail-item .list-item.selectable', 1);
});

Scenario.skip('Receive email notifications from channels', async ({ I, users, contexts, chat, dialogs }) => {
    const context = await contexts.create();
    context.hasCapability('chat');
    const alice = await users.create(users.getRandom(), context);
    const bob = await users.create(users.getRandom(), context);

    const channelTitle = 'Test Channel';

    await session('Alice', async () => {
        I.login({ user: alice });
        chat.openChat();

        // create a channel
        I.waitForText('New Chat', 30);
        I.click('New Chat');
        I.clickDropdown('Channel');
        chat.fillNewChannelForm(channelTitle);
        dialogs.clickButton('Create channel');
        I.waitForDetached('.modal-dialog');
        chat.sendMessage('Hello everyone!');
    });

    await session('Bob', async () => {
        I.login({ user: bob });
        chat.openChat();

        // join channel
        I.waitForElement(locate('button').withText('All channels'), 30, '.ox-chat');
        I.click(locate({ css: 'button' }).withText('All channels'), '.ox-chat');
        I.waitForText(channelTitle, 3, '.ox-chat');
        I.click(locate('.title').withText(channelTitle), '.ox-chat');
        I.waitForText('Hello everyone!', 3, '.messages');
        I.seeNumberOfVisibleElements('.message.system', 2);
        I.waitForElement(locate({ css: 'button' }).withText('Join'), '.ox-chat .controls');
        I.click(locate({ css: 'button' }).withText('Join'), '.ox-chat .controls');
        I.waitForElement('.ox-chat .controls');
        I.waitForText('You joined the conversation', 3);

        I.logout();
    });

    await session('Alice', async () => {
        chat.sendMessage('First message');
    });

    // wait for smtp delay to collect messages and send an email notification
    I.wait(2.5);

    await session('Bob', async () => {
        I.login({ user: bob });
        I.waitForElement('.list-item', 30, '~Messages');
        I.click('.list-item', '~Messages');
        I.waitForText('First message');
    });
});

Scenario.skip('Answering a notification will inject text to a chat', async ({ I, users, chat, mail }) => {
    await session('Alice', async () => {
        I.login({ user: users[0] });
        chat.openChat();
        chat.createPrivateChat(users[1].userdata.email1);
        chat.sendMessage('First message');
    });

    // wait for smtp delay to collect messages and send an email notification
    I.wait(2.5);

    await session('Bob', async () => {
        I.login({ user: users[1] });
        I.waitForElement('.list-item', 30, '~Messages');
        I.click('.list-item', '~Messages');
        I.waitForText('First message');
        I.click({ css: 'a[data-action="io.ox/mail/actions/reply"]' });
        I.waitForElement('.io-ox-mail-compose-window .editor iframe');
        await within({ frame: '.io-ox-mail-compose-window .editor iframe' }, async () => {
            I.waitForText('User', 3, 'body');
            I.fillField('body', 'Hallo');
            I.pressKey('Enter');
        });
        mail.send();
    });

    // await session('Alice', async () => {
    // check for received message
    // });
});
