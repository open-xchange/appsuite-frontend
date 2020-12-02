/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2020 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Tran Dong Tran <tran-dong.tran@open-xchange.com>
 */
/// <reference path="../../steps.d.ts" />

Feature('Chat - Channels');

After(async (users) => {
    await Promise.all([
        users.removeAll()
    ]);
});

Scenario('Update channel profile picture and name', async (I, dialogs, users, contexts) => {
    const context = await contexts.create();
    context.hasCapability('chat');
    const alice = await users.create(users.getRandom(), context);
    const bob = await users.create(users.getRandom(), context);

    // Check initial photo: Empty | Initial name: Announcements
    await session('Alice', async () => {
        I.login({ user: alice });
        I.waitForText('New Chat', 30);
        I.click('New Chat');
        I.clickDropdown('Channel');

        dialogs.waitForVisible();
        I.fillField('name', 'Announcements');
        dialogs.clickButton('Create channel');
        I.waitForDetached('.modal-dialog');
        I.click('~Detach window', '.chat-rightside');

        I.waitForText('Announcements', 5, '.chat-rightside .header');
        I.waitForText('Announcements', 5, '.chat-leftside .left-navigation');
        I.waitNumberOfVisibleElements('.message.system', 1);
        I.waitForFunction(async () => $('.chat-rightside .group.avatar.image').css('background-image') === 'none', 10);
    });

    await session('Bob', async () => {
        I.login({ user: bob });
        I.waitForText('All channels', 30, '.ox-chat');
        I.click('All channels', '.ox-chat');
        I.waitForText('Announcements', 30, '.ox-chat');
        I.waitForVisible(locate('button').withText('Join'), '.ox-chat .channel-list');
        I.click(locate('button').withText('Join'), '.ox-chat .channel-list');
        I.click('~Detach window', '.chat-rightside');

        I.waitForText('Announcements', 5, '.chat-rightside .header');
        I.waitForText('Announcements', 5, '.chat-leftside .left-navigation');
        I.waitNumberOfVisibleElements('.message.system', 2);
        I.waitForFunction(async () => $('.chat-rightside .group.avatar.image').css('background-image') === 'none', 10);
    });

    // Check photo after upload | Edited name: Marienkaeferchen
    await session('Alice', async () => {
        I.click(locate({ css: "[title='More actions']" }), '.floating-window');
        I.clickDropdown('Edit channel');

        dialogs.waitForVisible();
        I.fillField('.ox-chat-popup input[name="title"]', 'Christmas announcements');
        I.click('.contact-photo.empty', dialogs.locators.header);
        I.waitForElement('.contact-photo-upload form input[type="file"][name="file"]', '.edit-picture');
        I.attachFile('.contact-photo-upload form input[type="file"][name="file"]', 'e2e/media/placeholder/800x600.png');
        dialogs.clickButton('Apply');
        I.waitForDetached('.edit-picture');
        dialogs.clickButton('Save');
        I.waitForDetached('.modal-dialog');

        I.waitForText('Christmas announcements', 5, '.chat-rightside .header');
        I.waitForText('Christmas announcements', 5, '.chat-leftside .left-navigation');
        I.waitNumberOfVisibleElements('.message.system', 4);
        I.waitForFunction(async () => $('.chat-rightside .group.avatar.image').css('background-image') !== 'none', 10);
    });

    await session('Bob', async () => {
        I.waitForText('Christmas announcements', 5, '.chat-rightside .header');
        I.waitForText('Christmas announcements', 5, '.chat-leftside .left-navigation');
        I.waitNumberOfVisibleElements('.message.system', 4);
        I.waitForFunction(async () => $('.chat-rightside .group.avatar.image').css('background-image') !== 'none', 10);
    });

    // Check photo after removing photo | Edited name: try empty -> error, restore old one
    await session('Alice', async () => {
        I.click(locate({ css: "[title='More actions']" }), '.floating-window');
        I.clickDropdown('Edit channel');

        // remove photo
        dialogs.waitForVisible();
        I.waitForVisible('.contact-photo-upload .contact-photo');
        I.click('.contact-photo', dialogs.locators.header);
        dialogs.clickButton('Remove photo');
        dialogs.clickButton('Apply');
        I.waitForDetached('.edit-picture');

        // try empty name
        I.fillField('.ox-chat-popup input[name="title"]', '');
        dialogs.clickButton('Save');
        I.waitForVisible('.io-ox-alert-error');
        I.click('.btn.close', '.io-ox-alert-error');
        I.waitForDetached('.io-ox-alert-error');

        // restore
        I.fillField('.ox-chat-popup input[name="title"]', 'Christmas announcements');
        dialogs.clickButton('Save');
        I.waitForDetached('.modal-dialog');

        I.waitNumberOfVisibleElements('.message.system', 5);
        I.waitForFunction(async () => $('.chat-rightside .group.avatar.image').css('background-image') === 'none', 10);
    });

    await session('Bob', async () => {
        I.waitForText('Christmas announcements', 5, '.chat-rightside .header');
        I.waitForText('Christmas announcements', 5, '.chat-leftside .left-navigation');
        I.waitNumberOfVisibleElements('.message.system', 5);
        I.waitForFunction(async () => $('.chat-rightside .group.avatar.image').css('background-image') === 'none', 10);
    });

    context.remove();
});

Scenario('Preview, join and leave a channel', async (I, users, contexts, chat) => {
    const context = await contexts.create();
    context.hasCapability('chat');
    const alice = await users.create(users.getRandom(), context);
    const bob = await users.create(users.getRandom(), context);

    const channelTitle = 'Channel 1.0';

    await session('Alice', async () => {
        I.login({ user: alice });
        I.waitForText('New Chat', 30);
        I.click('New Chat');
        I.clickDropdown('Channel');

        chat.fillNewChannelForm(channelTitle);
        I.click(locate('button').withText('Create channel'), '.ox-chat-popup');

        I.waitForElement('.ox-chat .controls');
        I.fillField('Message', 'Hello everyone!');
        I.pressKey('Enter');
    });

    await session('Bob', async () => {
        I.login({ user: bob });
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
        I.seeNumberOfVisibleElements('.message.system', 3);
        I.click('~Close chat', '.ox-chat');
        I.dontSee('Join');
        I.click(locate('.title').withText(channelTitle), '.ox-chat .chat-list .chats-row');
        I.click('~More actions', '.ox-chat');
        I.waitForElement('.smart-dropdown-container.more-dropdown');
        I.click('Leave channel', '.smart-dropdown-container.more-dropdown');
        I.click(locate({ css: 'button' }).withText('All channels'), '.ox-chat');
        I.waitForText('Join');
        I.click(locate('.title').withText(channelTitle), '.ox-chat');
        I.waitForText('Hello everyone!', 3, '.messages');
        I.waitForText('You left the conversation');
        I.waitForText('Join');
        I.seeNumberOfVisibleElements('.message.system', 4);
    });

    context.remove();
});
