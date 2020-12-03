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

const { expect } = require('chai');

Feature('Chat commands and emojis');

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

Scenario('Send emojis', async (I, users, chat) => {
    await session('Alice', async () => {
        I.login({ user: users[0] });
        chat.createPrivateChat(users[1].userdata.email1);

        I.waitForElement('.controls');
        I.fillField('~Message', ':)');
        I.pressKey('Enter');
        I.waitForElement('.only-emoji .emoji', 3, '.ox-chat .messages');
        expect((await I.grabCssPropertyFrom('.only-emoji .emoji', 'font-size'))[0]).to.equal('40px');

        I.waitForElement('.controls');
        I.fillField('~Message', 'Some text and :)');
        I.pressKey('Enter');
        expect((await I.grabCssPropertyFrom('.contains-emoji:not(.only-emoji) .emoji', 'font-size'))[0]).to.equal('22px');

        I.click('~Detach window', '.chat-rightside');
        I.click('Add emoji', '.ox-chat');
        I.waitForElement('.emoji-picker', 3, '.ox-chat');
        I.click('.emoji-icons button', '.ox-chat');
        I.click('~Send', '.ox-chat');

        I.retry(3).seeNumberOfVisibleElements('.ox-chat .messages .emoji', 3);
    });
});

Scenario('User can be mentioned via @', async (I, users, chat) => {
    await session('Alice', async () => {
        I.login({ user: users[0] });
        chat.createPrivateChat(users[1].userdata.email1);

        I.waitForElement('.controls');
        I.fillField('~Message', `@${users[1].userdata.sur_name} can you update?`);
        I.pressKey('Enter');
        I.waitForElement('.mention:not(.me)', 3, '.ox-chat .messages');
        I.fillField('~Message', `@${users[0].userdata.sur_name} has to check the feature.`);
        I.pressKey('Enter');
        I.waitForElement('.mention.me', 3, '.ox-chat .messages');
    });
});

Scenario('User can send multi line messages', async (I, users, chat) => {
    await session('Alice', async () => {
        I.login({ user: users[0] });
        chat.createPrivateChat(users[1].userdata.email1);

        I.waitForElement('.controls');
        I.fillField('~Message', 'one');
        I.pressKey(['Shift', 'Enter']);
        I.fillField('~Message', 'two');
        I.pressKey(['Shift', 'Enter']);
        I.fillField('~Message', 'three');
        I.pressKey('Enter');

        expect((await I.grabCssPropertyFrom('.ox-chat .message.myself .body', 'height'))[1]).to.equal('48px');
    });
});

Scenario('User can check the version', async (I, users, chat) => {
    await session('Alice', async () => {
        I.login({ user: users[0] });
        chat.createPrivateChat(users[1].userdata.email1);
        I.waitForElement('.controls');
        I.fillField('~Message', '/version');
        I.pressKey('Enter');
        I.waitForElement('.message.myself.command', 3, '.ox-chat .messages');
        I.see('Server version:', '.ox-chat .messages');
    });
});

Scenario('User can make a zoom call via command', async (I, users, chat) => {
    await session('Alice', async () => {
        I.login({ user: users[0] });
        chat.createPrivateChat(users[1].userdata.email1);
        I.waitForElement('.controls');
        I.fillField('~Message', '/zoom');
        I.pressKey('Enter');

        I.waitForElement('.call-dialog');
        await within('.call-dialog', async () => {
            I.waitForElement('.conference-view.zoom');
            I.click({ css: 'button[data-action="connect"]' });
            I.wait(1);
            I.waitForElement({ css: 'button[data-action="call"]' });
            I.click({ css: 'button[data-action="call"]' });
            I.waitForElement({ css: 'button[data-action="hangup"]' });
            I.click({ css: 'button[data-action="hangup"]' });
        });

        I.waitForDetached('.call-dialog');
        I.waitForElement('.incoming-call', 3, '.ox-chat .messages');
    });
});

Scenario('User can make a jitsi call via command', async (I, users, chat) => {
    await session('Alice', async () => {
        I.login({ user: users[0] });
        chat.createPrivateChat(users[1].userdata.email1);
        I.waitForElement('.controls');
        I.fillField('~Message', '/jitsi');
        I.pressKey('Enter');

        I.waitForElement('.call-dialog');
        await within('.call-dialog', async () => {
            I.waitForElement('.conference-view.jitsi');
            I.waitForElement({ css: 'button[data-action="call"]' });
            I.click({ css: 'button[data-action="call"]' });
            I.waitForElement({ css: 'button[data-action="hangup"]' });
            I.click({ css: 'button[data-action="hangup"]' });
        });

        I.waitForDetached('.call-dialog');
        I.waitForElement('.incoming-call', 3, '.ox-chat .messages');
    });
});
