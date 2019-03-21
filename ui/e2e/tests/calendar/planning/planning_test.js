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

    I.click('Find a free time');

    I.waitForVisible('.freetime-view-header');
    I.waitForVisible('.freetime-view-body');

    // scroll to start (I.scrollTo doesnt work)
    I.executeScript(function () {
        $('.freetime-time-view-body').scrollLeft(0);
    });
    I.click('.timeline-day:first-child .freetime-hour:nth-child(6)');

    I.click('Apply changes', '.modal-footer');

    I.waitForInvisible('.freetime-view-header');
    I.waitForInvisible('.freetime-view-body');

    I.waitForValue({ css: '[data-attribute="startDate"] .time-field' }, '12:00 PM');
    I.waitForValue({ css: '[data-attribute="endDate"] .time-field' }, '1:00 PM');

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
    I.fillField('Add contact/resource', 'testdude1@test.test');
    I.wait(0.5);
    I.pressKey('Enter');
    I.see('testdude1');

    I.click('Create appointment');

    I.waitForInvisible('.freetime-view-header');
    I.waitForInvisible('.freetime-view-body');

    I.waitForVisible('*[data-app-name="io.ox/calendar/edit"]');

    I.fillField('Subject', 'Planning View Test2');

    I.waitForValue({ css: '[data-attribute="startDate"] .time-field' }, '12:00 PM');
    I.waitForValue({ css: '[data-attribute="endDate"] .time-field' }, '1:00 PM');

    I.see('testdude1');

    I.click('Create');

    I.logout();
});

Scenario('test planning view lasso', async function (I) {
    I.login('app=io.ox/calendar');
    I.waitForVisible('*[data-app-name="io.ox/calendar"]');

    I.clickToolbar('Scheduling');

    I.waitForVisible('.freetime-view-header');
    I.waitForVisible('.freetime-view-body');

    // scroll to start (I.scrollTo doesnt work)
    I.executeScript(function () {
        $('.freetime-time-view-body').scrollLeft(0);
    });

    // lasso
    I.dragAndDrop('.freetime-table-cell:nth-child(6)', '.freetime-table-cell:nth-child(8)');

    I.click('Create appointment');

    I.waitForInvisible('.freetime-view-header');
    I.waitForInvisible('.freetime-view-body');

    I.waitForVisible('*[data-app-name="io.ox/calendar/edit"]');

    I.fillField('Subject', 'Planning View Test2');

    I.waitForValue({ css: '[data-attribute="startDate"] .time-field' }, '12:30 PM');
    I.waitForValue({ css: '[data-attribute="endDate"] .time-field' }, '2:30 PM');

    I.click('Create');

    I.logout();
});

Scenario('create distributionlist from planning view', async function (I) {
    I.login('app=io.ox/calendar');
    I.waitForVisible('*[data-app-name="io.ox/calendar"]');

    I.clickToolbar('Scheduling');

    I.waitForVisible('.freetime-view-header');
    I.waitForVisible('.freetime-view-body');

    //add a participant
    I.fillField('Add contact/resource', 'testdude1@test.test');
    I.wait(0.5);
    I.pressKey('Enter');
    I.see('testdude1');

    I.click('Save as distribution list');

    I.waitForVisible('.io-ox-contacts-distrib-window');

    I.fillField('Name', 'Test distribution list');
    I.click('Create list', '.io-ox-contacts-distrib-window');

    I.click('.scheduling-app-close');

    I.logout();
});

Scenario('check planning view options and minimizing behavior', async function (I) {
    I.login('app=io.ox/calendar');
    I.waitForVisible('*[data-app-name="io.ox/calendar"]');

    I.clickToolbar('Scheduling');

    I.waitForVisible('.freetime-view-header');
    I.waitForVisible('.freetime-view-body');

    I.waitForVisible('a.control.prev');
    I.waitForVisible('a.control.next');
    I.waitForVisible('.fa-minus');
    I.waitForVisible('.fa-plus');
    I.see('Options');

    I.click('Options');

    I.waitForVisible({ css: '[data-name="compact"]' });
    I.waitForVisible({ css: '[data-name="showFineGrid"]' });
    I.waitForVisible({ css: '[data-name="showFree"]' });
    I.waitForVisible({ css: '[data-value="week"]' });
    I.waitForVisible({ css: '[data-value="month"]' });
    I.waitForVisible({ css: '[data-name="onlyWorkingHours"]' });

    I.pressKey('Escape');

    I.openApp('Mail');

    I.waitForInvisible('.freetime-view-header');
    I.waitForInvisible('.freetime-view-body');
    I.waitForVisible('.taskbar-button[aria-label="Scheduling"]');

    I.click('.taskbar-button[aria-label="Scheduling"]');

    I.waitForVisible('.freetime-view-header');
    I.waitForVisible('.freetime-view-body');

    I.click('.scheduling-app-close');

    I.logout();
});
