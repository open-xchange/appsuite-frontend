/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2018 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Olena Stute <olena.stute@open-xchange.com>
 */
/// <reference path="../../steps.d.ts" />

Feature('Portal');

Before(async (users) => {
    await users.create();
});
After(async (users) => {
    await users.removeAll();
});

Scenario('[C7494] Refresh widgets', async (I, users) => {

    // set settings
    await I.haveSetting('io.ox/core//refreshInterval', 60);
    await I.haveSetting('io.ox/portal//widgets/user', '{}');
    await I.haveSetting('io.ox/core//autoOpenNotification', false);
    await I.haveSetting('io.ox/core//showDesktopNotifications', false);

    //Add a mail
    let [user] = users;
    await I.haveMail({
        attachments: [{
            content: 'Test mail-1\r\n',
            content_type: 'text/plain',
            raw: true,
            disp: 'inline'
        }],
        from: [[user.get('displayname'), user.get('primaryEmail')]],
        sendtype: 0,
        subject: 'Test subject-1',
        to: [[user.get('displayname'), user.get('primaryEmail')]]
    });

    // Add an appointment

    const moment = require('moment');
    let testrailID = 'C7494';

    const appointmentDefaultFolder = await I.grabDefaultFolder('calendar');

    await I.haveAppointment({
        folder: 'cal://0/' + appointmentDefaultFolder,
        summary: testrailID + '-1',
        location: testrailID,
        description: testrailID + '-1',
        attendeePrivileges: 'DEFAULT',
        endDate: {
            tzid: 'Europe/Berlin',
            value: moment().add(6, 'hours').format('YYYYMMDD[T]HHmm00')
        },
        startDate: {
            tzid: 'Europe/Berlin',
            value: moment().add(4, 'hours').format('YYYYMMDD[T]HHmm00')
        }
    });

    //Add a file
    const infostoreFolderID = await I.grabDefaultFolder('infostore');
    await I.haveFile(infostoreFolderID, 'e2e/media/files/generic/testdocument.odt');

    //Add widgets to Portal
    //Inbox widget
    I.login('app=io.ox/portal');
    I.waitForVisible('.io-ox-portal');
    I.click('Add widget');
    I.waitForVisible('.io-ox-portal-settings-dropdown');
    I.click('Inbox');
    I.waitForVisible('.modal-dialog');
    I.click('Save');
    I.waitForElement('~Inbox');
    I.waitNumberOfVisibleElements('~Inbox', 1, 5);

    //Appointmments widget
    I.click('Add widget');
    I.waitForVisible('.io-ox-portal-settings-dropdown');
    I.click('Appointments');
    I.waitForElement('~Appointments');
    I.waitNumberOfVisibleElements('~Appointments', 1, 5);

    //Recent files widget
    I.click('Add widget');
    I.waitForVisible('.io-ox-portal-settings-dropdown');
    I.click('Recently changed files');
    I.waitForElement('~Recently changed files');
    I.waitNumberOfVisibleElements('~Recently changed files', 1, 5);

    //Add second mail
    await I.haveMail({
        attachments: [{
            content: 'Test mail-2\r\n',
            content_type: 'text/plain',
            raw: true,
            disp: 'inline'
        }],
        from: [[user.get('displayname'), user.get('primaryEmail')]],
        sendtype: 0,
        subject: 'Test subject-2',
        to: [[user.get('displayname'), user.get('primaryEmail')]]
    });

    //Add second appointment
    await I.haveAppointment({
        folder: 'cal://0/' + appointmentDefaultFolder,
        summary: testrailID + '-2',
        location: testrailID,
        description: testrailID + '-2',
        attendeePrivileges: 'DEFAULT',
        endDate: {
            tzid: 'Europe/Berlin',
            value: moment().add(8, 'hours').format('YYYYMMDD[T]HHmm00')
        },
        startDate: {
            tzid: 'Europe/Berlin',
            value: moment().add(7, 'hours').format('YYYYMMDD[T]HHmm00')
        }
    });

    //Add second file
    await I.haveFile(infostoreFolderID, 'e2e/media/files/generic/testdocument.rtf');

    //Verify auto-refresh
    I.waitNumberOfVisibleElements('.widget[aria-label="Inbox"] ul li', 2, 65);
    I.waitNumberOfVisibleElements('.widget[aria-label="Appointments"] ul li', 2, 65);
    I.waitNumberOfVisibleElements('.widget[aria-label="Recently changed files"] ul li', 2, 65);

    //  I.openApp('Mail');
    //  I.waitForVisible('.io-ox-mail-window');

    //Add third mail
    await I.haveMail({
        attachments: [{
            content: 'Test mail-3\r\n',
            content_type: 'text/plain',
            raw: true,
            disp: 'inline'
        }],
        from: [[user.get('displayname'), user.get('primaryEmail')]],
        sendtype: 0,
        subject: 'Test subject-3',
        to: [[user.get('displayname'), user.get('primaryEmail')]]
    });

    // I.openApp('Calendar');
    // I.waitForVisible('.io-ox-calendar-window');

    //Add third appointment
    await I.haveAppointment({
        folder: 'cal://0/' + appointmentDefaultFolder,
        summary: testrailID + '-3',
        location: testrailID,
        description: testrailID + '-3',
        attendeePrivileges: 'DEFAULT',
        endDate: {
            tzid: 'Europe/Berlin',
            value: moment().add(10, 'hours').format('YYYYMMDD[T]HHmm00')
        },
        startDate: {
            tzid: 'Europe/Berlin',
            value: moment().add(9, 'hours').format('YYYYMMDD[T]HHmm00')
        }
    });

    I.openApp('Drive');
    I.waitForVisible('.io-ox-files-window');

    //Add third file
    await I.haveFile(infostoreFolderID, 'e2e/media/files/generic/testspreadsheed.xlsm');
    I.waitForText('testspreadsheed.xlsm', 30, '~Files');

    I.openApp('Portal');
    I.waitForVisible('.io-ox-portal-window');
    // refresh is throttled, so we wait for the refresh button do be active again
    I.wait(15);
    I.waitForDetached('#io-ox-refresh-icon .fa-spin');
    I.waitForVisible('#io-ox-refresh-icon .fa-spin-paused');
    //Refresh the page
    I.retry(5).click('~Refresh', '#io-ox-appcontrol');
    I.waitForElement('#io-ox-refresh-icon .fa-spin');
    I.waitForDetached('#io-ox-refresh-icon .fa-spin');
    I.waitForElement('#io-ox-refresh-icon .fa-spin-paused');

    //Verify all widgets are refreshed
    I.waitNumberOfVisibleElements('.widget[aria-label="Inbox"] ul li', 3, 15);

    I.waitNumberOfVisibleElements('.widget[aria-label="Appointments"] ul li', 3, 15);

    I.waitNumberOfVisibleElements('.widget[aria-label="Recently changed files"] ul li', 3, 15);
});
