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

const expect = require('chai').expect;
const moment = require('moment');

Feature('Calendar');

Before(async function ({ users }) {
    await Promise.all([
        users.create(),
        users.create()
    ]);
});

After(async function ({ users }) {
    await users.removeAll();
});

Scenario('Create appointment and check if the color is correctly applied and removed', async function ({ I, users, calendar }) {
    const time = moment().startOf('isoWeek').add(16, 'hours');
    const format = 'YYYYMMDD[T]HHmmss';
    await I.haveAppointment({
        folder: await calendar.defaultFolder(),
        summary: 'test appointment one',
        startDate: { tzid: 'Europe/Berlin', value: time.format(format) },
        endDate:   { tzid: 'Europe/Berlin', value: time.add(1, 'hour').format(format) }
    });

    I.login('app=io.ox/calendar&perspective="week:workweek"');
    calendar.waitForApp();
    I.waitForText('test appointment one', 5, '.workweek');
    I.see('test appointment one', '.workweek .appointment .title');

    I.seeNumberOfElements('.workweek .appointment .title', 1);

    I.say('Get colors #1');
    // get folder color
    const folderColor = await I.grabCssPropertyFrom('li.selected[aria-label^="' + users[0].userdata.sur_name + ', ' + users[0].userdata.given_name + '"] .color-label', 'background-color');
    // get appointment color
    let appointmentColor = await I.grabCssPropertyFrom('.workweek .appointment', 'background-color');
    // check if the color is the same

    expect(folderColor).equal(appointmentColor);

    I.say('Change color');
    I.click('test appointment one', '.workweek .appointment .title');
    I.waitForVisible('.io-ox-sidepopup [data-action="io.ox/calendar/detail/actions/edit"]');
    I.click('Edit', '.io-ox-sidepopup');
    I.waitForVisible('.io-ox-calendar-edit-window');
    I.retry(5).click('Appointment color', '.color-picker-dropdown');
    I.click('dark red');
    I.click('Save', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    I.say('Get colors #2');
    // get appointment color
    appointmentColor = await I.grabCssPropertyFrom('.workweek .appointment', 'background-color');
    // check if the color is the same
    expect(folderColor).not.equal(appointmentColor);
    // the color might differ if the appointment has .hover class which is not predictable
    expect(appointmentColor).be.oneOf(['rgb(181, 54, 54)', 'rgb(200, 70, 70)']);

    I.say('Change color back to folder color');
    I.waitForText('Edit', 5, '.io-ox-sidepopup');
    I.click('Edit', '.io-ox-sidepopup');
    I.waitForVisible('.io-ox-calendar-edit-window');
    I.retry(5).click('Appointment color', '.color-picker-dropdown');
    I.click('Use calendar color');
    I.click('Save', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    I.say('Get colors #3');
    // get appointment color
    appointmentColor = await I.grabCssPropertyFrom('.workweek .appointment', 'background-color');
    // check if the color is the same
    expect(folderColor).equal(appointmentColor);
    expect(appointmentColor).not.to.be.oneOf(['rgb(181, 54, 54, 1)', 'rgb(200, 70, 70, 1)']);

});

Scenario('Changing calendar color should change appointment color that uses calendar color', async function ({ I, users, calendar }) {
    const folder = await calendar.defaultFolder();
    const time = moment().startOf('isoWeek').add(16, 'hours');
    const format = 'YYYYMMDD[T]HHmmss';
    await Promise.all([
        I.haveAppointment({
            folder,
            summary: 'test appointment one',
            startDate: { tzid: 'Europe/Berlin', value: time.format(format) },
            endDate:   { tzid: 'Europe/Berlin', value: time.add(1, 'hour').format(format) }
        }),
        I.haveAppointment({
            folder,
            summary: 'test appointment two',
            startDate: { tzid: 'Europe/Berlin', value: time.format(format) },
            endDate:   { tzid: 'Europe/Berlin', value: time.add(1, 'hour').format(format) }
        })
    ]);

    I.login('app=io.ox/calendar&perspective="week:workweek"');
    calendar.waitForApp();
    I.say('Check colors');
    I.waitForText('test appointment one', 5, '.workweek');
    I.waitForText('test appointment two', 5, '.workweek');
    I.seeNumberOfElements('.workweek .appointment .title', 2);

    I.say('Change color of first appointment');
    I.click('test appointment one', '.workweek .appointment .title');
    I.waitForVisible('.io-ox-sidepopup [data-action="io.ox/calendar/detail/actions/edit"]');
    I.click('Edit', '.io-ox-sidepopup');
    I.waitForVisible('.io-ox-calendar-edit-window');
    I.retry(5).click('Appointment color', '.color-picker-dropdown');
    const darkRed = await I.grabCssPropertyFrom({ css: 'a[title="dark red"] > i' }, 'background-color');
    I.click('dark red');
    I.click('Save', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    I.say('Change calendar color to dark green');
    I.click('.folder-options');
    I.waitForVisible('.io-ox-calendar-color-picker-container a[title="dark green"]');
    const darkGreen = await I.grabCssPropertyFrom({ css: 'a[title="dark green"] > i' }, 'background-color');
    I.say(darkGreen);
    I.click('dark green');
    I.waitForDetached('.dropdown.open');
    I.waitForText('test appointment one', 5, '.workweek');

    I.say('Check correctly applied colors');
    // wait long enough for color transition to finish
    I.wait(1);
    // get folder color
    const folderColor = await I.grabCssPropertyFrom({ css: 'li.selected[aria-label^="' + users[0].userdata.sur_name + ', ' + users[0].userdata.given_name + '"] .color-label' }, 'background-color');
    // get appointment colors
    const appointmentOneColor = await I.grabCssPropertyFrom('.workweek .appointment[aria-label*="test appointment one"]', 'background-color');
    const appointmentTwoColor = await I.grabCssPropertyFrom('.workweek .appointment[aria-label*="test appointment two"]', 'background-color');
    I.say(`appointmentOneColor: ${appointmentOneColor}`);
    I.say(`appointmentTwoColor: ${appointmentTwoColor}`);
    expect(folderColor, 'folderColor equals darkGreen').equal(darkGreen);
    expect(appointmentOneColor, 'appointment one color equals darkRed').be.oneOf([darkRed, 'rgb(188, 56, 56)']);
    expect(appointmentTwoColor, 'appointment two color equals darkGreen').be.oneOf([darkGreen, 'rgb(49, 93, 34)']);
});

Scenario('Check appointment colors of appointments the user got invited to', async function ({ I, users, calendar, dialogs }) {
    I.login('app=io.ox/calendar&perspective="week:workweek"');
    const greyColor = 'rgb(197, 197, 197)';
    const blueColor = 'rgb(207, 230, 255)';

    calendar.newAppointment();
    I.fillField('Subject', 'Test Appointment');
    I.fillField(calendar.locators.starttime, '12:00 PM');
    I.fillField('Add contact/resource', users[1].userdata.primaryEmail);
    I.checkOption('attendeePrivileges');
    I.retry(5).click('Appointment color', '.color-picker-dropdown');
    I.click('a[title="green"]');
    I.click('Create');
    I.waitForDetached('.io-ox-calendar-edit-window');

    I.logout();

    I.login('app=io.ox/calendar&perspective="week:workweek"', { user: users[1] });

    I.waitForText('Test Appointment');
    I.click('~Test Appointment');
    I.waitForText('Accept', 5, '.io-ox-sidepopup');
    I.click('Accept', '.io-ox-sidepopup');
    I.click('Edit', '.io-ox-sidepopup');
    I.waitForElement('button.disabled', 5, '.io-ox-calendar-edit-window .color-picker-dropdown');
    I.waitForElement('.picked-color', 5, '.io-ox-calendar-edit-window .color-picker-dropdown');
    const color = await I.grabCssPropertyFrom('.picked-color', 'background-color');
    expect(color).be.equal(greyColor);
    I.click('Discard', '.io-ox-calendar-edit-window');
    I.waitForText('Discard changes');
    dialogs.clickButton('Discard changes');
    I.waitForDetached('.modal-dialog');
    I.waitForDetached('.io-ox-calendar-edit-window');
    I.click('~Close', '.io-ox-sidepopup');
    I.waitForDetached('.io-ox-sidepopup');

    const appointmentColor = await I.grabCssPropertyFrom('div[aria-label*="Test Appointment"]', 'background-color');
    expect(appointmentColor).be.equal(blueColor);
});

Scenario('Check appointment colors of public calendar appointments the user got invited to', async function ({ I, users, calendar, dialogs }) {
    const redColor = 'rgb(245, 170, 170)';
    const greenColor = 'rgb(175, 221, 160)';

    await session('Alice', async () => {
        I.login('app=io.ox/calendar&perspective="week:workweek"', { user: users[0] });

        I.say('Create a new public calendar that gets shared with user B');
        I.waitForText('Add new calendar', 5, '.folder-tree');
        I.click('Add new calendar', '.folder-tree');
        I.clickDropdown('Personal calendar');
        dialogs.waitForVisible();
        I.waitForText('Add as public calendar', 5, dialogs.locators.body);
        I.checkOption('Add as public calendar', dialogs.locators.body);
        dialogs.clickButton('Add');
        I.waitForDetached('.modal-dialog');
        I.say('Grant permission to user b');
        I.click(locate('.folder-arrow').inside('~Public calendars'));
        I.rightClick('~New calendar');
        I.wait(0.2); // wait for listeners
        I.clickDropdown('Share / Permissions');
        dialogs.waitForVisible();
        I.waitForElement('.form-control.tt-input', 5);
        I.fillField('.form-control.tt-input', users[1].get('primaryEmail'));
        I.pressKey('Enter');
        I.click('button[title="Current role"]', '.supports-personal-shares');
        I.clickDropdown('Author');
        dialogs.clickButton('Save');
        I.waitForDetached('.modal-dialog');

        I.say('Create a new appointment in the public calendar and invite user B');
        I.clickToolbar('New appointment');
        I.waitForText('Appointments in public calendars');
        dialogs.clickButton('Create in public calendar');
        I.waitForDetached('.modal-dialog');
        I.waitForVisible('.io-ox-calendar-edit-window');
        I.waitForFocus('.io-ox-calendar-edit-window input[type="text"][name="summary"]');
        I.fillField('Subject', 'Test Appointment');
        I.fillField(calendar.locators.starttime, '12:00 PM');
        I.fillField('Add contact/resource', users[1].userdata.primaryEmail);
        I.retry(5).click('Appointment color', '.color-picker-dropdown');
        I.click('.color-picker-dropdown.open a[title="red"]');
        I.click('Create');
        I.waitForDetached('.io-ox-calendar-edit-window');
    });

    await session('Bob', async () => {
        I.login('app=io.ox/calendar&perspective="week:workweek"', { user: users[1] });

        I.waitForText('Test Appointment');

        I.say('Check appointment');
        I.click('~Test Appointment');
        I.waitForText('Accept', 5, '.io-ox-sidepopup');
        I.click('Accept', '.io-ox-sidepopup');
        I.click('~Close', '.io-ox-sidepopup');
        I.waitForDetached('.io-ox-sidepopup');
        I.wait(0.2);

        const appointmentColorBefore = await I.grabCssPropertyFrom('div[aria-label*="Test Appointment"]', 'background-color');
        expect(appointmentColorBefore).be.equal(redColor);

        I.click('~Test Appointment');
        I.waitForText('Edit', 5, '.io-ox-sidepopup');
        I.click('Edit', '.io-ox-sidepopup');
        I.waitForElement('.picked-color', 5, '.io-ox-calendar-edit-window .color-picker-dropdown');
        const color = await I.grabCssPropertyFrom('.picked-color', 'background-color');
        expect(color).be.equal(redColor);
        I.click('.picked-color', '.io-ox-calendar-edit-window .color-picker-dropdown');
        I.click('.color-picker-dropdown.open a[title="green"]');
        I.click('Save', '.io-ox-calendar-edit-window');
        I.waitForDetached('.io-ox-calendar-edit-window');
        I.click('~Close', '.io-ox-sidepopup');
        I.waitForDetached('.io-ox-sidepopup');
        I.wait(0.2);

        const appointmentColorAfter = await I.grabCssPropertyFrom('div[aria-label*="Test Appointment"]', 'background-color');
        expect(appointmentColorAfter).be.equal(greenColor);
    });
});
