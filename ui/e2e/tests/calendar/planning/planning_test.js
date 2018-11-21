/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2018 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */


Feature('Planning View');

Before(async function (users) {
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

Scenario('use planning view opened from edit view', async function (I) {
    I.login('app=io.ox/calendar');
    I.waitForVisible('*[data-app-name="io.ox/calendar"]');

    I.clickToolbar('New');
    I.waitForVisible('*[data-app-name="io.ox/calendar/edit"]');

    I.fillField('Subject', 'Planning View Test');

    I.click('.find-free-time button');

    I.waitForVisible('.freetime-view-header');
    I.waitForVisible('.freetime-view-body');

    // scroll to start (I.scrollTo doesnt work)
    I.executeScript(function () {
        $('.freetime-time-view-body').scrollLeft(0);
    });
    I.click('.timeline-day:first-child .freetime-hour:nth-child(6)');

    I.click('.modal-footer [data-action="save"]');

    I.dontSee('.freetime-view-header');
    I.dontSee('.freetime-view-body');

    I.waitForValue('[data-attribute="startDate"] .time-field', '12:00 PM');
    I.waitForValue('[data-attribute="endDate"] .time-field', '1:00 PM');

    I.click('Create');

    I.logout();
});

Scenario('use planning view as Standalone app', async function (I) {
    I.login('app=io.ox/calendar');
    I.waitForVisible('*[data-app-name="io.ox/calendar"]');

    I.clickToolbar('Scheduling');

    I.waitForVisible('.freetime-view-header');
    I.waitForVisible('.freetime-view-body');

    // scroll to start (I.scrollTo doesnt work)
    I.executeScript(function () {
        $('.freetime-time-view-body').scrollLeft(0);
    });
    I.click('.timeline-day:first-child .freetime-hour:nth-child(6)');

    //add a participant
    I.fillField('.tt-input', 'testdude1@test.test');
    I.pressKey('Enter');
    I.see('testdude1');

    I.click('Create appointment');

    I.dontSee('.freetime-view-header');
    I.dontSee('.freetime-view-body');

    I.waitForVisible('*[data-app-name="io.ox/calendar/edit"]');

    I.fillField('Subject', 'Planning View Test2');

    I.waitForValue('[data-attribute="startDate"] .time-field', '12:00 PM');
    I.waitForValue('[data-attribute="endDate"] .time-field', '1:00 PM');

    I.see('testdude1');

    I.click('Create');

    I.logout();
});
