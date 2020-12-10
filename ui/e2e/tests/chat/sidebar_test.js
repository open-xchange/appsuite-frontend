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
Feature('Chat sidebar');

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

Scenario('Show all files', (I, users, chat) => {
    const scrollpaneLocator = '.ox-chat .chat-rightside .scrollpane';

    I.login({ user: users[0] });
    chat.openChat();
    chat.createPrivateChat(users[1].userdata.email1);
    chat.sendFile('e2e/media/placeholder/800x600.png');
    chat.sendFile('e2e/media/files/0kb/document.doc');
    chat.sendFile('e2e/media/files/0kb/spreadsheet.xls');
    I.waitForElement(locate('.message-file-container .name').withText('spreadsheet.xls'), 5, '.ox-chat .messages');

    I.click('~Close chat', '.ox-chat');
    I.wait(0.5); // gentle wait for listeners
    I.click('.chat-leftside button[data-cmd="show-all-files"]');
    I.waitForElement(scrollpaneLocator);
    I.waitForText('spreadsheet.xls', 15, scrollpaneLocator);
    I.see('spreadsheet.xls', scrollpaneLocator);
    I.see('document.doc', scrollpaneLocator);
    I.see('800x600.png', scrollpaneLocator);

});
