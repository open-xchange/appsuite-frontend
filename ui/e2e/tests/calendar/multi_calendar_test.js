/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2018 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

Feature('Calendar > Create');

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

Scenario('Create appointments in workweekview', async function ({ I, users }) {
    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true }
    });
    const defaultFolderId = `cal://0/${await I.grabDefaultFolder('calendar')}`;
    await I.haveFolder({ title: 'New calendar', module: 'event', parent: defaultFolderId });

    I.login('app=io.ox/calendar');
    I.waitForVisible({ css: '[data-app-name="io.ox/calendar"]' }, 5);

    I.clickToolbar('View');
    I.click('Workweek');

    I.click('~Next Week');

    // create in Workweek view
    I.createAppointment({ subject: 'test appointment one', folder: users[0].userdata.sur_name + ', ' + users[0].userdata.given_name, startTime: '4:00 PM' });

    // check in Workweek view
    I.clickToolbar('View');
    I.click('Workweek');
    I.waitForText('test appointment one', 5, '.workweek');
    I.see('test appointment one', '.workweek .appointment .title');

    I.seeNumberOfElements('.workweek .appointment .title', 1);

    I.createAppointment({ subject: 'test appointment two', folder: 'New calendar', startTime: '5:00 PM' });

    // check in Workweek view
    I.clickToolbar('View');
    I.click('Workweek');
    I.waitForText('test appointment one', 5, '.workweek');
    I.waitForText('test appointment two', 5, '.workweek');
    I.see('test appointment one', '.workweek .appointment .title');
    I.see('test appointment two', '.workweek .appointment .title');
    I.seeNumberOfElements('.workweek .appointment .title', 2);

    // switch off New calendar
    I.waitForElement({ css: '[aria-label^="New calendar"] .color-label' });
    I.click({ css: '[aria-label^="New calendar"] .color-label' }, '.window-sidepanel');
    I.seeNumberOfElements('.workweek .appointment .title', 1);

    // switch on again
    I.waitForElement({ css: '[aria-label^="New calendar"] .color-label' });
    I.click({ css: '[aria-label^="New calendar"] .color-label' }, '.window-sidepanel');
    I.see('test appointment two', '.workweek .appointment .title');
    I.seeNumberOfElements('.workweek .appointment .title', 2);
});

Scenario('Create appointments in weekview', async function ({ I, users }) {

    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true }
    });
    const defaultFolderId = `cal://0/${await I.grabDefaultFolder('calendar')}`;
    await I.haveFolder({ title: 'New calendar', module: 'event', parent: defaultFolderId });

    I.login('app=io.ox/calendar');
    I.waitForVisible({ css: '[data-app-name="io.ox/calendar"]' }, 5);

    I.clickToolbar('View');
    I.click('Week');

    I.createAppointment({ subject: 'test appointment one', folder: 'New calendar', startTime: '4:00 PM' });
    I.createAppointment({ subject: 'test appointment two', folder: users[0].userdata.sur_name + ', ' + users[0].userdata.given_name, startTime: '5:00 PM' });

    // check in Week view
    I.waitForText('test appointment one', 5, '.week');
    I.waitForText('test appointment two', 5, '.week');
    I.see('test appointment one', '.weekview-container.week .appointment .title');
    I.see('test appointment two', '.weekview-container.week .appointment .title');
    I.seeNumberOfElements('.weekview-container.week .appointment .title', 2);

    // switch off New calendar
    I.waitForElement({ css: '[aria-label^="New calendar"] .color-label' });
    I.click({ css: '[aria-label^="New calendar"] .color-label' }, '.window-sidepanel');
    I.seeNumberOfElements('.weekview-container.week .appointment .appointment-content .title', 1);

    // switch on again
    I.waitForElement({ css: '[aria-label^="New calendar"] .color-label' });
    I.click({ css: '[aria-label^="New calendar"] .color-label' }, '.window-sidepanel');
    I.see('test appointment one', '.week .appointment .title');
    I.seeNumberOfElements('.weekview-container.week .appointment .appointment-content .title', 2);
});

Scenario('Create appointments in monthview', async function ({ I, users }) {

    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true }
    });
    const defaultFolderId = `cal://0/${await I.grabDefaultFolder('calendar')}`;
    await I.haveFolder({ title: 'New calendar', module: 'event', parent: defaultFolderId });

    I.login('app=io.ox/calendar');
    I.waitForVisible({ css: '[data-app-name="io.ox/calendar"]' }, 5);

    I.clickToolbar('View');
    I.click('Month');

    I.createAppointment({ subject: 'test appointment one', folder: users[0].userdata.sur_name + ', ' + users[0].userdata.given_name, startTime: '4:00 PM' });
    I.createAppointment({ subject: 'test appointment two', folder: 'New calendar', startTime: '5:00 PM' });

    // check in Month view
    I.waitForText('test appointment one', 5, '.month-container');
    I.waitForText('test appointment two', 5, '.month-container');
    I.see('test appointment one', '.month-container .appointment .title');
    I.see('test appointment two', '.month-container .appointment .title');
    I.seeNumberOfElements('.month-container .appointment .title', 2);

    // switch off New calendar
    I.waitForElement({ css: '[aria-label^="New calendar"] .color-label' });
    I.click({ css: '[aria-label^="New calendar"] .color-label' }, '.window-sidepanel');
    I.seeNumberOfElements('.month-container .appointment .appointment-content .title', 1);

    // switch on again
    I.waitForElement({ css: '[aria-label^="New calendar"] .color-label' });
    I.click({ css: '[aria-label^="New calendar"] .color-label' }, '.window-sidepanel');
    I.see('test appointment two', '.month-container .appointment .title');
    I.seeNumberOfElements('.month-container .appointment .appointment-content .title', 2);
});

Scenario('Create appointments in dayview', async function ({ I, users, calendar }) {

    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true }
    });
    const defaultFolderId = `cal://0/${await I.grabDefaultFolder('calendar')}`;
    await I.haveFolder({ title: 'New calendar', module: 'event', parent: defaultFolderId });

    I.login('app=io.ox/calendar');
    calendar.waitForApp();

    // create in Day view
    I.clickToolbar('View');
    I.click('Day');

    I.createAppointment({ subject: 'test appointment one', folder: 'New calendar', startTime: '4:00 PM' });
    I.createAppointment({ subject: 'test appointment two', folder: users[0].userdata.sur_name + ', ' + users[0].userdata.given_name, startTime: '5:00 PM' });

    // check in Day view
    I.waitForText('test appointment one', 5, '.weekview-container');
    I.waitForText('test appointment two', 5, '.weekview-container');

    I.see('test appointment one', '.weekview-container.day .appointment .title');
    I.see('test appointment two', '.weekview-container.day .appointment .title');
    I.seeNumberOfElements('.weekview-container.day .appointment .title', 2);

    // switch off New calendar
    I.waitForElement({ css: '[aria-label^="New calendar"] .color-label' });
    I.click({ css: '[aria-label^="New calendar"] .color-label' }, '.window-sidepanel');
    I.seeNumberOfElements('.weekview-container.day .appointment .title', 1);

    // switch on again
    I.waitForElement({ css: '[aria-label^="New calendar"] .color-label' });
    I.click({ css: '[aria-label^="New calendar"] .color-label' }, '.window-sidepanel');
    I.see('test appointment one', '.weekview-container.day .appointment .title');
    I.seeNumberOfElements('.weekview-container.day .appointment .title', 2);
});
