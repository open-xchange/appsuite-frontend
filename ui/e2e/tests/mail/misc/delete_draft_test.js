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

Feature('Mail > Misc');

Before(async ({ users }) => {
    await Promise.all([
        users.create(),
        users.create()
    ]);
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C114958] Delete draft when closing composer', async ({ I, users, mail, dialogs }) => {
    const mailListView = '.list-view.visible-selection.mail-item';
    const subject = 'Testsubject Draft';

    I.login('app=io.ox/mail');

    mail.newMail();
    I.fillField('To', users[1].get('primaryEmail'));
    I.fillField('Subject', subject);
    I.pressKey('Tab');
    I.fillField('span', 'Testcontent');
    I.click('~Save and close', '.io-ox-mail-compose-window');
    dialogs.clickButton('Save draft');
    I.waitForDetached('.io-ox-mail-compose-window');
    I.selectFolder('Drafts');
    mail.waitForApp();
    I.waitForElement(mailListView);
    I.waitForVisible('.list-view li.list-item');
    mail.selectMail(subject);
    I.waitForFocus('.list-view li.list-item.selected');


    I.waitForElement('.mail-detail-frame');
    within({ frame: '.mail-detail-frame' }, () => {
        I.waitForElement(locate('div.default-style').withText('Testcontent'));
    });

    I.waitForElement('.detail-view-header');
    I.click('Delete', '.detail-view-header');

    within(mailListView, () => {
        I.waitForDetached('.list-item.selectable');
        I.dontSee(subject);
    });
});
