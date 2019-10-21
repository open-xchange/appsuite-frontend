/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2018 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Björn Köster <bjoern.koester@open-xchange.com>
 */

const expect = require('chai').expect;
const moment = require('moment');

Feature('Calendar');

Before(async function (users) {
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

Scenario('Create appointment and check if the color is correctly applied and removed', async function (I, users) {
    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true }
    });
    const folder = `cal://0/${await I.grabDefaultFolder('calendar')}`;
    const time = moment().startOf('week').add(1, 'day').add(16, 'hours');
    const format = 'YYYYMMDD[T]HHmmss';
    await I.haveAppointment({
        folder: folder,
        summary: 'test appointment one',
        startDate: { value: time.format(format), tzid: 'Europe/Berlin' },
        endDate: { value: time.add(1, 'hour').format(format), tzid: 'Europe/Berlin' }
    });

    I.login('app=io.ox/calendar');
    I.waitForVisible({ css: '[data-app-name="io.ox/calendar"]' }, 5);

    I.clickToolbar('View');
    I.click('Workweek');

    // check in Workweek view
    I.clickToolbar('View');
    I.click('Workweek');
    I.waitForText('test appointment one', 5, '.workweek');
    I.see('test appointment one', '.workweek .appointment .title');

    I.seeNumberOfElements('.workweek .appointment .title', 1);

    // get folder color
    const [folderColor] = await I.grabCssPropertyFrom('li.selected[aria-label="' + users[0].userdata.sur_name + ', ' + users[0].userdata.given_name + '"] .color-label', 'background-color');
    // get appointment color
    let [appointmentColor] = await I.grabCssPropertyFrom('.workweek .appointment', 'background-color');
    // check if the color is the same
    expect(folderColor).equal(appointmentColor);

    // change color
    I.click('test appointment one', '.workweek .appointment .title');
    I.waitForVisible('.io-ox-sidepopup [data-action="io.ox/calendar/detail/actions/edit"]');
    I.click('Edit', '.io-ox-sidepopup');
    I.waitForVisible('.io-ox-calendar-edit-window');
    I.click('Appointment color', '.color-picker-dropdown');
    I.click('dark red');
    I.click('Save', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    // get appointment color
    [appointmentColor] = await I.grabCssPropertyFrom('.workweek .appointment', 'background-color');
    // check if the color is the same
    expect(folderColor).not.equal(appointmentColor);
    // the color might differ if the appointment has .hover class which is not predictable
    expect(appointmentColor).be.oneOf(['rgba(181, 54, 54, 1)', 'rgba(200, 70, 70, 1)']);

    // change color back to folder color
    I.click('test appointment one', '.workweek .appointment .title');
    I.waitForText('Edit', 5, '.io-ox-sidepopup');
    I.click('Edit', '.io-ox-sidepopup');
    I.waitForVisible('.io-ox-calendar-edit-window');
    I.click('Appointment color', '.color-picker-dropdown');
    I.click('Use calendar color');
    I.click('Save', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    // get appointment color
    [appointmentColor] = await I.grabCssPropertyFrom('.workweek .appointment', 'background-color');
    // check if the color is the same
    expect(folderColor).equal(appointmentColor);
    expect(appointmentColor).not.to.be.oneOf(['rgba(181, 54, 54, 1)', 'rgba(200, 70, 70, 1)']);

    // remove
    I.click('test appointment one', '.workweek .appointment .title');
    I.waitForText('Delete', 5, '.io-ox-sidepopup');
    I.click('Delete', '.io-ox-sidepopup');
    I.waitForText('Delete', 5, '.modal-dialog');
    I.click('Delete', '.modal-dialog');
    I.waitForDetached('.modal-dialog');
    I.waitForDetached('.io-ox-dialog-sidepopup');

    I.logout();

});

Scenario('Changing calendar color should change appointment color that uses calendar color', async function (I, users) {
    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true }
    });
    const folder = `cal://0/${await I.grabDefaultFolder('calendar')}`;
    const time = moment().startOf('week').add(1, 'day').add(16, 'hours');
    const format = 'YYYYMMDD[T]HHmmss';
    await I.haveAppointment({
        folder: folder,
        summary: 'test appointment one',
        startDate: { value: time.format(format), tzid: 'Europe/Berlin' },
        endDate: { value: time.add(1, 'hour').format(format), tzid: 'Europe/Berlin' }
    });
    await I.haveAppointment({
        folder: folder,
        summary: 'test appointment two',
        startDate: { value: time.format(format), tzid: 'Europe/Berlin' },
        endDate: { value: time.add(1, 'hour').format(format), tzid: 'Europe/Berlin' }
    });

    I.login('app=io.ox/calendar');
    I.waitForVisible({ css: '[data-app-name="io.ox/calendar"]' }, 5);

    I.clickToolbar('View');
    I.click('Workweek');

    // check
    I.see('test appointment one', '.workweek .appointment .title');
    I.see('test appointment two', '.workweek .appointment .title');
    I.seeNumberOfElements('.workweek .appointment .title', 2);

    // change color of first appointment
    I.click('test appointment one', '.workweek .appointment .title');
    I.waitForVisible('.io-ox-sidepopup [data-action="io.ox/calendar/detail/actions/edit"]');
    I.click('Edit', '.io-ox-sidepopup');
    I.waitForVisible('.io-ox-calendar-edit-window');
    I.click('Appointment color', '.color-picker-dropdown');
    const [darkRed] = await I.grabCssPropertyFrom({ css: 'a[title="dark red"] > i' }, 'background-color');
    I.click('dark red');
    I.click('Save', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    // change calendar color to dark green
    I.click('.folder-options');
    const [darkGreen] = await I.grabCssPropertyFrom({ css: 'a[title="dark green"] > i' }, 'background-color');
    I.click('dark green');

    // click some stuff
    I.clickToolbar('View');
    I.click('Workweek');
    I.waitForText('test appointment one', 5, '.workweek');

    // get folder color
    const [folderColor] = await I.grabCssPropertyFrom({ css: 'li.selected[aria-label="' + users[0].userdata.sur_name + ', ' + users[0].userdata.given_name + '"] .color-label' }, 'background-color');
    // get appointment colors
    const [appointmentOneColor] = await I.grabCssPropertyFrom('.workweek .appointment[aria-label*="test appointment one"]', 'background-color');
    const [appointmentTwoColor] = await I.grabCssPropertyFrom('.workweek .appointment[aria-label*="test appointment two"]', 'background-color');
    // check if the colors are correctly applied
    expect(folderColor, 'folderColor equals darkGreen').equal(darkGreen);
    expect(appointmentOneColor, 'appointment one color equals darkRed').equal(darkRed);
    expect(appointmentTwoColor, 'appointment two color equals darkGreen').equal(darkGreen);

    I.logout();

});
