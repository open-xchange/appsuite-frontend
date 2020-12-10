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

const moment = require('moment');

Feature('Chat > Create chats');

Before(async (users) => {
    await Promise.all([
        users.create(),
        users.create()
    ]);
    await users[0].context.hasCapability('chat');
    await users[0].context.hasCapability('switchboard');
});

After(async (users) => {
    await users[0].context.doesntHaveCapability('chat');
    await users.removeAll();
});

Scenario('Create new private chat', async (I, users, chat) => {
    await session('Alice', async () => {
        I.login({ user: users[0] });
        chat.openChat();
        chat.createPrivateChat(users[1].userdata.email1);
        I.click('~Close chat', '.ox-chat');
        I.waitForVisible('.chat-avatar .initials');
    });
    await session('Bob', async () => {
        I.login({ user: users[1] });
        chat.openChat();
        I.waitForText('User', 30, '.ox-chat');
        I.click(locate('.ox-chat li').withText('User'));
        I.waitForText('Hello.', 3, '.messages');
        I.click('~Close chat', '.ox-chat');
        I.waitForVisible('.chat-avatar .initials');
    });
});

Scenario('Create new private chat from floating window via dropdown', async (I, users, chat) => {
    I.login({ user: users[0] });
    chat.openChat();
    I.waitForText('New Chat', 30);
    I.click('~Detach window');

    I.click('~New', '.ox-chat');
    I.waitForElement('.ox-chat .action-button-rounded .dropdown-menu');
    I.click('Private chat', '.ox-chat .action-button-rounded .dropdown-menu');

    I.waitForText(users[1].userdata.email1);
    I.click(locate('.address-picker li').withText(users[1].userdata.email1));
    I.click('Start conversation');
    I.waitForElement('.ox-chat .controls');
    I.waitForVisible('.chat-rightside .chat-avatar .initials');
});

Scenario('Create new private chat from floating window via icon', async (I, users, chat) => {
    I.login({ user: users[0] });
    chat.openChat();
    I.waitForText('New Chat', 30);
    I.click('~Detach window');

    I.click('~Create private chat', '.ox-chat');

    I.waitForText(users[1].userdata.email1);
    I.click(locate('.address-picker li').withText(users[1].userdata.email1));
    I.click('Start conversation');
    I.waitForElement('.ox-chat .controls');
    I.waitForVisible('.chat-rightside .chat-avatar .initials');
});

Scenario('Create new private chat from address book', async (I, contacts, users, chat) => {
    await session('Alice', async () => {
        I.login('app=io.ox/contacts', { user: users[0] });
        chat.openChat();
        I.waitForElement('.io-ox-contacts-window');
        I.waitForVisible('.io-ox-contacts-window .classic-toolbar');
        I.waitForVisible('.io-ox-contacts-window .tree-container');
        I.waitForVisible('.ox-chat');

        contacts.selectContact(`${users[1].get('sur_name')}, ${users[1].get('given_name')}`);
        I.waitForText('Chat', 5, '.action-button-rounded');
        I.waitForEnabled(locate('.action-button-rounded .btn').withText('Chat'));

        I.click('Chat', '.action-button-rounded');

        chat.sendMessage('Hello.');
        I.click('~Close chat', '.ox-chat');
        I.waitForVisible('.chat-avatar .initials');
    });
    await session('Bob', async () => {
        I.login({ user: users[1] });
        chat.openChat();
        I.waitForText('User', 30, '.ox-chat');
        I.click(locate('.ox-chat li').withText('User'));
        I.waitForText('Hello.', 3, '.messages');

        I.click('~Close chat');
        I.waitForVisible('.chat-avatar .initials');
    });
});

