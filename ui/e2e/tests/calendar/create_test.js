/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Jorin Laatsch <jorin.laatsch@open-xchange.com>
 * @author Daniel Pondruff <daniel.pondruff@open-xchange.com>
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */


/// <reference path="../../steps.d.ts" />
 
const moment = require('moment');

Feature('Calendar create');
 
Before(async (users) => {
    await users.create();
});
After(async (users) => {
    await users.removeAll();
});

var addAttendee = function (I, name, context) {
    context = context || '';
    I.fillField(context + ' .add-participant.tt-input', name);
    I.waitForVisible('.tt-dropdown-menu');
    I.pressKey('Enter');
};

var checkInAllViews = async function (I, subject, location) {

    // // 1) day view
    I.clickToolbar('View');
    I.click('Day', '.smart-dropdown-container');

    const cid = await I.grabAttributeFrom('.appointment', 'data-cid'),
        appointmentSelector = locate(`.appointment[data-cid="${cid}"]`);
    let appointment = appointmentSelector.inside('.weekiew-container.day')
        .as('appointment element in day view');

    I.waitForText(subject, appointment);
    I.waitForText(location, appointment);

    // // 2) week view
    appointment = appointmentSelector.inside('.weekview-container.week')
        .as('appointment element in week view');
    I.clickToolbar('View');
    I.click('Week', '.smart-dropdown-container');
    I.wait(1);

    I.waitForText(subject, appointment);
    I.waitForText(location, appointment);

    // // 3) month view
    I.clickToolbar('View');
    I.click('Month', '.smart-dropdown-container');
    I.wait(1);
    appointment = appointmentSelector.inside('.monthview-container')
        .as('appointment element in month view');

    // don't look for location in month view (usually subject is too long so location is out of view)
    I.waitForText(subject, appointment);

    // // 4) list view
    I.clickToolbar('View');
    I.click('List', '.smart-dropdown-container');
    I.wait(1);
    appointment = appointmentSelector.inside('.calendar-list-view')
        .as('appointment element in list view');

    I.waitForText(subject, appointment);
    I.waitForText(location, appointment);

};

Scenario('[C7411] Discard appointment during the creation', function (I) {
    const time = moment().format('YYYY-MM-DD HH:mm');
    I.login('app=io.ox/calendar');
    I.clickToolbar('New');
    I.waitForText('Subject');
    I.fillField('Subject', 'Testappointment ' + time);
    I.fillField('Location', 'TestLocation');
    I.click('Discard');
    I.click('Discard changes');
    I.waitToHide('.io-ox-calendar-edit');
});
