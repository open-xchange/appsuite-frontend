/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2018 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Jorin Laatsch <jorin.laatsch@open-xchange.com>
 * @author Daniel Pondruff <daniel.pondruff@open-xchange.com>
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

/// <reference path="../../steps.d.ts" />

const { expect } = require('chai');

Feature('Calendar > Planning View');

Before(async function ({ users }) {
    await users.create();
    await users.create();
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

Scenario('use planning view opened from edit view', async function ({ I, calendar, dialogs }) {
    I.login('app=io.ox/calendar');
    calendar.waitForApp();

    calendar.newAppointment();
    I.fillField('Subject', 'Planning View Test');

    I.click('Find a free time');

    dialogs.waitForVisible();
    I.waitForVisible('.freetime-view-header');
    I.waitForVisible('.freetime-view-body');

    // scroll to start (I.scrollTo doesnt work)
    I.executeScript(function () {
        $('.freetime-time-view-body').scrollLeft(0);
    });
    I.click('.timeline-day:first-child .freetime-hour:nth-child(6)');

    dialogs.clickButton('Apply changes');
    I.waitForDetached('.modal-dialog');

    I.waitForInvisible('.freetime-view-header');
    I.waitForInvisible('.freetime-view-body');

    I.waitForValue({ css: '[data-attribute="startDate"] .time-field' }, '12:00 PM');
    I.waitForValue({ css: '[data-attribute="endDate"] .time-field' }, '1:00 PM');

    I.click('Create');
});

Scenario('use planning view as Standalone app', async function ({ I }) {
    I.login('app=io.ox/calendar');
    I.waitForVisible({ css: '.io-ox-calendar-window' });

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

    I.waitForVisible({ css: '*[data-app-name="io.ox/calendar/edit"]' });
    I.waitForFocus('.io-ox-calendar-edit-window input[type="text"][name="summary"]');
    I.fillField('Subject', 'Planning View Test2');

    I.waitForValue({ css: '[data-attribute="startDate"] .time-field' }, '12:00 PM');
    I.waitForValue({ css: '[data-attribute="endDate"] .time-field' }, '1:00 PM');

    I.see('testdude1');

    I.click('Create');
});

// TODO: shaky, msg: 'Cannot read property 'x' of null'
Scenario('test planning view lasso', async function ({ I }) {
    I.login('app=io.ox/calendar');
    I.waitForVisible({ css: '.io-ox-calendar-window' });

    I.clickToolbar('Scheduling');

    I.waitForVisible('.freetime-view-header');
    I.waitForVisible('.freetime-view-body');

    I.waitForNetworkTraffic();
    I.waitForVisible('.freetime-table-cell:nth-child(6)');
    I.scrollTo('.freetime-table-cell:nth-child(6)');

    // lasso
    I.dragAndDrop('.freetime-table-cell:nth-child(6)', '.freetime-table-cell:nth-child(8)');
    I.waitForVisible('.freetime-lasso');

    I.click('Create appointment');

    I.waitForInvisible('.freetime-view-header');
    I.waitForInvisible('.freetime-view-body');

    I.waitForVisible({ css: '*[data-app-name="io.ox/calendar/edit"]' });
    I.waitForFocus('.io-ox-calendar-edit-window input[type="text"][name="summary"]');
    I.fillField('Subject', 'Planning View Test2');

    I.waitForValue({ css: '[data-attribute="startDate"] .time-field' }, '12:30 PM');
    I.waitForValue({ css: '[data-attribute="endDate"] .time-field' }, '2:30 PM');

    I.click('Create');
});

Scenario('create distributionlist from planning view', async function ({ I }) {
    I.login('app=io.ox/calendar');
    I.waitForVisible({ css: '.io-ox-calendar-window' });

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
});

Scenario('check planning view options and minimizing behavior', async function ({ I }) {
    I.login('app=io.ox/calendar');
    I.waitForVisible({ css: '.io-ox-calendar-window' });

    I.clickToolbar('Scheduling');

    I.waitForVisible('.freetime-view-header');
    I.waitForVisible('.freetime-view-body');

    I.waitForVisible('a.control.prev');
    I.waitForVisible('a.control.next');
    I.waitForVisible('.fa-minus');
    I.waitForVisible('.fa-plus');
    I.see('Options', '.scheduling-app-header');

    I.click('Options', '.scheduling-app-header');

    I.waitForVisible({ css: '[data-name="compact"]' });
    I.waitForVisible({ css: '[data-name="showFineGrid"]' });
    I.waitForVisible({ css: '[data-name="showFree"]' });
    I.waitForVisible({ css: '[data-value="week"][data-name="dateRange"]' });
    I.waitForVisible({ css: '[data-value="month"][data-name="dateRange"]' });
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
});

var addAttendee = function (I, name, context) {
    context = context || '';
    I.fillField(context + ' .add-participant.tt-input', name);
    I.waitForVisible('.tt-dropdown-menu');
    I.pressKey('Enter');
};

Scenario('[C7443] Check availability of participants', async function ({ I, users, calendar }) {

    await I.haveSetting('io.ox/calendar//scheduling/onlyWorkingHours', false);

    I.login('app=io.ox/calendar');
    I.waitForVisible({ css: '.io-ox-calendar-window' });

    I.clickToolbar('New appointment');
    I.waitForVisible('.io-ox-calendar-edit-window');

    I.retry(5).fillField('Subject', 'Abdancen');
    I.fillField('Location', 'Dancefloor');

    await calendar.addParticipant(users[1].get('name'));
    await calendar.addParticipant(users[2].get('name'));

    I.click('Create');

    I.clickToolbar('New appointment');
    I.waitForVisible('.io-ox-calendar-edit-window');
    I.waitForFocus('.io-ox-calendar-edit-window input[type="text"][name="summary"]');

    await calendar.addParticipant(users[1].get('name'));
    await calendar.addParticipant(users[2].get('name'));

    I.click('Find a free time');
    I.waitForVisible({ css: '.freetime-popup' });
    I.waitForElement({ xpath: '//div[@class="appointments"]/*[1]' });
    I.waitForElement({ xpath: '//div[@class="appointments"]/*[2]' });
    I.waitForElement({ xpath: '//div[@class="appointments"]/*[3]' });
});

Scenario('[C7444] Check availability of resources', async function ({ I, calendar }) {

    await I.haveSetting('io.ox/calendar//scheduling/onlyWorkingHours', false);

    I.login('app=io.ox/calendar');
    I.waitForVisible({ css: '.io-ox-calendar-window' });

    // just to be sure, cleanup artefacts
    await I.dontHaveResource('Evil Lair');
    await I.dontHaveResource('Laser Sharks');

    await I.haveResource({ description: 'Evil lair under an active volcano', display_name: 'EvilLair', name: 'EvilLair', mailaddress: 'lair@evil.inc' });
    await I.haveResource({ description: 'Evil sharks equipped with lazers', display_name: 'LaserSharks', name: 'LaserSharks', mailaddress: 'lasersharks@evil.inc' });

    I.clickToolbar('New appointment');
    I.waitForVisible('.io-ox-calendar-edit-window');

    I.retry(5).fillField('Subject', 'How to conquer the world');
    I.fillField('Location', 'Secret volcano lair');

    await calendar.addParticipant('EvilLair');
    await calendar.addParticipant('LaserSharks');

    I.click('Create');

    I.clickToolbar('New appointment');
    I.waitForVisible('.io-ox-calendar-edit-window');
    I.waitForFocus('.io-ox-calendar-edit-window input[type="text"][name="summary"]');

    await calendar.addParticipant('EvilLair');
    await calendar.addParticipant('LaserSharks');

    I.click('Find a free time');
    I.waitForVisible({ css: '.freetime-popup' });
    I.waitForElement({ xpath: '//div[@class="appointments"]/*[1]' });
    I.waitForElement({ xpath: '//div[@class="appointments"]/*[2]' });
    I.waitForElement({ xpath: '//div[@class="appointments"]/*[3]' });

    await I.dontHaveResource('EvilLair');
    await I.dontHaveResource('LaserSharks');
});

Scenario('[C7445] Check availability of resources and participants', async function ({ I, users, calendar }) {

    await I.haveSetting('io.ox/calendar//scheduling/onlyWorkingHours', false);

    I.login('app=io.ox/calendar');
    I.waitForVisible({ css: '.io-ox-calendar-window' });

    // just to be sure, cleanup artefacts
    await I.dontHaveResource('Eggs');
    await I.dontHaveResource('Colors');

    await I.haveResource({ description: 'Eggs from happy chickens', display_name: 'Eggs', name: 'Eggs', mailaddress: 'eggs@easter.bunny' });
    await I.haveResource({ description: 'Colors for Easter Eggs. 100% gluten free, organic', display_name: 'Colors', name: 'Colors', mailaddress: 'colors@easter.bunny' });

    I.clickToolbar('New appointment');
    I.waitForVisible('.io-ox-calendar-edit-window');

    I.retry(5).fillField('Subject', 'Color Easter Eggs');
    I.fillField('Location', 'Easter Bunny house');

    await calendar.addParticipant('Eggs');
    await calendar.addParticipant('Colors');

    await calendar.addParticipant(users[1].get('name'));
    await calendar.addParticipant(users[2].get('name'));

    I.click('Create');

    I.clickToolbar('New appointment');
    I.waitForVisible('.io-ox-calendar-edit-window');

    I.wait(1);
    I.retry(5).click('Find a free time');
    I.waitForVisible({ css: '.freetime-popup' });

    I.wait(1);
    await calendar.addParticipant('Eggs', true, '.freetime-view');
    await calendar.addParticipant('Colors', true, '.freetime-view');
    await calendar.addParticipant(users[1].get('name'), true, '.freetime-view');
    await calendar.addParticipant(users[2].get('name'), true, '.freetime-view');

    I.waitForElement({ xpath: '//div[@class="appointments"]/*[1]' });
    I.waitForElement({ xpath: '//div[@class="appointments"]/*[2]' });
    I.waitForElement({ xpath: '//div[@class="appointments"]/*[3]' });
    I.waitForElement({ xpath: '//div[@class="appointments"]/*[4]' });
    I.waitForElement({ xpath: '//div[@class="appointments"]/*[5]' });

    await I.dontHaveResource('Eggs');
    await I.dontHaveResource('Colors');
});

Scenario('[C252157] Fine grid for high zoom levels ', async function ({ I, users }) {

    I.login('app=io.ox/calendar');
    I.waitForVisible({ css: '.io-ox-calendar-window' });

    // just to be sure, cleanup artefacts
    await I.dontHaveResource('Zebra');
    await I.dontHaveResource('Tiger');

    await I.haveResource({ description: 'Zebra with awesome stripes', display_name: 'Zebra', name: 'Zebra', mailaddress: 'zebra@zoo.zoo' });
    await I.haveResource({ description: 'Tiger with awesome stripes', display_name: 'Tiger', name: 'Tiger', mailaddress: 'tiger@zoo.zoo' });

    I.clickToolbar('Scheduling');

    I.waitForVisible('.io-ox-calendar-scheduling-window');

    addAttendee(I, 'Zebra', '.freetime-view-header');
    addAttendee(I, 'Tiger', '.freetime-view-header');

    addAttendee(I, users[1].get('name'), '.freetime-view-header');
    addAttendee(I, users[2].get('name'), '.freetime-view-header');

    I.click('Options', '.scheduling-app-header');
    I.click('Show fine grid');
    I.pressKey('Escape');

    // 100%
    var [backgroudImage] = await I.grabCssPropertyFromAll('.freetime-table-cell', 'background-image');
    expect(backgroudImage).to.equal('linear-gradient(90deg, rgb(170, 170, 170) 0px, rgba(0, 0, 0, 0) 1px)');

    // 200%
    I.click('.fa-plus');

    [backgroudImage] = await I.grabCssPropertyFromAll('.freetime-table-cell', 'background-image');
    expect(backgroudImage).to.equal('linear-gradient(90deg, rgb(170, 170, 170) 0px, rgba(0, 0, 0, 0) 1px)');

    // 400%
    I.click('.fa-plus');

    [backgroudImage] = await I.grabCssPropertyFromAll('.freetime-table-cell', 'background-image');
    expect(backgroudImage).to.equal('linear-gradient(90deg, rgb(170, 170, 170) 0px, rgba(0, 0, 0, 0) 1px)');

    // 1000%
    I.click('.fa-plus');

    [backgroudImage] = await I.grabCssPropertyFromAll('.freetime-table-cell', 'background-image');
    expect(backgroudImage).to.equal('linear-gradient(90deg, rgb(51, 51, 51) 0px, rgba(0, 0, 0, 0) 1px, rgba(0, 0, 0, 0) 50px, rgb(136, 136, 136) 51px, rgba(0, 0, 0, 0) 51px, rgba(0, 0, 0, 0) 99px, rgb(136, 136, 136) 100px, rgba(0, 0, 0, 0) 100px, rgba(0, 0, 0, 0) 149px)');

    await I.dontHaveResource('Zebra');
    await I.dontHaveResource('Tiger');
});
