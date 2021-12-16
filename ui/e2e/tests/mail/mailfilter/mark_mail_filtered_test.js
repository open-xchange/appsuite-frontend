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

Feature('Mailfilter');

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

Scenario('[C7808] -Mark Mail- filtered mail', async function ({ I, users, mail, mailfilter }) {

    await I.haveSetting({
        'io.ox/mail': { messageFormat: 'text' }
    });

    I.login('app=io.ox/settings&folder=virtual/settings/io.ox/mailfilter');

    mailfilter.waitForApp();
    mailfilter.newRule('Testcase C7808');

    mailfilter.addCondition('Subject', 'Testcase C7808');
    mailfilter.setFlag('Blue');
    mailfilter.save();

    I.openApp('Mail');

    // compose mail
    mail.newMail();
    I.fillField('To', users[0].get('primaryEmail'));
    I.fillField('Subject', 'Testcase C7808');
    I.fillField({ css: 'textarea.plain-text' }, 'lorem ipsum');
    I.seeInField({ css: 'textarea.plain-text' }, 'lorem ipsum');

    I.click('Send');

    I.waitForElement('~Sent, 1 total. Right click for more options.', 30);
    I.waitForElement('~Inbox, 1 unread, 1 total. Right click for more options.', 30);
    I.waitForElement('.vsplit .flag_2', 30);
});
