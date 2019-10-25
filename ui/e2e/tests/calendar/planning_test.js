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

Before(async function (users) {
    await users.create();
    await users.create();
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

Scenario('use planning view opened from edit view', async function (I) {
    I.login('app=io.ox/calendar');
    I.waitForVisible({ css: '*[data-app-name="io.ox/calendar"]' });

    I.clickToolbar('New appointment');
    I.waitForVisible({ css: '*[data-app-name="io.ox/calendar/edit"]' });

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
});

Scenario('use planning view as Standalone app', async function (I) {
    I.login('app=io.ox/calendar');
    I.waitForVisible({ css: '*[data-app-name="io.ox/calendar"]' });

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

    I.fillField('Subject', 'Planning View Test2');

    I.waitForValue({ css: '[data-attribute="startDate"] .time-field' }, '12:00 PM');
    I.waitForValue({ css: '[data-attribute="endDate"] .time-field' }, '1:00 PM');

    I.see('testdude1');

    I.click('Create');
});

Scenario('test planning view lasso', async function (I) {
    I.login('app=io.ox/calendar');
    I.waitForVisible({ css: '*[data-app-name="io.ox/calendar"]' });

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

    I.waitForVisible({ css: '*[data-app-name="io.ox/calendar/edit"]' });

    I.fillField('Subject', 'Planning View Test2');

    I.waitForValue({ css: '[data-attribute="startDate"] .time-field' }, '12:30 PM');
    I.waitForValue({ css: '[data-attribute="endDate"] .time-field' }, '2:30 PM');

    I.click('Create');
});

Scenario('create distributionlist from planning view', async function (I) {
    I.login('app=io.ox/calendar');
    I.waitForVisible({ css: '*[data-app-name="io.ox/calendar"]' });

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

Scenario('check planning view options and minimizing behavior', async function (I) {
    I.login('app=io.ox/calendar');
    I.waitForVisible({ css: '*[data-app-name="io.ox/calendar"]' });

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
});

var addAttendee = function (I, name, context) {
    context = context || '';
    I.fillField(context + ' .add-participant.tt-input', name);
    I.waitForVisible('.tt-dropdown-menu');
    I.pressKey('Enter');
};

Scenario('[C7443] Check availability of participants', async function (I, users) {

    await I.haveSetting('io.ox/calendar//scheduling/onlyWorkingHours', false);

    I.login('app=io.ox/calendar');
    I.waitForVisible({ css: '*[data-app-name="io.ox/calendar"]' });

    I.clickToolbar('New appointment');
    I.waitForVisible('.io-ox-calendar-edit-window');

    I.fillField('Subject', 'Abdancen');
    I.fillField('Location', 'Dancefloor');

    addAttendee(I, users[1].get('name'));
    addAttendee(I, users[2].get('name'));

    I.click('Create');

    I.clickToolbar('New appointment');
    I.waitForVisible('.io-ox-calendar-edit-window');

    addAttendee(I, users[1].get('name'));
    addAttendee(I, users[2].get('name'));

    I.click('Find a free time');
    I.waitForVisible({ css: '.freetime-popup' });
    I.seeNumberOfVisibleElements('~Abdancen', 3);
});

Scenario('[C7444] Check availability of resources', async function (I) {

    await I.haveSetting('io.ox/calendar//scheduling/onlyWorkingHours', false);

    I.login('app=io.ox/calendar');
    I.waitForVisible({ css: '*[data-app-name="io.ox/calendar"]' });

    // just to be sure, cleanup artefacts
    await I.dontHaveResource('Evil Lair');
    await I.dontHaveResource('Laser Sharks');

    await I.haveResource({ description: 'Evil lair under an active volcano', display_name: 'Evil Lair', name: 'Evil Lair', mailaddress: 'lair@evil.inc' });
    await I.haveResource({ description: 'Evil sharks equipped with lazers', display_name: 'Laser Sharks', name: 'Laser Sharks', mailaddress: 'lasersharks@evil.inc' });

    I.clickToolbar('New appointment');
    I.waitForVisible('.io-ox-calendar-edit-window');

    I.fillField('Subject', 'How to conquer the world');
    I.fillField('Location', 'Secret volcano lair');

    addAttendee(I, 'Evil Lair');
    addAttendee(I, 'Laser Sharks');

    I.click('Create');

    I.clickToolbar('New appointment');
    I.waitForVisible('.io-ox-calendar-edit-window');

    addAttendee(I, 'Evil Lair');
    addAttendee(I, 'Laser Sharks');

    I.click('Find a free time');
    I.waitForVisible({ css: '.freetime-popup' });

    I.seeNumberOfVisibleElements('.freetime-table .appointment', 3);

    await I.dontHaveResource('Evil Lair');
    await I.dontHaveResource('Laser Sharks');
});

Scenario('[C7445] Check availability of resources and participants', async function (I, users) {

    await I.haveSetting('io.ox/calendar//scheduling/onlyWorkingHours', false);

    I.login('app=io.ox/calendar');
    I.waitForVisible({ css: '*[data-app-name="io.ox/calendar"]' });

    // just to be sure, cleanup artefacts
    await I.dontHaveResource('Eggs');
    await I.dontHaveResource('Colors');

    await I.haveResource({ description: 'Eggs from happy chickens', display_name: 'Eggs', name: 'Eggs', mailaddress: 'eggs@easter.bunny' });
    await I.haveResource({ description: 'Colors for Easter Eggs. 100% gluten free, organic', display_name: 'Colors', name: 'Colors', mailaddress: 'colors@easter.bunny' });

    I.clickToolbar('New appointment');
    I.waitForVisible('.io-ox-calendar-edit-window');

    I.fillField('Subject', 'Color Easter Eggs');
    I.fillField('Location', 'Easter Bunny house');

    addAttendee(I, 'Eggs');
    addAttendee(I, 'Colors');

    addAttendee(I, users[1].get('name'));
    addAttendee(I, users[2].get('name'));

    I.click('Create');

    I.clickToolbar('New appointment');
    I.waitForVisible('.io-ox-calendar-edit-window');

    I.click('Find a free time');
    I.waitForVisible({ css: '.freetime-popup' });

    addAttendee(I, 'Eggs', '.freetime-view-header');
    addAttendee(I, 'Colors', '.freetime-view-header');

    addAttendee(I, users[1].get('name'), '.freetime-view-header');
    addAttendee(I, users[2].get('name'), '.freetime-view-header');
    I.wait(1);

    I.seeNumberOfVisibleElements('.freetime-table .appointment', 5);

    await I.dontHaveResource('Eggs');
    await I.dontHaveResource('Colors');
});

Scenario('[C252157] Fine grid for high zoom levels', async function (I, users) {

    I.login('app=io.ox/calendar');
    I.waitForVisible({ css: '*[data-app-name="io.ox/calendar"]' });

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

    I.click('Options');
    I.click('Show fine grid');
    I.pressKey('Escape');

    // 100%
    var [backgroudImage] = await I.grabCssPropertyFrom('.freetime-table-cell', 'background-image');
    expect(backgroudImage).to.equal('linear-gradient(90deg, rgb(170, 170, 170) 0px, transparent 1px)');

    // 200%
    I.click('.fa-plus');

    [backgroudImage] = await I.grabCssPropertyFrom('.freetime-table-cell', 'background-image');
    expect(backgroudImage).to.equal('linear-gradient(90deg, rgb(170, 170, 170) 0px, transparent 1px)');

    // 400%
    I.click('.fa-plus');

    [backgroudImage] = await I.grabCssPropertyFrom('.freetime-table-cell', 'background-image');
    expect(backgroudImage).to.equal('linear-gradient(90deg, rgb(170, 170, 170) 0px, transparent 1px)');

    // 1000%
    I.click('.fa-plus');

    [backgroudImage] = await I.grabCssPropertyFrom('.freetime-table-cell', 'background-image');
    expect(backgroudImage).to.equal('linear-gradient(90deg, rgb(51, 51, 51) 0px, transparent 1px, transparent 50px, rgb(136, 136, 136) 51px, transparent 51px, transparent 99px, rgb(136, 136, 136) 100px, transparent 100px, transparent 149px)');

    await I.dontHaveResource('Zebra');
    await I.dontHaveResource('Tiger');
});
