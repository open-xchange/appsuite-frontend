/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2020 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */
/// <reference path="../../steps.d.ts" />

const { expect } = require('chai');

Feature('Chat > Messages');

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

Scenario('Show sender, date and avatar of sent message', async (I, users, chat) => {
    let time;
    const name = users[0].userdata.given_name + ' ' + users[0].userdata.sur_name + ' ';

    await session('Alice', async () => {
        I.login({ user: users[0] });
        chat.openChat();
        chat.createPrivateChat(users[1].userdata.email1);
        I.waitForElement('.sender .time', 3, '.ox-chat .scrollpane');
        time = await I.grabTextFrom('.sender .time');
    });

    await session('Bob', async () => {
        I.login({ user: users[1] });
        chat.openChat();
        I.waitForText('User', 30, '.ox-chat');
        I.click(locate('.ox-chat li').withText('User'));

        // sticky layout
        I.waitForElement('.sender .name', 3, '.ox-chat .scrollpane');
        expect(await I.grabTextFrom('.sender .name')).to.equal(name);
        expect(await I.grabTextFrom('.sender .time')).to.equal(time);

        // floating layout
        I.click('~Detach window', '.ox-chat .chat-rightside');
        I.waitForElement('.floating-window .ox-chat');
        expect(await I.grabTextFrom('.sender .name')).to.equal(name);
        expect(await I.grabTextFrom('.sender .time')).to.equal(time);
        I.seeElement(locate('.ox-chat .conversation div.avatar.initials'));
    });
});

Scenario('Send and view an image', async (I, users, chat) => {
    const imgLocator = '.message .file .message-thumbnail img';

    const checkImage = async function (I) {
        I.waitForElement('.ox-chat .chat-rightside');
        await within('.ox-chat .chat-rightside', async () => {
            I.waitForElement(imgLocator);
            const prevWidth = await I.grabCssPropertyFrom(imgLocator, 'width');
            const prevHeight = await I.grabCssPropertyFrom(imgLocator, 'height');
            expect(prevWidth[0]).to.equal('240px');
            expect(prevHeight[0]).to.equal('180px');

            I.retry(3).click(imgLocator);
        });

        I.waitForElement('.io-ox-viewer', 30);
        await within('.io-ox-viewer', async () => {
            I.waitForElement('.viewer-displayer-image[alt="800x600.png"]', 15);
            I.wait(1); // wait to render image
            const orgWidth = await I.grabCssPropertyFrom('.viewer-displayer-image', 'width');
            const orgHeight = await I.grabCssPropertyFrom('.viewer-displayer-image', 'height');
            expect(orgWidth[0]).to.equal('800px');
            expect(orgHeight[0]).to.equal('600px');
        });
    };

    await session('Alice', async () => {
        I.login({ user: users[0] });
        chat.openChat();
        chat.createPrivateChat(users[1].userdata.email1);

        chat.sendFile('e2e/media/placeholder/800x600.png');
        await checkImage(I);
    });

    await session('Bob', async () => {
        I.login({ user: users[1] });
        chat.openChat();
        I.waitForText('User', 30, '.ox-chat');
        I.click(locate('.ox-chat li').withText('User'));

        // sticky layout
        await checkImage(I);
        I.click('~Close viewer');

        // floating layout
        I.click('~Detach window', '.ox-chat .chat-rightside');
        I.waitForElement('.floating-window .ox-chat');
        await checkImage(I);
    });
});

