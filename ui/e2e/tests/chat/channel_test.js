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

Feature('Chat > Channels');

let context;

Before(async ({ users, contexts }) => {
    context = await contexts.create();
    await context.hasCapability('chat');

    await Promise.all([
        users.create(users.getRandom(), context),
        users.create(users.getRandom(), context)
    ]);
});

After(async ({ users }) => {
    await users.removeAll();
    await context.remove();
});

Scenario('Update channel profile picture and name', async ({ I, chat, dialogs, users }) => {
    const [alice, bob] = users;
    // Check initial photo: Empty | Initial name: Announcements
    await session('Alice', async () => {
        I.login({ user: alice });
        chat.openChat();
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
        chat.openChat();
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

    await context.remove();
});

Scenario('Cannot create or edit channel to have the same name', async ({ I, dialogs, chat }) => {
    const channelTitle = 'Only one';
    const alternativeTitle = 'Another one';

    I.login();
    chat.openChat();
    I.waitForText('New Chat', 30);
    I.click('New Chat');
    I.clickDropdown('Channel');

    chat.fillNewChannelForm(channelTitle);
    I.click(locate('button').withText('Create channel'), '.ox-chat-popup');

    I.waitForElement('.ox-chat .controls');
    I.waitForElement('~Close chat');
    I.click('~Close chat');

    I.waitForText('New Chat', 30);
    I.click('New Chat');
    I.clickDropdown('Channel');

    chat.fillNewChannelForm(channelTitle);
    I.click(locate('button').withText('Create channel'), '.ox-chat-popup');

    I.waitForText('A channel with the same name already exists', 5, '.io-ox-alert-error');
    I.fillField('Channel name', alternativeTitle);
    dialogs.clickButton('Create channel');
    I.waitForDetached('.modal-dialog');

    I.waitForElement('.ox-chat .controls');
    I.clickToolbar('~More actions');
    I.clickDropdown('Edit channel');

    dialogs.waitForVisible();
    I.fillField('Channel name', channelTitle);
    dialogs.clickButton('Save');

    I.waitForText('A channel with the same name already exists', 5, '.io-ox-alert-error');
});

Scenario('Preview, join and leave a channel', async ({ I, users, chat }) => {
    const [alice, bob] = users;
    const name = `${bob.get('given_name')} ${bob.get('sur_name')} `;

    const channelTitle = 'Channel ' + (+new Date());

    await session('Alice', async () => {
        I.login({ user: alice });
        chat.openChat();
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
        chat.openChat();
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
    });

    await session('Alice', async () => {
        I.waitForText(name + 'joined the conversation');
        I.seeNumberOfVisibleElements('.message.system', 3);
    });

    await session('Bob', async () => {
        I.seeNumberOfVisibleElements('.message.system', 3);
        I.click('~Close chat', '.ox-chat');
        I.dontSee('Join');
        I.click(locate('.title').withText(channelTitle), '.ox-chat .chat-list .chats-row');
        I.click('~More actions', '.ox-chat');
        I.waitForElement('.smart-dropdown-container.more-dropdown');
        I.click('Leave channel', '.smart-dropdown-container.more-dropdown');
    });

    await session('Alice', async () => {
        I.waitForText(name + 'left the conversation');
        I.seeNumberOfVisibleElements('.message.system', 4);
    });

    await session('Bob', async () => {
        I.click(locate({ css: 'button' }).withText('All channels'), '.ox-chat');
        I.waitForText('Join');
        I.click(locate('.title').withText(channelTitle), '.ox-chat');
        I.waitForText('Hello everyone!', 3, '.messages');
        I.waitForText('You left the conversation');
        I.waitForText('Join');
        I.seeNumberOfVisibleElements('.message.system', 4);
    });

    await context.remove();
});
