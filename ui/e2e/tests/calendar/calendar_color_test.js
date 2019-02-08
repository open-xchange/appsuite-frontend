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

    I.click('.page.current button[aria-label="Next Week"]');

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
    I.click('Appointment color');
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
    I.click('Appointment color');
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
    I.waitForText('Delete', 5, '.io-ox-dialog-popup');
    I.click('Delete', '.io-ox-dialog-popup');
    I.waitForDetached('.io-ox-dialog-popup');
    I.waitForDetached('.io-ox-dialog-sidepopup');

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

    I.click('.page.current button[aria-label="Next Week"]');

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

    // check
    I.see('test appointment one', '.workweek .appointment .title');
    I.see('test appointment two', '.workweek .appointment .title');
    I.seeNumberOfElements('.workweek .appointment .title', 2);

    // change color of first appointment
    I.click('test appointment one', '.workweek .appointment .title');
    I.waitForVisible('.io-ox-sidepopup [data-action="io.ox/calendar/detail/actions/edit"]');
    I.click('Edit', '.io-ox-sidepopup');
    I.waitForVisible('.io-ox-calendar-edit-window');
    I.click('Appointment color');
    const [darkRed] = await I.grabCssPropertyFrom('a[title="dark red"] > i', 'background-color');
    I.click('dark red');
    I.click('Save', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);

    // change calendar color to dark green
    I.click('.folder-options');
    const [darkGreen] = await I.grabCssPropertyFrom('a[title="dark green"] > i', 'background-color');
    I.click('dark green');

    // click some stuff
    I.clickToolbar('View');
    I.click('Workweek');
    I.waitForText('test appointment one', 5, '.workweek');

    // get folder color
    const [folderColor] = await I.grabCssPropertyFrom('li.selected[aria-label="' + users[0].userdata.sur_name + ', ' + users[0].userdata.given_name + '"] .color-label', 'background-color');
    // get appointment colors
    const [appointmentOneColor] = await I.grabCssPropertyFrom('.workweek .appointment[aria-label*="test appointment one"]', 'background-color');
    const [appointmentTwoColor] = await I.grabCssPropertyFrom('.workweek .appointment[aria-label*="test appointment two"]', 'background-color');
    // check if the colors are correctly applied
    expect(folderColor, 'folderColor equals darkGreen').equal(darkGreen);
    expect(appointmentOneColor, 'appointment one color equals darkRed').equal(darkRed);
    expect(appointmentTwoColor, 'appointment two color equals darkGreen').equal(darkGreen);

    // remove
    I.waitForText('test appointment one', 5, '.workweek');
    I.click('test appointment one', '.workweek .appointment .title');
    I.waitForVisible('.io-ox-sidepopup [data-action="io.ox/calendar/detail/actions/delete"]');
    I.click('Delete', '.io-ox-sidepopup');
    I.waitForVisible('.io-ox-dialog-popup');
    I.click('Delete', '.io-ox-dialog-popup');
    I.waitForDetached('.io-ox-dialog-popup');
    I.waitForDetached('.io-ox-dialog-sidepopup');

    I.waitForText('test appointment two', 5, '.workweek');
    I.click('test appointment two', '.workweek .appointment .title');
    I.waitForVisible('.io-ox-sidepopup [data-action="io.ox/calendar/detail/actions/delete"]');
    I.click('Delete', '.io-ox-sidepopup');
    I.waitForVisible('.io-ox-dialog-popup');
    I.click('Delete', '.io-ox-dialog-popup');
    I.waitForDetached('.io-ox-dialog-popup');
    I.waitForDetached('.io-ox-dialog-sidepopup');

    I.logout();

});