Scenario('Create new private chat from halo', async (I, mail, users, chat) => {
    const [alice, bob] = users;

    await I.haveMail({
        from: [[alice.get('display_name'), alice.get('primaryEmail')]],
        subject: 'Test subject!',
        to: [[bob.get('display_name'), bob.get('primaryEmail')]]
    }, bob);

    await session('Bob', async () => {
        I.login({ user: bob });
        mail.waitForApp();
        chat.openChat();
        I.waitForVisible('.ox-chat');
        mail.selectMail('Test subject');

        I.waitForVisible('.mail-detail-pane .halo-link');
        I.click('.halo-link');

        I.waitForText('Chat', 5, '.io-ox-halo .action-button-rounded');
        I.waitForEnabled(locate('.io-ox-halo .action-button-rounded .btn').withText('Chat'));
        I.click('Chat', '.action-button-rounded');

        chat.sendMessage('Hello.');
        I.click('~Close chat', '.ox-chat');
        I.waitForVisible('.chat-avatar .initials');
    });

    await session('Alice', async () => {
        I.login({ user: alice });
        chat.openChat();
        I.waitForText('User', 30, '.ox-chat');
        I.click(locate('.ox-chat li').withText('User'));
        I.waitForText('Hello.', 3, '.messages');
        I.click('~Close chat', '.ox-chat');
        I.waitForVisible('.chat-avatar .initials');
    });
});

Scenario('Create new private chat from mail', async (I, mail, users, chat) => {
    const [recipient, sender] = users;

    await I.haveMail({
        from: [[sender.get('display_name'), sender.get('primaryEmail')]],
        sendtype: 0,
        subject: 'Test subject',
        to: [[recipient.get('display_name'), recipient.get('primaryEmail')]]
    }, { user: sender });

    await session('Alice', async () => {
        I.login({ user: recipient });
        chat.openChat();
        mail.waitForApp();
        I.waitForVisible('.ox-chat');
        mail.selectMail('Test subject');

        I.waitForVisible('.mail-detail-pane .inline-toolbar');
        I.click('Reply via chat', '.mail-detail-pane .inline-toolbar');
        I.waitForVisible('.ox-chat .controls');

        chat.sendMessage('Hello.');
        I.click('~Close chat', '.ox-chat');
        I.waitForVisible('.chat-avatar .initials');
    });

    await session('Bob', async () => {
        I.login({ user: sender });
        chat.openChat();
        I.waitForText('User', 30, '.ox-chat');
        I.click(locate('.ox-chat li').withText('User'));
        I.waitForText('Hello.', 3, '.messages');
        I.click('~Close chat', '.ox-chat');
        I.waitForVisible('.chat-avatar .initials');
    });
});

Scenario('Create new group chat', async (I, users, chat, dialogs) => {

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

        I.click('.contact-photo.empty', '.ox-chat-popup .modal-dialog');
        I.waitForElement('.contact-photo-upload form input[type="file"][name="file"]', 3, '.edit-picture');
        I.attachFile('.contact-photo-upload form input[type="file"][name="file"]', 'e2e/media/placeholder/800x600.png');
        dialogs.clickButton('Apply');
        I.waitForDetached('.edit-picture');
        dialogs.clickButton('Create chat');

        chat.sendMessage('Hey group!');
        I.click('~Close chat', '.ox-chat');
        I.waitForFunction(async () => $('.chat-list .group.avatar.image').css('background-image') !== 'none', 10);
    });

    await session('Bob', async () => {
        I.login({ user: users[1] });
        chat.openChat();
        I.waitForText(groupTitle, 30, '.ox-chat');
        I.click(locate({ css: 'li' }).withText(groupTitle), '.ox-chat');
        I.waitForText('Hey group!', 3, '.ox-chat .messages');
        I.seeNumberOfVisibleElements('.message.system', 3, '.ox-chat');
        I.click('~Close chat', '.ox-chat');
        I.waitForFunction(async () => $('.chat-list .group.avatar.image').css('background-image') !== 'none', 10);
    });
});

Scenario('Create new group chat from floating window via dropdown', async (I, users, chat, dialogs) => {
    await users.create();

    const groupTitle = 'Test Group';
    const emails = [users[1].userdata.email1, users[2].userdata.email1];

    I.login({ user: users[0] });
    chat.openChat();

    I.waitForText('New Chat', 30);
    I.click('~Detach window');

    I.click('~New', '.ox-chat');
    I.waitForElement('.ox-chat .action-button-rounded .dropdown-menu');
    I.click('Group chat', '.ox-chat .action-button-rounded .dropdown-menu');

    chat.fillNewGroupForm(groupTitle, emails);
    dialogs.clickButton('Create chat');

    I.waitForElement('.ox-chat .controls');
    I.waitForVisible('.chat-rightside .chat-avatar .fa-group');
    I.waitForVisible('.chat-leftside .chat-avatar .fa-group');

});

