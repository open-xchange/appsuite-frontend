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

Before(async function ({ users }) {
    await users.create();
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

Scenario('Read receipt block is displayed for read/unread mails (OXUIB-319)', async function ({ I, users, mail }) {
    const subject = 'read receipt';
    await I.haveSetting({ 'io.ox/mail': { sendDispositionNotification: true } });

    I.login('app=io.ox/mail', { user: users[1] });
    mail.waitForApp();
    mail.newMail();

    I.say('Send mail with read receipt');
    I.click(mail.locators.compose.options);
    I.clickDropdown('Request read receipt');
    I.fillField('To', users[0].userdata.primaryEmail);
    I.fillField('Subject', subject);
    mail.send();

    // TODO: add check for sent folder for when MWB-633 get's fixed
    I.logout();

    I.say('First login: mail is unseen');
    I.login('app=io.ox/mail');
    mail.waitForApp();
    mail.selectMail(subject);
    I.waitForText('Send a read receipt');
    I.logout();

    I.say('Second login: mail is seen');
    I.login('app=io.ox/mail');
    mail.waitForApp();
    mail.selectMail(subject);
    I.waitForText('Send a read receipt');
    I.click('Send a read receipt');
    I.waitForDetached('.disposition-notification');
    I.logout();

    I.say('Third login: mail is seen and read receipt was send');
    I.login('app=io.ox/mail');
    mail.waitForApp();
    mail.selectMail(subject);
    await within({ frame: '.mail-detail-frame' }, async function () {
        I.seeTextEquals('This mail has no content', 'body');
    });
    I.dontSee('Send a read receipt');
});
