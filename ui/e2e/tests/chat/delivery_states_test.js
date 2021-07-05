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

Feature('Chat > Delivery states');

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

Scenario('Update delivery states in private chats', async ({ I, users, chat }) => {
    await session('Alice', async () => {
        I.login({ user: users[0] });
        chat.openChat();
        chat.createPrivateChat(users[1].userdata.email1);
        chat.sendMessage('Hi');
        I.waitForElement('.delivery.server');
        I.waitForDetached('.delivery.server');
        I.waitForElement('.delivery.received');
    });

    await session('Bob', async () => {
        I.login({ user: users[1] });
        chat.openChat();
        I.waitForText('New Chat', 30);
    });

    await session('Alice', async () => {
        chat.sendMessage('Whats up?');
        await within('.ox-chat .messages', async () => {
            I.dontSee('.delivery.server');
            I.waitForElement('.delivery.received');
        });
    });

    await session('Bob', async () => {
        I.waitForText('User', 30, '.ox-chat');
        I.click(locate('.ox-chat li').withText('User'));
        I.waitForText('Hello.', 3, '.messages');
    });

    await session('Alice', async () => {
        I.waitForDetached('.delivery.received');
        I.waitForElement('.delivery.seen');
    });
});

Scenario('Update delivery states in groups', async ({ I, users, chat }) => {
    await users.create();
    const groupTitle = 'Test Group';
    const emails = [users[1].userdata.email1, users[2].userdata.email1];

    await session('Alice', async () => {
        I.login({ user: users[0] });
        chat.openChat();
        I.waitForText('New Chat', 30);
        I.click('New Chat');
        I.clickDropdown('Group chat');
        chat.fillNewGroupForm(groupTitle, emails);
        I.click(locate({ css: 'button' }).withText('Create chat'), '.ox-chat-popup');
        I.waitForDetached('.modal-dialog');
        chat.sendMessage('Hey group!');

        I.waitForElement('.delivery.server');
        I.waitForDetached('.delivery.server');
    });

    await session('Bob', async () => {
        I.login({ user: users[1] });
        chat.openChat();
        I.waitForText('New Chat', 30);
    });

    await session('Alice', async () => {
        chat.sendMessage('Whats up?');
        await within('.ox-chat .messages', async () => {
            I.waitForElement('.delivery.server');
            I.waitForDetached('.delivery.server');
        });
    });

    await session('Charlie', async () => {
        I.login({ user: users[2] });
        chat.openChat();
        I.waitForText('New Chat', 30);
    });

    await session('Bob', async () => {
        I.waitForText(groupTitle, 30, '.ox-chat');
        I.click(locate('.ox-chat li').withText(groupTitle));
        I.waitForText('Hey group!', 3, '.messages');
    });

    await session('Alice', async () => {
        I.waitForElement('.delivery.received');
        I.wait(0.5);
        I.dontSee('.delivery.seen');
    });

    await session('Charlie', async () => {
        I.waitForText(groupTitle, 30, '.ox-chat');
        I.click(locate('.ox-chat li').withText(groupTitle));
        I.waitForText('Hey group!', 3, '.messages');
    });

    await session('Alice', async () => {
        I.waitForDetached('.delivery.received');
        I.waitForElement('.delivery.seen');
    });
});

Scenario('There are no delivery states for channels', async ({ I, users, contexts, chat, dialogs }) => {
    const context = await contexts.create();
    context.hasCapability('chat');
    const alice = await users.create(users.getRandom(), context);

    I.login({ user: alice });
    chat.openChat();
    I.waitForText('New Chat', 30);
    I.click('New Chat');
    I.clickDropdown('Channel');

    chat.fillNewChannelForm('Channel ' + (+new Date()));
    dialogs.clickButton('Create channel');
    I.waitForDetached('.modal-dialog');

    I.waitForElement('.ox-chat .controls');
    I.fillField('Message', 'Hello everyone!');
    I.pressKey('Enter');

    I.waitForElement('.message.myself', 3, '.ox-chat .messages');
    I.dontSeeElement('.delivery', '.ox-chat');
});
