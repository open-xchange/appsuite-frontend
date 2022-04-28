/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

/// <reference path="../../steps.d.ts" />
Feature('Chat > Sidebar');

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

Scenario('Show all files', ({ I, users, chat }) => {
    const scrollpaneLocator = '.ox-chat .chat-rightside .scrollpane';

    I.login({ user: users[0] });
    chat.openChat();
    chat.createPrivateChat(users[1].userdata.email1);
    chat.sendFile('e2e/media/placeholder/800x600.png');
    chat.sendFile('e2e/media/files/0kb/document.doc');
    chat.sendFile('e2e/media/files/0kb/spreadsheet.xls');
    I.waitForElement(locate('.message-file-container .name').withText('spreadsheet.xls'), 5, '.ox-chat .messages');

    I.click('~Close chat', '.ox-chat');
    I.wait(2); // gentle wait for listeners
    I.click('.chat-leftside button[data-cmd="show-all-files"]');
    I.waitForElement(scrollpaneLocator);
    I.waitForText('spreadsheet.xls', 15, scrollpaneLocator);
    I.see('spreadsheet.xls', scrollpaneLocator);
    I.see('document.doc', scrollpaneLocator);
    I.see('800x600.png', scrollpaneLocator);

});
