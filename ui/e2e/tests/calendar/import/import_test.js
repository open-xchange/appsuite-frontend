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

Feature('Calendar > Import');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

const appointment = '.appointment-container .appointment.reserved',
    fulltime = '.fulltime-container .appointment.reserved',
    fulltimeFree = '.fulltime-container .appointment.free',
    sidePopup = { css: '.io-ox-sidepopup' },
    examples = new DataTable(['testcase', 'filename', 'assertions']);

function basic_appointment_assertions(I) {
    I.waitForText('Simple Single Appointment', 5, appointment + ' .title');
    I.see('With Location');
    I.click(appointment);
    I.waitForText('Simple Single Appointment', 5, '.io-ox-sidepopup h1.subject');
    I.see('Thu, 12/1/2016', sidePopup);
    I.see('4:30', sidePopup);
    I.see('5:30 PM', sidePopup);
    I.see('With Location', sidePopup);
    I.see('And Description', sidePopup);
    // close popup
    I.click({ css: '#io-ox-appcontrol' });
    I.waitForDetached('.io-ox-sidepopup');
}
examples.add(['[C104270] Import App Suite iCal', 'appsuite-783_basic_appointment', basic_appointment_assertions]);
examples.add(['[C104270] Import App Suite iCal', 'appsuite-783_two_appointments', function (I) {
    basic_appointment_assertions(I);

    I.waitForText('All-day Appointment', 5, fulltime + ' .title');
    I.click(fulltime);
    I.waitForText('All-day Appointment', 5, '.io-ox-sidepopup h1.subject');
    I.see('Wed, 11/30/2016', sidePopup);
    I.see('Whole day', sidePopup);
}]);
examples.add(['[C104270] Import App Suite iCal', 'appsuite-783_recurring_appointment', function (I) {
    I.waitForText('Recurring appointment', 5, appointment + ' .title');
    I.seeNumberOfElements(appointment, 5);
    I.click(appointment);
    I.waitForText('Recurring appointment', 5, '.io-ox-sidepopup h1.subject');
    I.see('Sun, 11/27/2016', sidePopup);
    I.see('1:30', sidePopup);
    I.see('2:30 PM', sidePopup);
    I.see('Every day. The series ends after 5 occurrences.', sidePopup);
}]);

examples.add(['[C104279] Import Outlook iCal', 'outlook_2013_en_simple', function (I) {
    I.waitForText('Simple', 5, appointment + ' .title');
    I.click(appointment);
    I.waitForText('Simple', 5, '.io-ox-sidepopup h1.subject');
    I.see('Thu, 12/1/2016', sidePopup);
    I.see('11:30', sidePopup);
    I.see('12:30 PM', sidePopup);
}]);
examples.add(['[C104279] Import Outlook iCal', 'outlook_2013_en_allday', function (I) {
    I.waitForText('All day', 5, fulltimeFree + ' .title');
    I.click(fulltimeFree);
    I.waitForText('All day', 5, '.io-ox-sidepopup h1.subject');
    I.see('Wed, 11/30/2016', sidePopup);
    I.see('Whole day', sidePopup);
}]);
examples.add(['[C104279] Import Outlook iCal', 'outlook_2013_en_recurring', function (I) {
    I.waitForText('Recurring', 5, appointment + ' .title');
    I.click(appointment);
    I.waitForText('Recurring', 5, '.io-ox-sidepopup h1.subject');
    I.see('Tue, 11/29/2016', sidePopup);
    I.see('10:00', sidePopup);
    I.see('10:30 AM', sidePopup);
    I.see('Every day. The series ends after 5 occurrences.', sidePopup);
}]);
examples.add(['[C104279] Import Outlook iCal', 'outlook_2013_en_full', function (I) {
    I.waitForText('Busy', 5, appointment + ' .title');
    I.seeNumberOfElements(appointment, 6);
    I.click(appointment);
    I.waitForText('Busy', 5, '.io-ox-sidepopup h1.subject');
}]);

