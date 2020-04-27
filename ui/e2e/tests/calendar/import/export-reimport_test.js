/**
* This work is provided under the terms of the CREATIVE COMMONS PUBLIC
* LICENSE. This work is protected by copyright and/or other applicable
* law. Any use of the work other than as authorized under this license
* or copyright law is prohibited.
*
* http://creativecommons.org/licenses/by-nc-sa/2.5/
* © 2020 OX Software GmbH, Germany. info@open-xchange.com
*
* @author Tran Dong Tran <tran-dong.tran@open-xchange.com>
*/

/// <reference path="../../../steps.d.ts" />

const moment = require('moment');

Feature('Import/Export > Calendar');

Before(async function (users) {
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

Scenario('[C104274] Export and re-import App Suite iCal', async function (I, calendar, dialogs) {

    var start = moment().startOf('day').add(10, 'hours'),
        recurringCounter = 0;

    I.login('app=io.ox/calendar&perspective=list');
    calendar.waitForApp();
    I.handleDownloads('../../build/e2e');

    // 1.a Create some calendar with sample data and 2.a export: Simple
    await newAppointment('Simple');
    I.click('.page.current .appointment');
    checkAppointmentInfo('Simple');
    exportFile('Simple');
    deleteAppointment();

    // 1.b Create some calendar with sample data and 2.b export: All-Day
    await newAppointment('All-Day');
    I.waitForVisible('.page.current .appointment');
    I.click('.page.current .appointment');
    checkAppointmentInfo('All-Day');
    exportFile('All-Day');
    deleteAppointment();

    // 1.c Create some calendar with sample data and 2.c export: Multi-Day
    await newAppointment('Multi-Day');
    I.waitForVisible('.page.current .appointment');
    I.click('.page.current .appointment');
    checkAppointmentInfo('Multi-Day');
    exportFile('Multi-Day');
    deleteAppointment();

    // 1.d Create some calendar with sample data and 2.d export: Recurring
    await newAppointment('Recurring');
    I.waitForVisible('.page.current .appointment');
    I.click(locate('.page.current .appointment').at(1).as('Appointment #1 in list'));
    checkAppointmentInfo('Recurring');
    exportFile('Recurring');
    I.click(locate('.page.current .appointment').at(2).as('Appointment #2 in list'));
    checkAppointmentInfo('Recurring');
    I.click(locate('.page.current .appointment').at(3).as('Appointment #3 in list'));
    checkAppointmentInfo('Recurring');
    I.click(locate('.page.current .appointment').at(1).as('Appointment #1 in list'));
    I.clickToolbar('~Delete appointment');
    dialogs.waitForVisible();
    dialogs.clickButton('Delete all appointments');
    I.waitForDetached('.modal-dialog');
    recurringCounter = 0; // reset for import check

    // 3. Create another calendar folder
    I.say('Adding new calendar');
    I.click('Add new calendar');
    I.clickDropdown('Personal calendar');
    dialogs.waitForVisible();
    dialogs.clickButton('Add');
    I.waitForDetached('.modal-dialog');
    I.selectFolder('New calendar');

    // 3.a Import recently downloaded file and check for info: Simple
    importFile('Simple');
    I.click('.page.current .appointment');
    checkAppointmentInfo('Simple');
    deleteAppointment();

    // 3.b Import recently downloaded file and check for info: All-Day
    importFile('All-Day');
    I.click('.page.current .appointment');
    checkAppointmentInfo('All-Day');
    deleteAppointment();

    // 3.c Import recently downloaded file and check for info: Multi-Day
    importFile('Multi-Day');
    I.click('.page.current .appointment');
    checkAppointmentInfo('Multi-Day');
    deleteAppointment();

    // 3.d Import recently downloaded file and check for info: Recurring (all three appointments)
    importFile('Recurring');
    I.click(locate('.page.current .appointment').at(1).as('Appointment #1 in list'));
    checkAppointmentInfo('Recurring');
    I.click(locate('.page.current .appointment').at(2).as('Appointment #2 in list'));
    checkAppointmentInfo('Recurring');
    I.click(locate('.page.current .appointment').at(3).as('Appointment #3 in list'));
    checkAppointmentInfo('Recurring');

    //----------------------------------------------------

    function importFile(type) {
        I.say('Import .ics for ' + type + ' appointment');
        I.openFolderMenu('New calendar');
        I.clickDropdown('Import');
        dialogs.waitForVisible();
        I.attachFile('.file-input', 'build/e2e/' + type + ' Subject.ics');
        I.waitForText(type + ' Subject.ics', 5, '.filename');
        dialogs.clickButton('Import');
        I.waitForDetached('.modal-dialog');
        I.waitForText('Data imported successfully');
        I.click('.io-ox-alert .close');
        I.waitForDetached('.io-ox-alert');
        I.waitForVisible('.page.current .appointment');
    }

    function exportFile(type) {
        I.say('Export .ics for ' + type + ' appointment');
        I.clickToolbar('~More actions');
        I.clickDropdown('Export');
        I.amInPath('/build/e2e/');
        I.waitForFile(type + ' Subject' + '.ics', 5);
    }

    function deleteAppointment() {
        I.say('Deleting current appointment');
        I.clickToolbar('~Delete appointment');
        dialogs.waitForVisible();
        dialogs.clickButton('Delete appointment');
        I.waitForDetached('.modal-dialog');
    }

    async function newAppointment(label) {
        I.say('Create ' + label + ' appointment');
        const folder = `cal://0/${await I.grabDefaultFolder('calendar')}`,
            format = 'YYYYMMDD[T]HHmmss';

        switch (label) {
            case 'Simple': {
                await I.haveAppointment({
                    folder: folder,
                    summary: 'Simple Subject',
                    location: 'Simple Location',
                    description: 'Simple Description',
                    startDate: {
                        tzid: 'Europe/Berlin',
                        value: start.clone().format(format)
                    },
                    endDate: {
                        tzid: 'Europe/Berlin',
                        value: start.clone().add(1, 'hour').format(format)
                    }
                });
                break;
            }
            case 'All-Day': {
                await I.haveAppointment({
                    folder: folder,
                    summary: 'All-Day Subject',
                    location: 'All-Day Location',
                    description: 'All-Day Description',
                    class: 'CONFIDENTIAL',
                    startDate: {
                        tzid: 'Europe/Berlin',
                        value: start.clone().format('YYYYMMDD')
                    },
                    endDate: {
                        tzid: 'Europe/Berlin',
                        value: start.clone().add(1, 'day').format('YYYYMMDD')
                    }
                });
                break;
            }
            case 'Multi-Day': {
                await I.haveAppointment({
                    folder: folder,
                    summary: 'Multi-Day Subject',
                    location: 'Multi-Day Location',
                    description: 'Multi-Day Description',
                    class: 'PRIVATE',
                    startDate: {
                        tzid: 'Europe/Berlin',
                        value: start.clone().format(format)
                    },
                    endDate: {
                        tzid: 'Europe/Berlin',
                        value: start.clone().add(1, 'day').add(1, 'hour').format(format)
                    }
                });
                break;
            }
            case 'Recurring': {
                await I.haveAppointment({
                    folder: folder,
                    summary: 'Recurring Subject',
                    location: 'Recurring Location',
                    description: 'Recurring Description',
                    startDate: {
                        tzid: 'Europe/Berlin',
                        value: start.clone().format(format)
                    },
                    endDate: {
                        tzid: 'Europe/Berlin',
                        value: start.clone().add(1, 'hour').format(format)
                    },
                    rrule: 'FREQ=DAILY;COUNT=3'

                });
                break;
            }
            default: break;
        }
        I.waitForVisible('.page.current .appointment', 30);
    }

    function checkAppointmentInfo(label) {
        I.say('Check info for ' + label + ' appointment');
        I.waitForText(label + ' Subject', 5, '.calendar-detail-pane h1');
        I.see(label + ' Location', '.calendar-detail-pane');
        I.see(label + ' Description', '.calendar-detail-pane');
        switch (label) {
            case 'Simple': {
                I.see(start.format('ddd, M/D/YYYY'), '.calendar-detail-pane'); // see e.g.: Thu, 4/23/2020
                I.see(start.format('HH:mm') + ' – ' + start.clone().add(1, 'hour').format('HH:mm A'), '.calendar-detail-pane'); // see: 10:00 - 11:00 AM
                break;
            }
            case 'All-Day': {
                I.see(start.format('ddd, M/D/YYYY'), '.calendar-detail-pane'); // see e.g. Thu, 4/23/2020
                I.see('Whole day', '.calendar-detail-pane');
                I.seeElement('.calendar-detail-pane .private-flag.fa-lock');
                break;
            }
            case 'Multi-Day': {
                I.see(start.format('ddd, M/D/YYYY HH:mm A') + ' – ' + start.clone().add(1, 'hour').add(1, 'day').format('ddd, M/D/YYYY HH:mm A'), '.calendar-detail-pane');
                I.seeElement('.calendar-detail-pane .private-flag.fa-user-circle');
                break;
            }
            case 'Recurring': {
                I.waitForText(start.clone().add(recurringCounter, 'day').format('ddd, M/D/YYYY'), '.calendar-detail-pane'); // see e.g.: Thu, 4/23/2020 | wait 5s because previous recurring could be shown
                I.see(start.format('HH:mm') + ' – ' + start.clone().add(1, 'hour').add(recurringCounter, 'day').format('HH:mm A'), '.calendar-detail-pane'); // see: 10:00 - 11:00 AM
                I.waitForElement('.calendar-detail-pane .fa.fa-repeat');
                recurringCounter++;
                break;
            }
            default: break;
        }
    }
});
