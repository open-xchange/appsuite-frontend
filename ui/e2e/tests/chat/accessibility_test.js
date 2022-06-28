/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

/// <reference path="../../steps.d.ts" />

const { expect } = require('chai');

Feature('Chat > Accessibility');

let context;

Before(async (users, contexts) => {
    context = await contexts.create();
    await context.hasCapability('chat');

    await Promise.all([
        users.create(users.getRandom(), context),
        users.create(users.getRandom(), context),
        users.create(users.getRandom(), context)
    ]);
});

After(async (users) => {
    await users.removeAll();
    await context.remove();
});

Scenario.skip('Check accessibility of the chat in sticky mode', async (I, contexts, users, chat, dialogs) => {
    const [alice, bob, charlie] = users;
    const groupTitle = 'Test Group';
    const channelTitle = 'Test Channel';
    const emails = [bob.userdata.email1, charlie.userdata.email1];

    await session('Alice', async () => {
        I.login({ user: alice });
        expect(await I.grabAxeReport()).to.be.accessible;

        // create a private chat
        chat.createPrivateChat(bob.userdata.email1);
        chat.sendMessage('First message');
        chat.sendFile('media/files/0kb/document.doc');
        expect(await I.grabAxeReport()).to.be.accessible;
        I.click('~Close chat', '.ox-chat');

        // create a group chat
        I.waitForText('New Chat', 30);
        I.click('New Chat');
        I.clickDropdown('Group chat');
        chat.fillNewGroupForm(groupTitle, emails);
        expect(await I.grabAxeReport()).to.be.accessible;
        I.click(locate({ css: 'button' }).withText('Create chat'), '.ox-chat-popup');
        chat.sendMessage('Second message');
        expect(await I.grabAxeReport()).to.be.accessible;
        I.click('~Close chat', '.ox-chat');

        // create a channel
        I.waitForText('New Chat', 30);
        I.click('New Chat');
        I.clickDropdown('Channel');
        chat.fillNewChannelForm(channelTitle);
        expect(await I.grabAxeReport()).to.be.accessible;
        dialogs.clickButton('Create channel');
        chat.sendMessage('Third message');
        expect(await I.grabAxeReport()).to.be.accessible;
        I.click('~Close chat', '.ox-chat');

        // all channels
        I.waitForElement(locate('button').withText('All channels'), 30, '.ox-chat');
        I.click(locate({ css: 'button' }).withText('All channels'), '.ox-chat');
        I.waitForText(channelTitle, 3, '.ox-chat');
        expect(await I.grabAxeReport()).to.be.accessible;
        I.click('~Close chat', '.ox-chat');

        // all files
        I.click('.chat-leftside button[data-cmd="show-all-files"]');
        I.waitForElement('.ox-chat .chat-rightside .scrollpane');
        expect(await I.grabAxeReport()).to.be.accessible;
        I.click('~Close chat', '.ox-chat');

        // history
        I.click(locate({ css: 'button' }).withText('History'), '.ox-chat');
        I.waitForText('User', 3, '.ox-chat');
        expect(await I.grabAxeReport()).to.be.accessible;
    });

    await context.remove();
});

Scenario.skip('Check accessibility of the chat in floating mode', async (I, contexts, users, chat, dialogs) => {
    const [alice, bob, charlie] = users;
    const groupTitle = 'Test Group';
    const channelTitle = 'Test Channel';
    const emails = [bob.userdata.email1, charlie.userdata.email1];

    await session('Alice', async () => {
        I.login({ user: alice });
        I.waitForElement('.io-ox-windowmanager-sticky-panel .ox-chat');
        I.click('~Detach window');
        expect(await I.grabAxeReport()).to.be.accessible;

        // create a private chat
        I.click('~New', '.ox-chat');
        I.waitForElement('.ox-chat .btn-round .dropdown-menu');
        I.click('Private chat', '.ox-chat .btn-round .dropdown-menu');
        I.waitForText(bob.userdata.email1);
        I.click(locate('.address-picker li').withText(bob.userdata.email1));
        I.click('Start conversation');
        I.waitForElement('.ox-chat .controls');
        chat.sendMessage('First message');
        chat.sendFile('media/files/0kb/document.doc');
        expect(await I.grabAxeReport()).to.be.accessible;

        // create a group chat
        I.click('~New', '.ox-chat');
        I.waitForElement('.ox-chat .btn-round .dropdown-menu');
        I.click('Group chat', '.ox-chat .btn-round .dropdown-menu');
        chat.fillNewGroupForm(groupTitle, emails);
        expect(await I.grabAxeReport()).to.be.accessible;
        dialogs.clickButton('Create chat');
        chat.sendMessage('Second message');
        expect(await I.grabAxeReport()).to.be.accessible;

        // create a channel
        I.click('~New', '.ox-chat .chat-leftside');
        I.clickDropdown('Channel');
        chat.fillNewChannelForm(channelTitle);
        expect(await I.grabAxeReport()).to.be.accessible;
        dialogs.clickButton('Create channel');
        I.wait(0.5);
        I.waitForElement('.ox-chat .controls');
        chat.sendMessage('Third message');
        expect(await I.grabAxeReport()).to.be.accessible;

        // all channels
        I.waitForElement('.chat-leftside button[data-cmd="show-channels"]', 3, '.ox-chat');
        I.click('.chat-leftside button[data-cmd="show-channels"]', '.ox-chat');
        I.waitForText(channelTitle, 3, '.ox-chat');
        expect(await I.grabAxeReport()).to.be.accessible;

        // all files
        I.click('.chat-leftside button[data-cmd="show-all-files"]', '.ox-chat');
        I.waitForElement('.ox-chat .chat-rightside .scrollpane');
        expect(await I.grabAxeReport()).to.be.accessible;

        // history
        I.click('.chat-leftside button[data-cmd="show-history"]', '.ox-chat');
        I.waitForText('User', 3, '.ox-chat');
        expect(await I.grabAxeReport()).to.be.accessible;
    });

    await context.remove();
});
