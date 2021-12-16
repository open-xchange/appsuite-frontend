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

Feature('Settings > Data export (GDPR)');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

const { I, mail } = inject();
const moment = require('moment');

function requestDownloadFor(module) {
    // uncheck options
    within('.io-ox-personal-data-settings', () => {
        ['Email', 'Calendar', 'Address book', 'Tasks', 'Drive'].forEach((label) => {
            if (label !== module) I.uncheckOption(label);
        });
    });
    // click and check
    I.click('Request download');
    I.waitForText('Download requested');
    I.pressKey('Escape');
    I.waitForText('Cancel download request');
    within('.personal-data-view .disabled', () => {
        I.dontSeeElement('button:disabled'); //check "Request download" disabled
    });
}

function waitForYell() {
    const start_tag = moment().format('MM/DD/YYYY');
    const end_tag = moment().add(14, 'day').format('MM/DD/YYYY');
    I.waitForText('Your data archive from ' + start_tag + ' is ready for download. The download is available until ' + end_tag + '.', 600);
}

function checkNotificationMail() {
    I.openApp('Mail');
    mail.waitForApp();
    mail.selectMail('Your personal data archive is ready for download');

    I.see('Your personal data archive is ready for download');
    I.see('The data archive that you have requested on ' + moment().format('MMM D, YYYY') + ' is now ready for download.');
    I.see('You can download the archive until ' + moment().add(14, 'day').format('MMM D, YYYY'));
    I.see('Download archives');

    within({ frame: '.mail-detail-frame' }, async () => {
        I.click('a.deep-link-gdpr');
    });

    // Settings > Export data opened
    I.waitForText('Your archive');
    I.see('archive-' + moment().format('YYYY-MM-DD') + '.zip');
    I.seeElement('.btn[title="Download archive-' + moment().format('YYYY-MM-DD') + '.zip."]');
}

// runs up to 6 minutes
Scenario('[C288510] Export data from mail module', async ({ I, settings, users }) =>{
    let [user] = users;

    await I.haveMail({
        from: [[user.get('displayname'), user.get('primaryEmail')]],
        subject: 'C288510',
        content: 'Testing is still awesome',
        to: [[user.get('displayname'), user.get('primaryEmail')]]
    });

    I.login(['app=io.ox/settings', 'folder=virtual/settings/personaldata']);
    settings.waitForApp();
    I.waitForText('Download your personal data');

    requestDownloadFor('Email');
    waitForYell();
    checkNotificationMail();
});

// runs up to 6 minutes
Scenario('[C288515] Export data from calendar module', async ({ I, settings }) =>{
    const appointmentDefaultFolder = await I.grabDefaultFolder('calendar');

    await I.haveAppointment({
        folder: 'cal://0/' + appointmentDefaultFolder,
        summary: 'test appointment',
        description: 'test appointment',
        startDate: { tzid: 'Europe/Berlin', value: moment().add(10, 'second').format('YYYYMMDD[T]HHmmss') },
        endDate: { tzid: 'Europe/Berlin', value: moment().add(11, 'seconds').format('YYYYMMDD[T]HHmmss') }
    });

    I.login(['app=io.ox/settings', 'folder=virtual/settings/personaldata']);
    settings.waitForApp();
    I.waitForText('Download your personal data');

    requestDownloadFor('Calendar');
    waitForYell();
    checkNotificationMail();
});

// runs up to 6 minutes
Scenario('[C288516] Export data from contacts module', async ({ I, settings }) =>{
    const contactsDefaultFolder = await I.grabDefaultFolder('contacts');

    await I.haveContact({
        folder_id: contactsDefaultFolder,
        first_name: 'Test',
        last_name: 'User'
    });

    I.login(['app=io.ox/settings', 'folder=virtual/settings/personaldata']);
    settings.waitForApp();
    I.waitForText('Download your personal data');

    requestDownloadFor('Address book');
    waitForYell();
    checkNotificationMail();
});

// runs up to 6 minutes
Scenario('[C288517] Export data from files module', async ({ I, settings }) =>{
    const infostoreFolderID = await I.grabDefaultFolder('infostore');
    await I.haveFile(infostoreFolderID, 'e2e/media/files/generic/testdocument.rtf');

    I.login(['app=io.ox/settings', 'folder=virtual/settings/personaldata']);
    settings.waitForApp();
    I.waitForText('Download your personal data');

    requestDownloadFor('Drive');
    waitForYell();
    checkNotificationMail();
});

// runs up to 6 minutes
Scenario('[C288518] Export data from tasks module', async ({ I, settings }) =>{
    const tasksDefaultFolder = await I.grabDefaultFolder('tasks');

    await I.haveTask({
        title: 'Test Task',
        status: '1',
        percent_completed: '0',
        folder_id: tasksDefaultFolder,
        private_flag: false,
        note: 'Test task for Data export'
    });

    I.login(['app=io.ox/settings', 'folder=virtual/settings/personaldata']);
    settings.waitForApp();
    I.waitForText('Download your personal data');

    requestDownloadFor('Tasks');
    waitForYell();
    checkNotificationMail();
});


