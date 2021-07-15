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

Feature('Mail > Listview');

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

Scenario('check auto select behavior in list view', async ({ I, users }) => {

    const user = users[0];

    await I.haveMail({
        attachments: [{
            content: 'Hello world!',
            content_type: 'text/html',
            disp: 'inline'
        }],
        from: [[user.get('display_name'), user.get('primaryEmail')]],
        sendtype: 0,
        subject: 'First mail!',
        to: [[users[0].get('display_name'), users[0].get('primaryEmail')]]
    }, { user });

    await I.haveMail({
        attachments: [{
            content: 'Hello world!',
            content_type: 'text/html',
            disp: 'inline'
        }],
        from: [[user.get('display_name'), user.get('primaryEmail')]],
        sendtype: 0,
        subject: 'Second mail!',
        to: [[users[0].get('display_name'), users[0].get('primaryEmail')]]
    }, { user });

    await I.haveMail({
        attachments: [{
            content: 'Hello world!',
            content_type: 'text/html',
            disp: 'inline'
        }],
        from: [[user.get('display_name'), user.get('primaryEmail')]],
        sendtype: 0,
        subject: 'Third mail!',
        to: [[users[0].get('display_name'), users[0].get('primaryEmail')]]
    }, { user });

    I.login('app=io.ox/mail');

    I.waitForText('First mail!');
    I.waitForElement('.list-item.selectable.unread [title="First mail!"]');
    I.retry(5).click('.list-item.selectable.unread [title="First mail!"]');
    I.waitForElement('.list-item.selected');

    I.logout();

    I.login('app=io.ox/mail');

    I.waitForText('First mail!', 5);
    I.waitForElement('.list-item.selected');
    I.seeNumberOfElements('.list-item.selectable.unread', 2);
    I.seeNumberOfElements('.list-item.selected', 1);
    I.waitForElement('.list-item.selected [title="First mail!"]');

    I.logout();

    I.haveSetting('io.ox/mail//layout', 'list');

    I.login('app=io.ox/mail');

    I.waitForText('First mail!');
    I.seeNumberOfElements('.list-item.selectable.unread', 2);
    I.dontSeeElement('.list-item.selected');

    I.clickToolbar('View');
    I.clickDropdown('Vertical');

    I.waitForText('First mail!');
    I.waitForElement('.list-item.selected');

    I.logout();

    I.haveSetting('io.ox/mail//layout', 'list');

    I.login('app=io.ox/mail');
    I.waitForText('First mail!');

    I.seeNumberOfElements('.list-item.selectable.unread', 2);
    I.dontSeeElement('.list-item.selected');
    I.waitForElement('.list-item.selectable.unread [title="Second mail!"]');
    I.retry(5).click('.list-item.selectable.unread [title="Second mail!"]');

    I.clickToolbar('View');
    I.clickDropdown('Vertical');
    I.waitForText('Second mail!');
    I.waitForElement('.list-item.selected [title="Second mail!"]');
});
