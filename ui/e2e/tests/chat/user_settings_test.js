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

Feature('Chat user settings');

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

Scenario('Last used chat will be re-opened on next start', async (I, users, chat) => {
    I.login({ user: users[0] });
    chat.createPrivateChat(users[1].userdata.email1);
    I.waitForText('Hello.', 3, '.ox-chat');
    I.waitForNetworkTraffic();

    I.refreshPage();
    I.waitForVisible('#io-ox-core', 30);
    I.waitForText('Hello.', 30, '.ox-chat');
});

Scenario('Last used chat will not be re-opened on next start', async (I, users, chat) => {
    I.login({ user: users[0] });
    chat.createPrivateChat(users[1].userdata.email1);
    I.waitForText('Hello.', 3, '.ox-chat');

    // change settings
    I.click('~Settings');
    I.clickDropdown('Settings');
    I.waitForElement('.folder.virtual.open[data-model="virtual/settings/main"]');
    I.click({ css: 'li[data-id="virtual/settings/chat"]' });
    I.waitForText('View options', 3, '.scrollable-pane');
    I.click('Select last chat on start', '.scrollable-pane');

    // check
    I.refreshPage();
    I.waitForNetworkTraffic();
    I.waitForText('User', 3, '.ox-chat');
    I.dontSee('Hello.', '.ox-chat');
});