examples.add(['[C104295] Import Apple Calendar iCal', 'macos_1011_simple', function (I) {
    I.waitForText('Simple', 5, appointment + ' .title');
    I.click(appointment);
    I.waitForText('Simple', 5, '.io-ox-sidepopup h1.subject');
    I.see('Fri, 12/2/2016', sidePopup);
    I.see('2:00', sidePopup);
    I.see('3:00 PM', sidePopup);
}]);
examples.add(['[C104295] Import Apple Calendar iCal', 'macos_1011_allday', function (I) {
    I.waitForText('All day!', 5, fulltimeFree + ' .title');
    I.click(fulltimeFree);
    I.waitForText('All day!', 5, '.io-ox-sidepopup h1.subject');
    I.see('Wed, 11/30/2016', sidePopup);
    I.see('Whole day', sidePopup);
}]);
examples.add(['[C104295] Import Apple Calendar iCal', 'macos_1011_recurring', function (I) {
    I.waitForText('Recurring', 5, appointment + ' .title');
    I.click(appointment);
    I.waitForText('Recurring', 5, '.io-ox-sidepopup h1.subject');
    I.see('Tue, 11/29/2016', sidePopup);
    I.see('11:45', sidePopup);
    I.see('12:45 PM', sidePopup);
    I.see('Every day. The series ends after 5 occurrences.', sidePopup);
}]);
examples.add(['[C104295] Import Apple Calendar iCal', 'macos_1011_full', function (I) {
    I.waitForText('Recurring', 5, appointment + ' .title');
    I.seeNumberOfElements(appointment, 6);
    I.seeNumberOfElements(fulltimeFree, 1);
}]);

examples.add(['[C104301] Import Outlook.com iCal', 'outlookcom_2016_simple', function (I) {
    I.waitForText('Simple', 5, appointment + ' .title');
    I.click(appointment);
    I.waitForText('Simple', 5, '.io-ox-sidepopup h1.subject');
    I.see('Thu, 12/1/2016', sidePopup);
    I.see('3:30', sidePopup);
    I.see('4:00 PM', sidePopup);
    I.see('Some line\n\nbräiks');
}]);
examples.add(['[C104301] Import Outlook.com iCal', 'outlookcom_2016_allday', function (I) {
    I.waitForText('All-day', 5, fulltimeFree + ' .title');
    I.click(fulltimeFree);
    I.waitForText('All-day', 5, '.io-ox-sidepopup h1.subject');
    I.see('Tue, 11/29/2016', sidePopup);
    I.see('Somewhere', sidePopup);
    I.see('Whole day', sidePopup);
}]);
examples.add(['[C104301] Import Outlook.com iCal', 'outlookcom_2016_recurring', function (I) {
    I.waitForText('Recurring', 5, appointment + ' .title');
    I.seeNumberOfElements(appointment, 5);
    I.click(appointment);
    I.waitForText('Recurring', 5, '.io-ox-sidepopup h1.subject');
    I.see('Mon, 11/28/2016', sidePopup);
    I.see('1:30', sidePopup);
    I.see('2:00 PM', sidePopup);
    I.see('Every day. The series ends on 12/2/2016.', sidePopup);
}]);

examples.add(['[C104299] Import Google iCal', 'google_2016_simple', function (I) {
    I.waitForText('Simple', 5, appointment + ' .title');
    I.click(appointment);
    I.waitForText('Simple', 5, '.io-ox-sidepopup h1.subject');
    I.see('Fri, 12/2/2016', sidePopup);
    I.see('2:30', sidePopup);
    I.see('4:00 PM', sidePopup);
}]);
examples.add(['[C104299] Import Google iCal', 'google_2016_allday', function (I) {
    I.waitForText('All-day', 5, fulltimeFree + ' .title');
    I.click(fulltimeFree);
    I.waitForText('All-day', 5, '.io-ox-sidepopup h1.subject');
    I.see('Wed, 11/30/2016', sidePopup);
    I.see('Whole day', sidePopup);
}]);
examples.add(['[C104299] Import Google iCal', 'google_2016_recurring', function (I) {
    I.waitForText('Recurring', 5, appointment + ' .title');
    I.seeNumberOfElements(appointment, 5);
    I.click(appointment);
    I.waitForText('Recurring', 5, '.io-ox-sidepopup h1.subject');
    I.see('Tue, 11/29/2016', sidePopup);
    I.see('12:30', sidePopup);
    I.see('1:30 PM', sidePopup);
    I.see('Every day. The series ends after 5 occurrences.', sidePopup);
}]);
examples.add(['[C104299] Import Google iCal', 'google_2016_full', function (I) {
    I.waitForText('Recurring', 5, appointment + ' .title');
    I.seeNumberOfElements(appointment, 6);
    I.seeNumberOfElements(fulltimeFree, 1);
}]);

