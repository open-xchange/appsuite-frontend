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

Feature('Chat - Group chats');

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

Scenario('Leave and view a group and get re-added', async (I, users, chat, dialogs) => {
    await users.create();

    const groupTitle = 'Test Group';
    const emails = [users[1].userdata.email1, users[2].userdata.email1];

    await session('Alice', async () => {
        I.login({ user: users[0] });
        I.waitForText('New Chat', 30);
        I.click('New Chat');
        I.clickDropdown('Group chat');

        chat.fillNewGroupForm(groupTitle, emails);
        dialogs.clickButton('Create chat');

        chat.sendMessage('Hey group!');
    });

    await session('Bob', async () => {
        I.login({ user: users[1] });
        I.waitForText(groupTitle, 30, '.ox-chat');
        I.click(locate('.ox-chat li').withText(groupTitle));
        I.waitForText('Hey group!', 3, '.messages');

        I.click('~More actions', '.ox-chat');
        I.waitForElement('.smart-dropdown-container.more-dropdown');
        I.click('Leave chat', '.smart-dropdown-container.more-dropdown');

        I.waitForElement('.modal-dialog');
        dialogs.clickButton('Leave');
        I.waitForDetached('.modal-dialog');
    });

    await session('Alice', async () => {
        I.fillField('~Message', 'You cannot read this.');
        I.pressKey('Enter');
    });

    await session('Bob', async () => {
        I.waitForDetached('.ox-chat .controls textarea');
        I.dontSee('You cannot read this.');
    });

    await session('Alice', async () => {
        I.click('~More actions', '.ox-chat');
        I.waitForElement('.smart-dropdown-container.more-dropdown');
        I.click('Edit chat', '.smart-dropdown-container.more-dropdown');

        I.waitForElement('.modal-dialog');
        I.click('~Select contacts', '.ox-chat-popup');

        I.waitForElement('.modal-dialog .search-field', 3, '.addressbook-popup');
        I.waitForNetworkTraffic();
        I.fillField('.addressbook-popup .modal-dialog .search-field', users[1].userdata.email1);
        I.waitForElement(locate('.addressbook-popup .modal-dialog div.email').withText(users[1].userdata.email1));
        I.click(locate('.addressbook-popup .modal-dialog div.email').withText(users[1].userdata.email1));
        I.waitForNetworkTraffic();
        I.click(locate('.addressbook-popup button').withText('Select'));
        I.waitForText(users[1].userdata.email1);
        dialogs.clickButton('Save');

        I.waitForElement('.ox-chat .controls');
        // wait for focus events to settle
        I.wait(0.5);
        I.fillField('Message', 'But you can read this!');
        I.pressKey('Enter');
    });

    await session('Bob', async () => {
        I.waitForElement('.ox-chat .controls textarea');
        I.waitForText('But you can read this!');
        I.dontSee('You cannot read this.');
    });
});

