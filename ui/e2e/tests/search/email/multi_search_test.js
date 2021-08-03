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

/// <reference path="../../../steps.d.ts" />

Feature('Mail > Search');

Before(async ({ users }) => {
    await users.create();
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

function getTestMail(from, to, opt) {
    opt = opt || {};
    return {
        attachments: [{
            content: opt.content,
            content_type: 'text/html',
            disp: 'inline'
        }],
        from: [[from.get('displayname'), from.get('primaryEmail')]],
        sendtype: 0,
        subject: opt.subject,
        to: [[to.get('displayname'), to.get('primaryEmail')]],
        folder_id: opt.folder,
        flags: opt.flags
    };
}

Scenario('[C8407] Perform a multi search', async function ({ I, users, mail, search }) {
    const [user1, user2] = users;

    await I.haveMail(getTestMail(user1, user2, { subject: 'test 123', content: '' }));
    await I.haveMail(getTestMail(user1, user2, { subject: 'test', content: '' }));

    I.login('app=io.ox/mail', { user: user2 });
    mail.waitForApp();

    I.click(search.locators.box);
    I.waitForVisible(search.locators.field);
    I.fillField(search.locators.field, 'test');

    I.pressKey('Enter');
    I.waitForVisible('.list-view [data-index="0"]');
    I.waitForVisible('.list-view [data-index="1"]');
    I.waitForElement('.token span[title="test"] + a');

    I.fillField(search.locators.field, '123');
    I.pressKey('Enter');
    I.waitForElement('.list-view [data-index="0"]');
    I.waitForInvisible('.list-view [data-index="1"]');
});

Scenario('[C8406] Delete a string from multi search', async function ({ I, users, mail, search }) {
    const [user1, user2] = users;

    await I.haveMail(getTestMail(user1, user2, { subject: 'test 123', content: '' }));
    await I.haveMail(getTestMail(user1, user2, { subject: 'test', content: '' }));

    I.login('app=io.ox/mail', { user: user2 });
    mail.waitForApp();

    I.click(search.locators.box);
    I.waitForVisible(search.locators.field);
    I.fillField(search.locators.field, 'test');
    I.pressKey('Enter');
    I.waitForVisible('.list-view [data-index="0"]');
    I.waitForVisible('.list-view [data-index="1"]');
    I.waitForElement('.token span[title="test"] + a');

    I.fillField(search.locators.field, '123');
    I.pressKey('Enter');
    I.waitForElement('.list-view [data-index="0"]');
    I.waitForInvisible('.list-view [data-index="1"]');
    I.waitForElement('.token span[title="123"] + a');
    I.click('.token span[title="123"] + a');
    I.waitForVisible('.list-view [data-index="0"]');
    I.waitForVisible('.list-view [data-index="1"]');
});
