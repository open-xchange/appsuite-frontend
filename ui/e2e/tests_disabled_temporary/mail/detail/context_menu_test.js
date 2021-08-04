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

/// <reference path="../../../steps.d.ts" />

Feature('Mail > Detail');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C248438] Context menu can be opened by right click', async ({ I, users, mail, dialogs }) => {

    const icke = users[0].userdata.email1,
        subject = 'Context menu can be opened by right click';

    await Promise.all([
        I.haveMail({
            attachments: [{
                content: 'Lorem ipsum',
                content_type: 'text/html',
                disp: 'inline'
            }],
            from: [['Icke', icke]],
            subject: subject,
            to: [['Icke', icke]]
        }),
        I.haveSetting({ 'io.ox/mail': { 'features/registerProtocolHandler': false } })
    ]);

    I.login('app=io.ox/mail');
    mail.waitForApp();

    // wait for first email
    var firstItem = '.list-view .list-item';
    I.waitForElement(firstItem);
    I.click(firstItem);
    I.waitForVisible('.thread-view.list-view .list-item');
    I.waitForDetached('.seen-unseen-indicator');
    // we need to wait until the message is seen
    I.waitForDetached('.thread-view.list-view .list-item.unread');

    // Mark unread
    rightClick('Mark as unread');
    I.waitForElement('.thread-view.list-view .list-item.unread');

    // View source
    rightClick('View source');
    dialogs.waitForVisible();
    I.seeElement('.mail-source-dialog');
    dialogs.clickButton('Close');
    I.waitForDetached('.modal-dialog');

    // Move
    rightClick('Move');
    dialogs.waitForVisible();
    I.seeElement('.folder-picker-dialog');
    dialogs.clickButton('Cancel');
    I.waitForDetached('.modal-dialog');

    // Reply
    rightClick('Reply');
    I.waitForVisible('.io-ox-mail-compose [placeholder="To"]', 30);
    I.waitForInvisible('.io-ox-busy');
    I.seeInField('subject', 'Re: ' + subject);
    // discard mail
    I.click(mail.locators.compose.close);


    // // Shift-F10 (view source again)
    // --- DOES NOT WORK YET -----
    // shiftF10();
    // clickAction('io.ox/mail/actions/source');
    // I.waitForElement('.mail-source-dialog');
    // I.click('Close');

    // Delete
    rightClick('Delete');
    // I.seeNumberOfElements('.leftside .list-view .list-item', 1);
    I.waitForDetached('.leftside .list-view .list-item');

    function rightClick(action) {
        let actionSelector = `//ul[@class="dropdown-menu"]//a[text()="${action}"]`;
        I.rightClick({ xpath: '//li[contains(@class, "list-item selectable")]' });
        I.waitForElement('.dropdown.open');
        I.waitForVisible({ xpath: actionSelector });
        I.click({ xpath: actionSelector });
    }

    // function shiftF10() {
    //     I.executeScript(function () {
    //         var e = $.Event('keydown', { button: 0, shiftKey: true, which: 121 });
    //         list.$el.children('.selected').first().trigger(e);
    //     });
    // }
});