Scenario('Create new group chat from floating window via icon', async (I, users, chat, dialogs) => {
    await users.create();

    const groupTitle = 'Test Group';
    const emails = [users[1].userdata.email1, users[2].userdata.email1];

    I.login({ user: users[0] });
    chat.openChat();

    I.waitForText('New Chat', 30);
    I.click('~Detach window');

    I.click('~Create group chat', '.ox-chat');

    chat.fillNewGroupForm(groupTitle, emails);
    dialogs.clickButton('Create chat');

    I.waitForElement('.ox-chat .controls');
    I.waitForVisible('.chat-rightside .chat-avatar .fa-group');
    I.waitForVisible('.chat-leftside .chat-avatar .fa-group');

});

Scenario('Create new group chat from mail', async (I, mail, dialogs, users, chat) => {
    await users.create();
    const [recipient, sender, cc] = users;

    await I.haveMail({
        from: [[sender.get('display_name'), sender.get('primaryEmail')]],
        sendtype: 0,
        subject: 'This better become a group',
        to: [[recipient.get('display_name'), recipient.get('primaryEmail')]],
        cc: [[cc.get('display_name'), cc.get('primaryEmail')]]
    }, { user: sender });

    await session('Alice', async () => {
        I.login({ user: recipient });
        mail.waitForApp();
        chat.openChat();
        I.waitForVisible('.ox-chat');
        mail.selectMail('This better become a group');

        I.waitForVisible('.mail-detail-pane .inline-toolbar');
        I.click('Reply all via chat', '.mail-detail-pane .inline-toolbar');

        dialogs.waitForVisible();
        I.waitForText(sender.get('display_name'), 5, dialogs.locators.body);
        I.waitForText(cc.get('display_name'), 5, dialogs.locators.body);
        dialogs.clickButton('Create chat');

        I.waitForVisible('.ox-chat .controls');
        I.see('This better become a group', '.ox-chat .classic-toolbar');

        chat.sendMessage('Hello.');
        I.click('~Close chat', '.ox-chat');
        I.waitForVisible('.chat-list .chat-avatar .fa-group');
    });

    await session('Bob', async () => {
        I.login({ user: sender });
        chat.openChat();
        I.waitForText('This better become a group', 30, '.ox-chat');
        I.click(locate('.ox-chat li').withText('This better become a group'));
        I.waitForText('Hello.', 3, '.messages');
        I.see('This better become a group', '.ox-chat .classic-toolbar');
        I.click('~Close chat', '.ox-chat');
        I.waitForVisible('.chat-list .chat-avatar .fa-group');
    });

    await session('Charlie', async () => {
        I.login({ user: cc });
        chat.openChat();
        I.waitForText('This better become a group', 30, '.ox-chat');
        I.click(locate('.ox-chat li').withText('This better become a group'));
        I.waitForText('Hello.', 3, '.messages');
        I.see('This better become a group', '.ox-chat .classic-toolbar');
        I.click('~Close chat', '.ox-chat');
        I.waitForVisible('.chat-list .chat-avatar .fa-group');
    });
});

