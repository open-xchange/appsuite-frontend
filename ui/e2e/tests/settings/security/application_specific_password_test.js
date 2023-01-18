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

// Note.  For login tests to work, the com.openexchange.authentication.application.blacklistedClients must be set to '' (empty)

Feature('Settings > Security > Application Passwords');
let assert = require('assert');
const moment = require('moment');
const DRIVE = 'drive', MAIL = 'mail', EAS = 'eas', CALDAV = 'caldav';
const SUBJECT = 'test mail subject';

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

async function addUser(I, users, name, type) {
    I.waitForElement('#settings-scope');
    I.see('Application');
    I.selectOption('#settings-scope', type);

    I.see('Password name');
    I.fillField('.col-md-6 [name="name"]', name);

    I.click('Add new password');

    // Get the new login information
    I.waitForElement('.login_info');
    I.see('Username:');
    I.see('Password:');

    let loginData = await I.grabTextFrom('.login_info');
    let username = loginData.match(/Username: [^@]*/i);
    let password = loginData.match(/Password: [^\s]*/i);
    assert(username.length > 0, 'assigned username');
    assert(password.length > 0, 'assigned password');
    var newuser = {
        user: {
            name: username[0].substring(username[0].indexOf(':') + 1).trim(),
            password: password[0].substring(password[0].indexOf(':') + 1).trim(),
            context: {
                id: users[0].context.id
            }
        }
    };
    I.click('Close');

    return newuser;
}

Scenario.skip('Add and remove application password', async ({ I, users }) => {

    // Login to settings
    I.login(['app=io.ox/settings', 'folder=virtual/settings/appPasswords']);
    I.waitForElement('[data-point="io.ox/settings/security/appPasswords/settings/detail/view"] .btn');


    // Select calendar type password

    await addUser(I, users, 'test name', CALDAV);

    // Confirm new password listed.  Labeled as never used
    I.waitForElement('.appPermDiv');
    I.see('test name', '.appPermDiv');
    I.see('Last Login: Never used', '.appLoginData');

    // Test delete
    I.click('.remove[data-action="delete"]');
    I.waitForElement('.modal-body');
    I.see('Delete password', '.modal-title');
    I.click('Delete');
    I.wait(1);
    I.dontSee('.appLoginDiv');

    I.logout();
});

// Functions required for use tests

async function testMail(I, pass) {
    if (pass) {
        I.waitForVisible('.mail-item .list-item.selectable');
        I.click('.list-item.selectable');
        I.waitForVisible('.io-ox-mail-window .mail-detail-pane .subject');
        I.see(SUBJECT);
        return;
    }

    I.waitForVisible('.fa-exclamation-triangle');
    return;
}

async function testDrive(I, pass) {
    await I.openApp('Drive');
    I.waitForElement('.file-list-view.complete');
    if (pass) {
        I.waitForElement('.filename');
        I.see('document.txt', '.filename');
        return;
    }
    I.dontSee('document.txt');

}

async function testCalendar(I, pass, calendar) {
    await I.openApp('Calendar');
    await calendar.waitForApp();
    if (pass) {
        I.waitForVisible('.appointment-content');
        I.see('appTest', '.appointment-content');
        return;
    }
    I.dontSee('.appointment-content');
}

async function testContacts(I, pass, calendar, contacts) {
    await I.openApp('io.ox/contacts');
    await contacts.waitForApp(true);
    if (pass) {
        I.waitForVisible('.selectable .fullname');  // Check at least one contact visible
        return;
    }
    I.waitForElement('.io-ox-fail');
    I.see('This account isn\'t authorized to perform this action.', '.io-ox-fail');
}

async function testUser(I, user, type, calendar, contacts) {
    await I.login('app=io.ox/mail', user);
    switch (type) {
        case MAIL:  // yes to mail, contacts, but not cal or drive
            await testMail(I, true);
            await testCalendar(I, false, calendar);
            await testContacts(I, true, calendar, contacts);
            await testDrive(I, false);
            break;
        case EAS: // yes to mail, cal, contacts.  No to drive
            await testMail(I, true);
            await testCalendar(I, true, calendar);
            await testContacts(I, true, calendar, contacts);
            await testDrive(I, false);
            break;
        case DRIVE: // no mail, cal, or contacts.  Drive only
            await testMail(I, false);
            await testDrive(I, true);
            await testCalendar(I, false, calendar);
            await testContacts(I, false, calendar, contacts);
            break;
        default:
    }
    I.logout();
}

Scenario.skip('Add and use application password', async ({ I, users, calendar, contacts }) => {

    const user = users[0];

    // Load up items

    await I.haveMail({
        attachments: [{
            content: 'Hello world!',
            content_type: 'text/html',
            disp: 'inline'
        }],
        from: [[user.get('display_name'), user.get('primaryEmail')]],
        sendtype: 0,
        subject: SUBJECT,
        to: [[users[0].get('display_name'), users[0].get('primaryEmail')]]
    }, { user });

    var testID = 'appTest';
    await I.haveAppointment({
        folder: await calendar.defaultFolder(),
        summary: testID,
        location: testID,
        description: testID,
        attendeePrivileges: 'DEFAULT',
        rrule: 'FREQ=WEEKLY;BYDAY=' + moment().format('dd') + '',
        startDate: { tzid: 'Europe/Berlin', value: moment().format('YYYYMMDD') },
        endDate:   { tzid: 'Europe/Berlin', value: moment().format('YYYYMMDD') }
    });

    const contactfolder = await I.grabDefaultFolder('contacts');
    await I.haveContact({ folder_id: contactfolder, first_name: 'Tester', last_name: 'OX' });

    const folder = await I.grabDefaultFolder('infostore');
    await I.haveFile(folder, 'media/files/0kb/document.txt');

    // Login to settings
    I.login(['app=io.ox/settings', 'folder=virtual/settings/appPasswords']);
    I.waitForElement('[data-point="io.ox/settings/security/appPasswords/settings/detail/view"] .btn');


    // Create user passwords

    let mailuser = await addUser(I, users, 'test mail', MAIL);
    let driveuser = await addUser(I, users, 'test drive', DRIVE);
    let easuser = await addUser(I, users, 'test eas', EAS);

    await I.logout();

    await testUser(I, mailuser, MAIL, calendar, contacts);
    await testUser(I, driveuser, DRIVE, calendar, contacts);
    await testUser(I, easuser, EAS, calendar, contacts);

});
