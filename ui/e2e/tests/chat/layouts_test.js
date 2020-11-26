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

Feature('Chat layout');

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

Scenario('Add chat to favorites', async (I, users, chat) => {
    await session('Alice', async () => {
        I.login({ user: users[0] });
        chat.createPrivateChat(users[1].userdata.email1);

        // sticky layout
        I.click('~More actions', '.ox-chat');
        I.waitForElement('.smart-dropdown-container.more-dropdown');
        I.click('Add to favorites', '.smart-dropdown-container.more-dropdown');
        I.click('~Close chat', '.ox-chat');
        I.see('Favorites', '.ox-chat .left-navigation');
        I.click(locate('.ox-chat li').withText('User'));
        I.click('~More actions', '.ox-chat');
        I.waitForElement('.smart-dropdown-container.more-dropdown');
        I.click('Remove from favorites', '.smart-dropdown-container.more-dropdown');
        I.click('~Close chat', '.ox-chat');
        I.dontSee('Favorites', '.ox-chat .left-navigation');

        // floating layout
        I.click('~Detach window', '.ox-chat .chat-leftside');
        I.dontSee('Favorites', '.ox-chat .left-navigation');
        I.click(locate('.ox-chat li').withText('User'));
        I.click('.ox-chat button[title="More actions"]');
        I.waitForElement('.chat-rightside .dropdown.open', 3, '.ox-chat');
        I.click('Add to favorites', '.chat-rightside .dropdown.open');
        I.waitForText('Favorites', 3, '.ox-chat .left-navigation');
        I.waitForElement('.ox-chat .left-navigation ul[aria-label="Favorites"] li');
    });
});