Scenario('Create new group chat from appointment', async (I, dialogs, calendar, users, chat) => {
    await users.create();
    const [user1, user2, user3] = users;
    const subject = 'Discuss meeting';
    const message = 'Discussing time!';

    await session('Alice', async () => {
        const time = moment().startOf('day').add(10, 'hours');
        const format = 'YYYYMMDD[T]HHmmss';

        await I.haveAppointment({
            folder: await calendar.defaultFolder(),
            summary: subject,
            startDate: { tzid: 'Europe/Berlin', value: time.format(format) },
            endDate:   { tzid: 'Europe/Berlin', value: time.add(1, 'hour').format(format) },
            attendees: [
                { entity: user1.userdata.id },
                { entity: user2.userdata.id },
                { entity: user3.userdata.id }
            ]
        });
        I.login('app=io.ox/calendar&perspective=week', { user: user1 });
        calendar.waitForApp();

        I.waitForText(subject, 5, '.appointment');
        chat.openChat();
        I.waitForVisible('.ox-chat');
        I.retry(5).click(subject, '.appointment');
        I.waitForElement('.io-ox-sidepopup');
        I.waitForVisible('~More actions', '.io-ox-sidepopup');
        I.click('~More actions', '.io-ox-sidepopup');
        I.clickDropdown('Start chat with participants');

        dialogs.waitForVisible();
        I.waitForText(user2.userdata.display_name, dialogs.locators.body);
        I.waitForText(user3.userdata.display_name, dialogs.locators.body);
        dialogs.clickButton('Create chat');

        I.click('~Close', '.io-ox-sidepopup');
        I.waitForDetached('.io-ox-sidepopup');

        chat.sendMessage(message);
        I.click('~Close chat', '.ox-chat');
        I.waitForVisible('.chat-list .chat-avatar .fa-group');
    });

    await session('Bob', async () => {
        I.login({ user: user2 });
        chat.openChat();
        I.waitForText(subject, 30, '.ox-chat');
        I.click(locate({ css: 'li' }).withText(subject), '.ox-chat');
        I.waitForText(message, 3, '.ox-chat .messages');
        I.seeNumberOfVisibleElements('.message.system', 2, '.ox-chat');
        I.click('~Close chat', '.ox-chat');
        I.waitForVisible('.chat-list .chat-avatar .fa-group');
    });

    await session('Charlie', async () => {
        I.login({ user: user3 });
        chat.openChat();
        I.waitForText(subject, 30, '.ox-chat');
        I.click(locate({ css: 'li' }).withText(subject), '.ox-chat');
        I.waitForText(message, 3, '.ox-chat .messages');
        I.seeNumberOfVisibleElements('.message.system', 2, '.ox-chat');
        I.click('~Close chat', '.ox-chat');
        I.waitForVisible('.chat-list .chat-avatar .fa-group');
    });
});

Scenario('Create new channel', async (I, users, contexts, chat, dialogs) => {
    const context = await contexts.create();
    context.hasCapability('chat');
    const alice = await users.create(users.getRandom(), context);
    const bob = await users.create(users.getRandom(), context);

    const channelTitle = 'Channel 1.0';

    await session('Alice', async () => {
        I.login({ user: alice });
        chat.openChat();
        I.waitForText('New Chat', 30);
        I.click('New Chat');
        I.clickDropdown('Channel');

        chat.fillNewChannelForm(channelTitle);
        dialogs.clickButton('Create channel');

        I.waitForElement('.ox-chat .controls');
        chat.sendMessage('Hello everyone!');
    });

    await session('Bob', async () => {
        I.login({ user: bob });
        chat.openChat();
        I.waitForElement(locate({ css: 'button' }).withText('All channels'), 30, '.ox-chat');
        I.click(locate({ css: 'button' }).withText('All channels'), '.ox-chat');
        I.waitForText(channelTitle, 3, '.ox-chat');
        I.waitForFunction(async () => $('.chat-rightside .group.avatar.image').css('background-image') !== 'none', 10);
    });

    await context.remove();
});

Scenario('Create new channel from floating window via dropdown', async (I, users, contexts, chat, dialogs) => {
    const context = await contexts.create();
    context.hasCapability('chat');
    const alice = await users.create(users.getRandom(), context);
    const channelTitle = 'Channel 1.0';

    I.login({ user: alice });
    chat.openChat();
    I.waitForText('New Chat', 30);
    I.click('~Detach window');

    I.click('~New', '.ox-chat .chat-leftside');
    I.clickDropdown('Channel');

    chat.fillNewChannelForm(channelTitle);
    dialogs.clickButton('Create channel');

    I.waitForElement('.ox-chat .controls');
    I.waitForFunction(async () => $('.chat-rightside .group.avatar.image').css('background-image') !== 'none', 10);
    I.waitForFunction(async () => $('.chat-leftside .group.avatar.image').css('background-image') !== 'none', 10);
});

Scenario('Create new channel from floating window via icon', async (I, users, contexts, chat, dialogs) => {
    const context = await contexts.create();
    context.hasCapability('chat');
    const alice = await users.create(users.getRandom(), context);

    const channelTitle = 'Channel 1.0';

    I.login({ user: alice });
    chat.openChat();
    I.waitForText('New Chat', 30);
    I.click('~Detach window');

    I.click('~Create channel', '.ox-chat');

    chat.fillNewChannelForm(channelTitle);
    dialogs.clickButton('Create channel');

    I.waitForElement('.ox-chat .controls');
    I.waitForFunction(async () => $('.chat-rightside .group.avatar.image').css('background-image') !== 'none', 10);
    I.waitForFunction(async () => $('.chat-leftside .group.avatar.image').css('background-image') !== 'none', 10);
});