examples.add(['[C104292] Import Thunderbird iCal', 'thunderbird_45_simple', function (I) {
    I.waitForText('Simple', 5, appointment + ' .title');
    I.click(appointment);
    I.waitForText('Simple', 5, '.io-ox-sidepopup h1.subject');
    I.see('Fri, 12/2/2016', sidePopup);
    I.see('1:00', sidePopup);
    I.see('2:00 PM', sidePopup);
}]);
examples.add(['[C104292] Import Thunderbird iCal', 'thunderbird_45_allday', function (I) {
    I.waitForText('All-day', 5, fulltimeFree + ' .title');
    I.click(fulltimeFree);
    I.waitForText('All-day', 5, '.io-ox-sidepopup h1.subject');
    I.see('Wed, 11/30/2016', sidePopup);
    I.see('Whole day', sidePopup);
}]);
examples.add(['[C104292] Import Thunderbird iCal', 'thunderbird_45_recurring', function (I) {
    I.waitForText('Recurring', 5, appointment + ' .title');
    I.seeNumberOfElements(appointment, 4);
    I.click(appointment);
    I.waitForText('Recurring', 5, '.io-ox-sidepopup h1.subject');
    I.see('Some Description\n\nLala');
    I.see('Tue, 11/29/2016', sidePopup);
    I.see('10:30', sidePopup);
    I.see('11:30 AM', sidePopup);
    I.see('Every day. The series ends on 12/2/2016.', sidePopup);
}]);
examples.add(['[C104292] Import Thunderbird iCal', 'thunderbird_45_full', function (I) {
    I.waitForText('Recurring', 5, appointment + ' .title');
    I.seeNumberOfElements(appointment, 5);
    I.seeNumberOfElements(fulltimeFree, 1);
}]);

examples.add(['[C104276] Import emClient iCal', 'emclient_7', function (I) {
    I.waitForElement(locate('.title').withText('Simple appointment').inside(appointment));
    I.seeNumberOfElements(appointment, 6);
    I.seeNumberOfElements(fulltime, 1);
    I.click(locate(appointment).withText('Simple appointment'));
    I.waitForText('Simple appointment', 5, '.io-ox-sidepopup h1.subject');
    I.see('Thu, 12/1/2016', sidePopup);
    I.see('12:00', sidePopup);
    I.see('1:00 PM', sidePopup);
}]);

examples.add(['[C104276] Import emClient iCal', 'yahoo_2016_simple', function (I) {
    I.waitForText('Simple', 5, appointment + ' .title');
    I.click(appointment);
    I.waitForText('Simple', 5, '.io-ox-sidepopup h1.subject');
    I.see('Fri, 12/2/2016', sidePopup);
    I.see('3:00', sidePopup);
    I.see('3:30 PM', sidePopup);
}]);
examples.add(['[C104276] Import emClient iCal', 'yahoo_2016_allday', function (I) {
    I.waitForText('All-day', 5, fulltime + ' .title');
    I.click(fulltime);
    I.waitForText('All-day', 5, '.io-ox-sidepopup h1.subject');
    I.see('Somewhere', sidePopup);
    I.see('Wed, 11/30/2016', sidePopup);
    I.see('Whole day', sidePopup);
}]);
examples.add(['[C104276] Import emClient iCal', 'yahoo_2016_recurring', function (I) {
    I.waitForText('Recurring', 5, appointment + ' .title');
    I.click(appointment);
    I.waitForText('Recurring', 5, '.io-ox-sidepopup h1.subject');
    I.see('Tue, 11/29/2016', sidePopup);
    I.see('2:30', sidePopup);
    I.see('3:00 PM', sidePopup);
}]);
examples.add(['[C104276] Import emClient iCal', 'yahoo_2016_full', function (I) {
    I.waitForText('Recurring', 5, appointment + ' .title');
    I.seeNumberOfElements(appointment, 6);
    I.seeNumberOfElements(fulltime, 1);
}]);

Data(examples).Scenario('Import Calendar data', async ({ I, current, users, dialogs }) => {
    I.login('app=io.ox/calendar&perspective=week:week');
    I.waitForText('My calendars');
    I.waitForText('Birthdays');
    // go to 2016-11-27
    I.executeScript(function gotoDate(t) { ox.ui.App.getCurrentApp().setDate(t); }, 1480201200000);
    const folderName = `${users[0].get('sur_name')}, ${users[0].get('given_name')}`;
    I.waitForVisible(
        locate('.folder.selected .folder-label')
            .withText(folderName)
    );
    I.click(`.folder-options[title="Actions for ${folderName}"]`);
    I.waitForElement(locate('.dropdown.open').withText('Import'));
    I.wait(0.2);
    I.retry(3).click('Import');
    dialogs.waitForVisible();
    I.attachFile('.file-input', `e2e/media/imports/calendar/${current.filename}.ics`);
    dialogs.clickButton('Import');
    I.waitForText('Data imported successfully', 30, '.io-ox-alert');
    I.waitToHide('.io-ox-alert');

    current.assertions(I);
});
