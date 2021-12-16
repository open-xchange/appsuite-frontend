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
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C8402] Search in different folders', async ({ I, users }) => {

    // Precondition: Some emails are in the inbox- and in a subfolder and have the subject "test".

    const INBOX = 'default0/INBOX';
    const SUBFOLDER = await I.haveFolder({ title: 'Subfolder', module: 'mail', parent: 'default0/INBOX' });

    const USER = users[0];
    const USER_MAILDOMAINPART = users[0].get('primaryEmail').split('@')[1];

    await I.haveMail({
        folder: INBOX,
        path: 'e2e/media/mails/c8402_1.eml'
    }, { USER });

    await I.haveMail({
        folder: SUBFOLDER,
        path: 'e2e/media/mails/c8402_2.eml'
    }, { USER });

    // 1. Login
    // 2. Go to Mail and select the inbox

    I.login('app=io.ox/mail');
    I.waitForVisible('.search-box');

    // 3. Start a new search by clicking into the search bar.

    I.click('.search-box');

    // 4. Enter "test" in the inputfield, than hit enter.

    I.fillField('.search-box input', 'test');
    // UI will perform a reload if we do not wait here ...
    I.wait(1);
    I.pressKey('Enter');

    I.waitForText('First', 5, '.list-view');
    I.waitForText('Inbox', 5, '.list-view');

    // 5. Change the search folder to the subfolder

    I.click('Inbox', '.io-ox-find .classic-toolbar [data-toggle="dropdown"]');
    I.waitForVisible('.smart-dropdown-container');

    I.click('More');
    I.waitForText('Select folder');

    I.doubleClick(
        locate('.folder-label')
            .withText(USER_MAILDOMAINPART)
            .inside('.folder-picker-dialog'));

    I.click(
        locate('.folder-label')
            .withText('Subfolder')
            .inside('.folder-picker-dialog'));

    I.click('Select');
    I.waitForInvisible('Select folder');

    I.waitForText('Second', 5, '.list-view');
    I.waitForText('Subfolder', 5, '.list-view');

});
