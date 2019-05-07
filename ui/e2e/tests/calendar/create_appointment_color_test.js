/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Maik Schäfer <maik.schaefer@open-xchange.com>
 *
 */

/// <reference path="../../steps.d.ts" />

const expect = require('chai').expect;
Feature('Calendar Create');

Before(async (users) => {
    await users.create();
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});

//helper function for creating appointments, added ability to select color
let uncurriedCreateAppointment = (I) => ({ subject, folder, startTime, color }) => {
    // select calendar
    I.clickToolbar('New');
    I.waitForText('Appointments in public calendar');
    I.click('Create in public calendar');
    I.waitForVisible('.io-ox-calendar-edit-window');
    I.fillField('Subject', subject);
    I.see(folder, '.io-ox-calendar-edit-window .folder-selection');
    if (startTime) {
        I.click('~Start time');
        I.click(startTime);
    }
    if (color) {
        I.click('Appointment color');
        I.waitForVisible('.io-ox-calendar-color-picker-container');
        I.click(locate('a')
            .inside('.smart-dropdown-container.dropdown.open')
                .withAttr({ title: color }));
    }

    // save
    I.click('Create', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);
};

Scenario('[C264519] Create appointments with colors in public folder', async function (I, users) {

    let [user_a, user_b] = users;
    let selectInsideFolder = (node) => locate(node)
            .inside(locate('div.folder-node')
                    .withAttr({ title: 'New calendar' })
            );

    const createAppointment = uncurriedCreateAppointment(I);

    //login user a
    I.login('app=io.ox/calendar', { user: user_a });
    I.waitForText('Add new calendar');
    // add new public calendar
    I.click('Add new calendar');
    I.waitForText('Personal calendar');
    I.click('Personal calendar');
    I.waitForVisible('.modal-body');
    I.checkOption('Add as public calendar');
    I.click('Add');
    I.waitForVisible('#io-ox-core');
    I.wait(1);
    // give user b permissions
    I.click('.fa.fa-caret-right');
    I.selectFolder('New calendar');
    I.click(selectInsideFolder('a'));
    I.waitForText('Permissions');
    I.click('Permissions');
    I.waitForFocus('.form-control.tt-input');
    I.fillField('.form-control.tt-input', user_b.get('primaryEmail'));
    I.pressKey('Enter');
    I.click('Save');
    //create 2 test appointments with different colors
    createAppointment({ subject: 'testing is fun', folder: 'New calendar', startTime: '8:00', color: 'dark green' });
    createAppointment({ subject: 'testing is awesome', folder: 'New calendar', startTime: '10:00', color: 'dark cyan' });
    I.logout();
    //login user b
    I.waitForVisible('#io-ox-login-screen');
    I.login('app=io.ox/calendar', { user: user_b });
    I.click('.fa.fa-caret-right');
    I.selectFolder('New calendar');
    I.click(selectInsideFolder('div.color-label'));
    //check if public appointments are there
    I.see('testing is fun', '.workweek .appointment .title-container');
    I.see('testing is awesome', '.workweek .appointment .title-container');
    //see if appointment colors are still the standard folder color
    const [folderColor] = await I.grabCssPropertyFrom(selectInsideFolder('div.color-label'), 'background-color');
    let [appointmentColor] = await I.grabCssPropertyFrom('.workweek .appointment', 'background-color');
    expect(folderColor).equal(appointmentColor);
});
