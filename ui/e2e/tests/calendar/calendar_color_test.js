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

Feature('Calendar: Colors');

Before(async function (users) {
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

Scenario('Create appointment and check if the color is correctly applied and removed', async function (I, users) {
    I.haveSetting('io.ox/core//autoOpenNotification', false);
    I.haveSetting('io.ox/core//showDesktopNotifications', false);
    I.haveSetting('io.ox/calendar//showCheckboxes', true);

    I.login('app=io.ox/calendar');
    I.waitForVisible('[data-app-name="io.ox/calendar"]', 5);

    I.selectFolder(users[0].userdata.sur_name + ', ' + users[0].userdata.given_name);
    I.clickToolbar('View');
    I.click('Workweek');

    I.click('button[aria-label="Next Week"]');

    // create in Workweek view
    I.clickToolbar('New');
    I.waitForVisible('.io-ox-calendar-edit-window');

    I.fillField('Subject', 'test appointment one');
    I.fillField('Location', 'invite location');
    I.see(users[0].userdata.sur_name + ', ' + users[0].userdata.given_name, '.io-ox-calendar-edit-window .window-body .folder-selection .dropdown-toggle');

    I.click('~Start time');
    I.click('4:00 PM');

    // save
    I.click('Create', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    // check in Workweek view
    I.clickToolbar('View');
    I.click('Workweek');
    I.see('test appointment one', '.workweek .appointment .title');

    I.seeNumberOfElements('.workweek .appointment .title', 1);

    // get folder color
    let folderColor = await I.grabCssPropertyFrom('li.selected[aria-label="' + users[0].userdata.sur_name + ', ' + users[0].userdata.given_name + '"] .color-label', 'background-color');
    // get appointment color
    let appointmentColor = await I.grabCssPropertyFrom('.workweek .appointment', 'background-color');
    // check if the color is the same
    expect(folderColor).equal(appointmentColor);

    // change color
    I.click('test appointment one', '.workweek');
    I.waitForVisible('.io-ox-sidepopup [data-action="edit"]');
    I.click('Edit', '.io-ox-sidepopup');
    I.waitForVisible('.io-ox-calendar-edit-window');
    I.click('Appointment color');
    let darkRed = await I.grabCssPropertyFrom(locate('i').before(locate('span').withText('dark red')), 'background-color');
    I.click('dark red');
    I.click('Save', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    // get appointment color
    appointmentColor = await I.grabCssPropertyFrom('.workweek .appointment', 'background-color');
    // check if the color is the same
    expect(folderColor).not.equal(appointmentColor);
    expect(appointmentColor).equal(darkRed);

    // change color back to folder color
    I.click('test appointment one', '.workweek');
    I.waitForVisible('.io-ox-sidepopup [data-action="edit"]');
    I.click('Edit', '.io-ox-sidepopup');
    I.waitForVisible('.io-ox-calendar-edit-window');
    I.click('Appointment color');
    I.click('Use calendar color');
    I.click('Save', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    // get appointment color
    appointmentColor = await I.grabCssPropertyFrom('.workweek .appointment', 'background-color');
    // check if the color is the same
    expect(folderColor).equal(appointmentColor);
    expect(appointmentColor).not.equal(darkRed);

    // remove
    I.click('test appointment one', '.workweek');
    I.waitForVisible('.io-ox-sidepopup [data-action="delete"]');
    I.click('Delete', '.io-ox-sidepopup');
    I.waitForVisible('.io-ox-dialog-popup');
    I.click('Delete', '.io-ox-dialog-popup');
    I.waitForDetached('.io-ox-dialog-popup');

    I.logout();

});

Scenario('Changing calendar color should change appointment color that uses calendar color', async function (I, users) {
    I.haveSetting('io.ox/core//autoOpenNotification', false);
    I.haveSetting('io.ox/core//showDesktopNotifications', false);
    I.haveSetting('io.ox/calendar//showCheckboxes', true);

    I.login('app=io.ox/calendar');
    I.waitForVisible('[data-app-name="io.ox/calendar"]', 5);

    I.selectFolder(users[0].userdata.sur_name + ', ' + users[0].userdata.given_name);
    I.clickToolbar('View');
    I.click('Workweek');

    I.click('button[aria-label="Next Week"]');

    // create first appointment
    I.selectFolder(users[0].userdata.sur_name + ', ' + users[0].userdata.given_name);
    I.waitForElement('li.selected[aria-label="' + users[0].userdata.sur_name + ', ' + users[0].userdata.given_name + '"] .color-label');
    I.clickToolbar('New');
    I.waitForVisible('.io-ox-calendar-edit-window');

    I.fillField('Subject', 'test appointment one');
    I.fillField('Location', 'invite location');
    I.see(users[0].userdata.sur_name + ', ' + users[0].userdata.given_name, '.io-ox-calendar-edit-window .window-body .folder-selection .dropdown-toggle');
    I.click('~Start time');
    I.click('4:00 PM');

    // save
    I.click('Create', '.io-ox-calendar-edit-window');

    // create second appointment
    I.clickToolbar('New');
    I.waitForVisible('.io-ox-calendar-edit-window');

    I.fillField('Subject', 'test appointment two');
    I.fillField('Location', 'invite location');
    I.see(users[0].userdata.sur_name + ', ' + users[0].userdata.given_name, '.io-ox-calendar-edit-window .window-body .folder-selection .dropdown-toggle');

    I.click('~Start time');
    I.click('5:00 PM');

    // save
    I.click('Create', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    // check
    I.see('test appointment one', '.workweek .appointment .title');
    I.see('test appointment two', '.workweek .appointment .title');
    I.seeNumberOfElements('.workweek .appointment .title', 2);

    // change color of first appointment
    I.click('test appointment one', '.workweek');
    I.waitForVisible('.io-ox-sidepopup [data-action="edit"]');
    I.click('Edit', '.io-ox-sidepopup');
    I.waitForVisible('.io-ox-calendar-edit-window');
    I.click('Appointment color');
    let darkRed = await I.grabCssPropertyFrom(locate('i').before(locate('span').withText('dark red')), 'background-color');
    I.click('dark red');
    I.click('Save', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    // change calendar color to dark green
    I.click('.folder-options');
    let darkGreen = await I.grabCssPropertyFrom(locate('i').before(locate('span').withText('dark green')), 'background-color');
    I.click('dark green');

    // click some stuff
    I.clickToolbar('View');
    I.click('Workweek');

    // get folder color
    let folderColor = await I.grabCssPropertyFrom('li.selected[aria-label="' + users[0].userdata.sur_name + ', ' + users[0].userdata.given_name + '"] .color-label', 'background-color');
    // get appointment colors
    let appointmentOneColor = await I.grabCssPropertyFrom(locate('.workweek .appointment').withText('test appointment one'), 'background-color');
    let appointmentTwoColor = await I.grabCssPropertyFrom(locate('.workweek .appointment').withText('test appointment two'), 'background-color');
    // check if the colors are correctly applied
    expect(folderColor).equal(darkGreen);
    expect(appointmentOneColor).equal(darkRed);
    expect(appointmentTwoColor).equal(darkGreen);

    // remove
    I.click('test appointment one', '.workweek');
    I.waitForVisible('.io-ox-sidepopup [data-action="delete"]');
    I.click('Delete', '.io-ox-sidepopup');
    I.waitForVisible('.io-ox-dialog-popup');
    I.click('Delete', '.io-ox-dialog-popup');
    I.waitForDetached('.io-ox-dialog-popup');

    I.click('test appointment two', '.workweek');
    I.waitForVisible('.io-ox-sidepopup [data-action="delete"]');
    I.click('Delete', '.io-ox-sidepopup');
    I.waitForVisible('.io-ox-dialog-popup');
    I.click('Delete', '.io-ox-dialog-popup');
    I.waitForDetached('.io-ox-dialog-popup');

    I.logout();

});
