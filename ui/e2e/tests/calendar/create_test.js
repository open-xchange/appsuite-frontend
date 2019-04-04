/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */
/// <reference path="../../steps.d.ts" />

const moment = require('moment');

Feature('Calendar: Create new appointment').tag('3');

Before(async function (users) {
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

Scenario('Create appointment with all fields', async function (I) {
    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true }
    });

    I.login('app=io.ox/calendar');
    I.waitForVisible({ css: '*[data-app-name="io.ox/calendar"]' });

    I.click('~Next Week', '.page.current');

    I.clickToolbar('New');
    I.waitForVisible('.io-ox-calendar-edit-window');

    I.fillField('Subject', 'test title');
    I.fillField('Location', 'test location');
    I.selectOption('Visibility', 'Private');

    I.click('~Start time');
    I.click('12:00 PM', 'fieldset[data-attribute="startDate"]');

    I.click('Create');
    I.waitForDetached('.io-ox-calendar-edit-window');

    // // check appointment in all views
    // // 1) day view
    I.clickToolbar('View');
    I.click('Day');
    const cid = await I.grabAttributeFrom('.appointment', 'data-cid'),
        appointmentSelector = locate(`.appointment[data-cid="${cid}"]`);
    let appointment = appointmentSelector.inside('.weekview-container.day')
        .as('appointment element in day view');

    I.see('test title', appointment);
    I.see('test location', appointment);
    I.seeElement(appointment.find('.confidential-flag'));

    // // 2) week view
    I.clickToolbar('View');
    I.click('Week');
    appointment = appointmentSelector.inside('.weekview-container.week')
        .as('appointment element in week view');

    I.see('test title', appointment);
    I.see('test location', appointment);
    I.seeElement(appointment.find('.confidential-flag'));

    // // 3) month view
    I.clickToolbar('View');
    I.click('Month');
    appointment = appointmentSelector.inside('.monthview-container')
        .as('appointment element in month view');

    I.see('test title', appointment);
    I.see('test location', appointment);
    I.seeElement(appointment.find('.confidential-flag'));

    // // 4) list view
    I.clickToolbar('View');
    I.click('List');
    appointment = appointmentSelector.inside('.calendar-list-view')
        .as('appointment element in list view');

    I.see('test title', appointment);
    I.see('test location', appointment);
    I.seeElement(appointment.find('.private-flag'));

    // // delete the appointment thus it does not create conflicts for upcoming appointments
    I.click(appointment);
    I.waitForText('Delete');
    I.click('Delete');
    I.waitForVisible('.modal-dialog .modal-footer');
    I.click('Delete', '.modal-dialog .modal-footer');
    I.waitForDetached(appointment);

    I.logout();

});

Scenario('fullday appointments', async function (I) {
    I.login('app=io.ox/calendar');
    I.waitForVisible('*[data-app-name="io.ox/calendar"]');

    I.clickToolbar('View');
    I.click('Week');

    I.clickToolbar('New');
    I.waitForVisible('*[data-app-name="io.ox/calendar/edit"]');
    I.fillField('Subject', 'Fullday test');
    I.click('All day', '.checkbox > label');

    I.click('~Date (M/D/YYYY)');
    I.pressKey(['Control', 'a']);
    I.pressKey(moment().startOf('week').add('1', 'day').format('l'));
    I.pressKey('Enter');

    I.click('~Date (M/D/YYYY)', '.dateinput[data-attribute="endDate"]');
    I.pressKey(['Control', 'a']);
    I.pressKey(moment().endOf('week').subtract('1', 'day').format('l'));
    I.pressKey('Enter');

    I.click('Create');

    I.click('Fullday test', '.weekview-container.week .appointment');

    I.see('5 days', '.io-ox-sidepopup .calendar-detail');

    I.click('Delete', '.io-ox-sidepopup .calendar-detail');
    I.click('Delete', '.modal-dialog .modal-footer');

    I.logout();
});
