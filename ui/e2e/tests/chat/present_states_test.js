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

Feature('Chat > Presence states');

Before(async ({ users }) => {
    await Promise.all([
        users.create(),
        users.create(),
        users.create()
    ]);
    await users[0].context.hasCapability('chat');
    await users[0].context.hasCapability('switchboard');
    await users[1].context.hasCapability('switchboard');
});

After(async ({ users }) => {
    await users[0].context.doesntHaveCapability('chat');
    await users[0].context.doesntHaveCapability('switchboard');
    await users[1].context.doesntHaveCapability('switchboard');
    await users.removeAll();
});

Scenario('Can change my presence state which will be updated', async ({ I, users, dialogs, chat }) => {
    const groupTitle = 'Test Group';
    const emails = [users[1].userdata.email1, users[2].userdata.email1];
    const chatLocator = chat => locate('.ox-chat li[data-cmd="show-chat"]').withText(chat);
    async function changePresenceOfAlice(newState, className) {
        className = className || newState.toLowerCase();
        I.click('~My account');
        I.waitForElement('.smart-dropdown-container.dropdown.open');
        I.click(newState, '.smart-dropdown-container.dropdown.open');
        I.waitForElement('#io-ox-appcontrol .presence.' + className);
    }

    await session('Alice', async () => {
        I.login({ user: users[0] });
        chat.openChat();

        // create chats
        I.waitForText('New Chat');
        I.click('New Chat');
        I.clickDropdown('Group chat');
        chat.fillNewGroupForm(groupTitle, emails);
        dialogs.clickButton('Create chat');
        I.waitForDetached('.modal-dialog');
        chat.sendMessage('Hey group!');
        I.click('~Close chat', '.ox-chat');
        I.waitForText('New Chat');
        chat.createPrivateChat(users[1].userdata.email1);

        // see own state online
        I.waitForElement('#io-ox-appcontrol .presence.online');
    });

    await session('Bob', async () => {
        I.login({ user: users[1] });
        chat.openChat();
        // sticky mode - list
        I.waitForElement('.chat-leftside .chat-list .presence.online');
    });

    await session('Alice', async () => {
        changePresenceOfAlice('Invisible', 'offline');
    });

    await session('Bob', async () => {
        I.waitForDetached('.chat-leftside .chat-list .presence.online');
        I.click('~Detach window', '.ox-chat .chat-leftside');
    });

    await session('Alice', async () => {
        changePresenceOfAlice('Busy');
    });

    await session('Bob', async () => {
        // floating mode - list
        I.waitForElement('.chat-leftside .chat-list .presence.busy');
        I.click(chatLocator('User'));
        // floating mode - private chat (avatar in topbar)
        I.waitForElement('.chat-rightside .presence.busy');
    });

    await session('Alice', async () => {
        changePresenceOfAlice('Absent');
    });

    await session('Bob', async () => {
        // floating mode - list and private chat (avatar in topbar)
        I.waitForDetached('.chat-leftside .chat-list .presence.busy');
        I.waitForDetached('.chat-rightside .presence.busy');
        I.waitForElement('.chat-leftside .chat-list .presence.absent');
        I.waitForElement('.chat-rightside .presence.absent');

        // floating mode - group chat (badge in topbar)
        I.click(chatLocator('Test Group'));
        I.waitForElement('.chat-rightside .presence.absent');
    });

    await session('Alice', async () => {
        changePresenceOfAlice('Online');
    });

    await session('Bob', async () => {
        // floating mode - list and group chat (badge in topbar)
        I.waitForDetached('.chat-leftside .chat-list .presence.absent');
        I.waitForDetached('.chat-rightside .presence.absent');
        I.waitForElement('.chat-leftside .chat-list .presence.online');
        I.waitForElement('.chat-rightside .presence.online');

        // edit dialog (participants)
        I.click(locate({ css: "[title='More actions']" }), '.floating-window');
        I.clickDropdown('Edit chat');
        I.waitForElement('.modal-dialog .presence.online');
    });

    await session('Alice', async () => {
        changePresenceOfAlice('Busy');
    });

    await session('Bob', async () => {
        const memberLocator = locate('.members li').withAttr({ 'data-id': users[0].userdata.email1 });
        I.waitForDetached(locate('.presence-online').inside(memberLocator));
        I.waitForElement(locate('.presence.busy').inside(memberLocator));
    });
});
