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

Feature('Chat typing notifications');

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

Scenario('Typing notifications will appear and stop on message sent', async (I, users, chat) => {
    const message1 = 'I will only type some words';
    const message2 = ' and then I will write a lot of words and send it immediately. The typing notification should stop as soon I press "Enter".';

    await session('Alice', async () => {
        I.login({ user: users[0] });
        chat.createPrivateChat(users[1].userdata.email1);
    });

    await session('Bob', async () => {
        I.login({ user: users[1] });
        I.waitForText('User', 30, '.ox-chat');
        I.click(locate('.ox-chat li').withText('User'));
        I.waitForText('Hello.', 3, '.messages');
    });

    await session('Alice', async () => {
        I.fillField('~Message', message1);
    });

    await session('Bob', async () => {
        I.waitForDetached('.typing[style="display: none;"]', 3, '.ox-chat');
        I.waitForText(`${users[0].userdata.given_name} ${users[0].userdata.sur_name} is typing`, 3, '.ox-chat');
        I.waitForElement('.typing[style="display: none;"]', 10, '.ox-chat');
    });

    await session('Alice', async () => {
        I.fillField('~Message', message2);
        I.pressKey('Enter');
    });
    await session('Bob', async () => {
        I.waitForText(`${message1}${message2}`, 15, '.ox-chat');
        I.waitForElement('.typing[style="display: none;"]', 0, '.ox-chat');
    });
});
