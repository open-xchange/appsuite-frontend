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

const { expect } = require('chai');

Feature('Chat > Commands and emojis');

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

Scenario('Send emojis', async ({ I, users, chat }) => {
    await session('Alice', async () => {
        I.login({ user: users[0] });
        chat.openChat();
        chat.createPrivateChat(users[1].userdata.email1);

        I.waitForElement('.controls');
        I.fillField('~Message', ':)');
        I.pressKey('Enter');
        I.waitForElement('.only-emoji .emoji', 3, '.ox-chat .messages');
        expect((await I.grabCssPropertyFrom('.only-emoji .emoji', 'font-size'))).to.equal('40px');

        I.waitForElement('.controls');
        I.fillField('~Message', 'Some text and :)');
        I.pressKey('Enter');
        expect((await I.grabCssPropertyFrom('.contains-emoji:not(.only-emoji) .emoji', 'font-size'))).to.equal('22px');

        I.click('~Detach window', '.chat-rightside');
        I.click('Add emoji', '.ox-chat');
        I.waitForElement('.emoji-picker', 3, '.ox-chat');
        I.click('.emoji-icons button', '.ox-chat');
        I.click('~Send', '.ox-chat');

        I.retry(3).seeNumberOfVisibleElements('.ox-chat .messages .emoji', 3);
    });

    await session('Bob', async () => {
        I.login({ user: users[1] });
        chat.openChat();
        I.waitForText('User', 30, '.ox-chat');
        I.click(locate('.ox-chat li').withText('User'));
        I.waitForElement('.only-emoji .emoji', 3, '.ox-chat .messages');
        expect((await I.grabCssPropertyFrom('.only-emoji .emoji', 'font-size'))).to.equal('40px');
        expect((await I.grabCssPropertyFrom('.contains-emoji:not(.only-emoji) .emoji', 'font-size'))).to.equal('22px');
        I.retry(3).seeNumberOfVisibleElements('.ox-chat .messages .contains-emoji:not(.only-emoji)', 1);
        I.retry(1).seeNumberOfVisibleElements('.ox-chat .messages .contains-emoji.only-emoji', 2);
    });
});

Scenario('User can be mentioned via @', async ({ I, users, chat }) => {
    await session('Alice', async () => {
        I.login({ user: users[0] });
        chat.openChat();
        chat.createPrivateChat(users[1].userdata.email1);

        I.waitForElement('.controls');
        I.fillField('~Message', `@${users[1].userdata.sur_name} can you update?`);
        I.pressKey('Enter');
        I.waitForElement('.mention:not(.me)', 3, '.ox-chat .messages');
        I.fillField('~Message', `@${users[0].userdata.sur_name} has to check the feature.`);
        I.pressKey('Enter');
        I.waitForElement('.mention.me', 3, '.ox-chat .messages');
    });

    await session('Bob', async () => {
        I.login({ user: users[1] });
        chat.openChat();
        I.waitForText('User', 30, '.ox-chat');
        I.click(locate('.ox-chat li').withText('User'));
        I.waitForElement('.mention.me', 3, '.ox-chat .messages');
        I.waitForElement('.mention:not(.me)', 3, '.ox-chat .messages');
    });
});

Scenario('User can send multi line messages', async ({ I, users, chat }) => {
    await session('Alice', async () => {
        I.login({ user: users[0] });
        chat.openChat();
        chat.createPrivateChat(users[1].userdata.email1);

        I.waitForElement('.controls');
        I.fillField('~Message', 'one');
        I.pressKey(['Shift', 'Enter']);
        I.fillField('~Message', 'two');
        I.pressKey(['Shift', 'Enter']);
        I.fillField('~Message', 'three');
        I.pressKey('Enter');

        I.waitForElement(locate('.body').withText('one'));
        expect((await I.grabCssPropertyFrom(locate('.body').withText('one'), 'height'))).to.equal('72px');
    });

    await session('Bob', async () => {
        I.login({ user: users[1] });
        chat.openChat();
        I.waitForText('User', 30, '.ox-chat');
        I.click(locate('.ox-chat li').withText('User'));
        I.waitForElement(locate('.body').withText('one'));
        expect((await I.grabCssPropertyFrom(locate('.body').withText('one'), 'height'))).to.equal('72px');
    });
});

Scenario('User can check the version', async ({ I, users, chat }) => {
    I.login({ user: users[0] });
    chat.openChat();
    chat.createPrivateChat(users[1].userdata.email1);
    I.waitForElement('.controls');
    I.fillField('~Message', '/version');
    I.pressKey('Enter');
    I.waitForElement('.message.myself.command', 3, '.ox-chat .messages');
    I.see('Server version:', '.ox-chat .messages');

});

