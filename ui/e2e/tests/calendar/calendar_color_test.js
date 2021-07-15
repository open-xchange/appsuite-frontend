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

const expect = require('chai').expect;
const moment = require('moment');

Feature('Calendar');

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

Scenario('Create appointment and check if the color is correctly applied and removed', async function ({ I, users, calendar }) {
    const time = moment().startOf('week').add(1, 'day').add(16, 'hours');
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
    I.click('test appointment one', '.workweek .appointment .title');
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
    const time = moment().startOf('week').add(1, 'day').add(16, 'hours');
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