Scenario('Edit a sent message', async (I, users, chat) => {
    const chatLocator = '.ox-chat .chat-rightside';
    const controlsLocator = chatLocator + ' .controls';

    await session('Alice', async () => {
        I.login({ user: users[0] });
        chat.openChat();
        chat.createPrivateChat(users[1].userdata.email1);

        // via dropdown menu
        I.retry(3).click('.messages svg', chatLocator);
        I.click(locate('.smart-dropdown-container.message-actions-dropdown a').withText('Edit'));
        I.pressKey('Backspace');
        I.pressKey('!');
        I.click('~Send', controlsLocator);
        I.waitForElement(locate('.messages span').withText('Edited'), 3, chatLocator);
        I.see('Hello!', chatLocator);

        // via key up
        chat.sendMessage('are you?');
        I.pressKey('ArrowUp');
        I.fillField('~Message', 'How ');
        I.pressKey('Enter');
        I.waitForText('How are you?', chatLocator);
        I.seeNumberOfVisibleElements(locate('.messages span').withText('Edited').inside(chatLocator), 2);
    });

    await session('Bob', async () => {
        I.login({ user: users[1] });
        chat.openChat();
        I.waitForText('User', 30, '.ox-chat');
        I.click(locate('.ox-chat li').withText('User'));
        I.waitForText('How are you?', chatLocator);
        I.seeNumberOfVisibleElements(locate('.messages span').withText('Edited').inside(chatLocator), 2);
    });
});

Scenario('Delete a message', async (I, users, chat) => {
    await session('Alice', async () => {
        I.login({ user: users[0] });
        chat.openChat();
        chat.createPrivateChat(users[1].userdata.email1);
        chat.sendMessage('Stupid message');

        I.retry(3).click('.ox-chat .messages svg');
        I.click(locate('.smart-dropdown-container.message-actions-dropdown a').withText('Delete'));
        I.waitForText('This message was deleted', 3, '.ox-chat .messages');
    });

    await session('Bob', async () => {
        I.login({ user: users[1] });
        chat.openChat();
        I.waitForText('User', 30, '.ox-chat');
        I.click(locate('.ox-chat li').withText('User'));
        I.waitForText('This message was deleted', 3, '.ox-chat .messages');
    });
});

Scenario('Reply to a message', async (I, users, chat) => {
    await session('Alice', async () => {
        I.login({ user: users[0] });
        chat.openChat();
        chat.createPrivateChat(users[1].userdata.email1);
    });

    await session('Bob', async () => {
        I.login({ user: users[1] });
        chat.openChat();
        I.waitForText('User', 30, '.ox-chat');
        I.click(locate('.ox-chat li').withText('User'));

        I.waitForElement('.message.editable', 3, '.ox-chat');
        I.retry(3).click('.message.editable');
        I.click('button[title="Message actions"]');
        I.click(locate('.smart-dropdown-container.message-actions-dropdown a').withText('Reply'));
        I.waitForText('Hello.', 3, '.ox-chat .editor-container .message-quote');
        I.fillField('~Message', 'Hi!');
        I.pressKey('Enter');
        I.waitForElement(locate('.message-quote .body').withText('Hello.').inside('.ox-chat .messages .myself'));
        I.waitForElement(locate('.body').withText('Hi!').inside('.ox-chat .messages .myself'));
    });

    await session('Alice', async () => {
        I.waitForElement(locate('.message-quote .body').withText('Hello.').inside('.ox-chat .messages:not(.myself)'));
        I.waitForElement(locate('.body').withText('Hi!').inside('.ox-chat .messages:not(.myself)'));
    });
});

Scenario('Sending binaries and check max file size', (I, users, chat) => {
    I.login({ user: users[0] });
    chat.openChat();
    chat.createPrivateChat(users[1].userdata.email1);
    chat.sendFile('e2e/media/files/generic/2MB.dat');
    I.waitForElement('.message-file-container', 3, '.ox-chat .messages');
    chat.sendFile('e2e/media/files/generic/16MB.dat');
    I.waitForElement('.message.user-select-text');
    I.see('The file "16MB.dat" cannot be uploaded because it exceeds the maximum file size of 10 MB');
});

Scenario('Editor saves drafted content for each chat if not sent', (I, users, chat) => {
    const draft = 'This is a draft message.';

    I.login({ user: users[0] });
    chat.openChat();
    chat.createPrivateChat(users[1].userdata.email1);

    within('.ox-chat .chat-rightside', () => {
        I.waitForElement('.controls');
        I.fillField('~Message', draft);
    });

    I.click('~Close chat', '.ox-chat');
    I.waitForText('User', 30, '.ox-chat');
    I.click(locate('.ox-chat li').withText('User'));

    I.seeInField('.ox-chat .controls textarea', 'This is a draft message.');
});