Scenario('User can make zoom call via command', async ({ I, users, chat, dialogs }) => {
    await session('Alice', async () => {
        I.login({ user: users[0] });
        chat.openChat();
        chat.createPrivateChat(users[1].userdata.email1);
        I.waitForElement('.controls');
        I.fillField('~Message', '/zoom');
        I.pressKey('Enter');

        I.waitForElement('.call-dialog');
        dialogs.waitForVisible();

        I.waitForElement('.conference-view.zoom');
        dialogs.clickButton('Connect');
        I.wait(0.2);
        I.waitForElement({ css: 'button[data-action="call"]' });
        dialogs.clickButton('Call');
        I.retry(3).switchToNextTab();
        I.closeCurrentTab();
        I.waitForElement({ css: 'button[data-action="hangup"]' });
        dialogs.clickButton('Hang up');

        I.waitForDetached('.call-dialog');
        I.waitForElement('.incoming-call', 3, '.ox-chat .messages');
    });

    await session('Bob', async () => {
        I.login({ user: users[1] });
        chat.openChat();
        I.waitForText('User', 30, '.ox-chat');
        I.click(locate('.ox-chat li').withText('User'));
        I.waitForElement('.incoming-call', 3, '.ox-chat .messages');
    });
});

Scenario('User can make jitsi call via command', async ({ I, users, chat }) => {
    await session('Alice', async () => {
        I.login({ user: users[0] });
        chat.openChat();
        chat.createPrivateChat(users[1].userdata.email1);
        I.waitForElement('.controls');
        I.fillField('~Message', '/jitsi');
        I.pressKey('Enter');

        I.waitForElement('.call-dialog');
        await within('.call-dialog', async () => {
            I.waitForElement('.conference-view.jitsi');
            I.waitForElement({ css: 'button[data-action="call"]' });
            I.click({ css: 'button[data-action="call"]' });
            I.retry(3).switchToNextTab();
            I.closeCurrentTab();
            I.waitForElement({ css: 'button[data-action="hangup"]' });
            I.click({ css: 'button[data-action="hangup"]' });
        });

        I.waitForDetached('.call-dialog');
        I.waitForElement('.incoming-call', 3, '.ox-chat .messages');
    });

    await session('Bob', async () => {
        I.login({ user: users[1] });
        chat.openChat();
        I.waitForText('User', 30, '.ox-chat');
        I.click(locate('.ox-chat li').withText('User'));
        I.waitForElement('.incoming-call', 3, '.ox-chat .messages');
    });
});

Scenario('User can make a zoom call via command within a group', async ({ I, users, chat }) => {
    await users.create();

    await session('Alice', async () => {
        I.login({ user: users[0] });
        chat.openChat();
        I.waitForText('New Chat', 30);
        I.click('New Chat');
        I.clickDropdown('Group chat');
        chat.fillNewGroupForm('Test group', [users[1].userdata.email1, users[2].userdata.email1]);
        I.click(locate({ css: 'button' }).withText('Create chat'), '.ox-chat-popup');
        I.waitForDetached('.modal-dialog');
        chat.sendMessage('Hey group!');
        I.fillField('~Message', '/zoom');
        I.pressKey('Enter');

        I.waitForElement('.call-dialog');
        await within('.call-dialog', async () => {
            I.waitForElement('.conference-view.zoom');
            I.waitForText(users[1].userdata.email1);
            I.waitForText(users[2].userdata.email1);
            I.retry(3).click({ css: 'button[data-action="connect"]' });
            I.wait(1);
            I.waitForElement({ css: 'button[data-action="call"]' });
            I.click({ css: 'button[data-action="call"]' });
            I.retry(3).switchToNextTab();
            I.closeCurrentTab();
            I.waitForElement({ css: 'button[data-action="hangup"]' });
            I.click({ css: 'button[data-action="hangup"]' });
        });

        I.waitForDetached('.call-dialog');
        I.waitForElement('.incoming-call', 3, '.ox-chat .messages');
    });

    await session('Bob', async () => {
        I.login({ user: users[1] });
        chat.openChat();
        I.waitForText('Test group', 30, '.ox-chat');
        I.click(locate('.ox-chat li').withText('Test group'));
        I.waitForElement('.incoming-call', 3, '.ox-chat .messages');
    });
});

Scenario('User can make a jitsi call via command within a group', async ({ I, users, chat }) => {
    await users.create();

    await session('Alice', async () => {
        I.login({ user: users[0] });
        chat.openChat();
        I.waitForText('New Chat', 30);
        I.click('New Chat');
        I.clickDropdown('Group chat');
        chat.fillNewGroupForm('Test group', [users[1].userdata.email1, users[2].userdata.email1]);
        I.click(locate({ css: 'button' }).withText('Create chat'), '.ox-chat-popup');
        I.waitForDetached('.modal-dialog');

        chat.sendMessage('Hey group!');
        I.fillField('~Message', '/jitsi');
        I.pressKey('Enter');

        I.waitForElement('.call-dialog');
        await within('.call-dialog', async () => {
            I.waitForElement('.conference-view.jitsi');
            I.waitForText(users[1].userdata.email1);
            I.waitForText(users[2].userdata.email1);
            I.waitForElement({ css: 'button[data-action="call"]' });
            I.click({ css: 'button[data-action="call"]' });
            I.retry(3).switchToNextTab();
            I.closeCurrentTab();
            I.waitForElement({ css: 'button[data-action="hangup"]' });
            I.click({ css: 'button[data-action="hangup"]' });
        });

        I.waitForDetached('.call-dialog');
        I.waitForElement('.incoming-call', 3, '.ox-chat .messages');
    });

    await session('Bob', async () => {
        I.login({ user: users[1] });
        chat.openChat();
        I.waitForText('Test group', 30, '.ox-chat');
        I.click(locate('.ox-chat li').withText('Test group'));
        I.waitForElement('.incoming-call', 3, '.ox-chat .messages');
    });
});