Scenario.skip('Update group profile picture and name', async (I, dialogs, users, chat) => {
    await users.create();

    const groupTitle = 'Test Group';
    const emails = [users[1].userdata.email1, users[2].userdata.email1];

    // Check initial photo: Empty | Initial name: Test Group
    await session('Alice', async () => {
        I.login({ user: users[0] });
        I.waitForText('New Chat', 30);
        I.click('New Chat');
        I.clickDropdown('Group chat');

        chat.fillNewGroupForm(groupTitle, emails);
        dialogs.clickButton('Create chat');
        I.waitForDetached('.modal-dialog');
        I.click('~Detach window', '.chat-rightside');

        I.waitForText(groupTitle, 5, '.chat-rightside .header');
        I.waitForText(groupTitle, 5, '.chat-leftside .left-navigation');
        I.waitForFunction(async () => $('.chat-rightside .group.avatar.image').css('background-image') === 'none', 10);
    });

    await session('Bob', async () => {
        I.login({ user: users[1] });
        I.waitForText(groupTitle, 30, '.ox-chat');
        I.click(locate('.ox-chat li').withText(groupTitle));
        I.click('~Detach window', '.chat-rightside');

        I.waitForText(groupTitle, 5, '.chat-rightside .header');
        I.waitForText(groupTitle, 5, '.chat-leftside .left-navigation');
        I.waitForFunction(async () => $('.chat-rightside .group.avatar.image').css('background-image') === 'none', 10);
    });

    await session('Charlie', async () => {
        I.login({ user: users[2] });
        I.waitForText(groupTitle, 30, '.ox-chat');
        I.click(locate('.ox-chat li').withText(groupTitle));
        I.click('~Detach window', '.chat-rightside');

        I.waitForText(groupTitle, 5, '.chat-rightside .header');
        I.waitForText(groupTitle, 5, '.chat-leftside .left-navigation');
        I.waitForFunction(async () => $('.chat-rightside .group.avatar.image').css('background-image') === 'none', 10);
    });

    // Check photo after upload | Edited name: Marienkaeferchen
    await session('Alice', async () => {
        I.click(locate({ css: "[title='More actions']" }), '.floating-window');
        I.clickDropdown('Edit chat');

        dialogs.waitForVisible();
        I.fillField('.ox-chat-popup input[name="title"]', 'Marienkaeferchen');
        I.click('.contact-photo.empty', dialogs.locators.header);
        I.waitForElement('.contact-photo-upload form input[type="file"][name="file"]', '.edit-picture');
        I.attachFile('.contact-photo-upload form input[type="file"][name="file"]', 'e2e/media/placeholder/800x600.png');
        dialogs.clickButton('Apply');
        I.waitForDetached('.edit-picture');
        dialogs.clickButton('Save');
        I.waitForDetached('.modal-dialog');

        I.waitForText('Marienkaeferchen', 5, '.chat-rightside .header');
        I.waitForText('Marienkaeferchen', 5, '.chat-leftside .left-navigation');
        I.waitForFunction(async () => $('.chat-rightside .group.avatar.image').css('background-image') !== 'none', 10);
    });

    await session('Bob', async () => {
        I.waitForText('Marienkaeferchen', 5, '.chat-rightside .header');
        I.waitForText('Marienkaeferchen', 5, '.chat-leftside .left-navigation');
        I.waitForFunction(async () => $('.chat-rightside .group.avatar.image').css('background-image') !== 'none', 10);
    });

    await session('Charlie', async () => {
        I.waitForText('Marienkaeferchen', 5, '.chat-rightside .header');
        I.waitForText('Marienkaeferchen', 5, '.chat-leftside .left-navigation');
        I.waitForFunction(async () => $('.chat-rightside .group.avatar.image').css('background-image') !== 'none', 10);
    });

    // Check photo after removing photo | Edited name: try empty -> error, restore old one
    await session('Alice', async () => {
        I.click(locate({ css: "[title='More actions']" }), '.floating-window');
        I.clickDropdown('Edit chat');

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
        I.fillField('.ox-chat-popup input[name="title"]', 'Marienkaeferchen');
        dialogs.clickButton('Save');
        I.waitForDetached('.modal-dialog');

        I.waitForFunction(async () => $('.chat-rightside .group.avatar.image').css('background-image') === 'none', 10);
    });

    await session('Bob', async () => {
        I.waitForText('Marienkaeferchen', 5, '.chat-rightside .header');
        I.waitForText('Marienkaeferchen', 5, '.chat-leftside .left-navigation');
        I.waitForFunction(async () => $('.chat-rightside .group.avatar.image').css('background-image') === 'none', 10);
    });

    await session('Charlie', async () => {
        I.waitForText('Marienkaeferchen', 5, '.chat-rightside .header');
        I.waitForText('Marienkaeferchen', 5, '.chat-leftside .left-navigation');
        I.waitForFunction(async () => $('.chat-rightside .group.avatar.image').css('background-image') === 'none', 10);
    });
});
