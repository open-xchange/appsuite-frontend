/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Jorin Laatsch <jorin.laatsch@open-xchange.com>
 * @author Daniel Pondruff <daniel.pondruff@open-xchange.com>
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */


/// <reference path="../../../steps.d.ts" />

const expect = require('chai').expect;

Feature('Calendar > Planning');

Before(async (users) => {
    await users.create();
    await users.create();
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

Scenario('[C7443] Check availability of participants', async function (I, users) {

    I.login('app=io.ox/calendar');
    I.waitForVisible({ css: '*[data-app-name="io.ox/calendar"]' });

    I.clickToolbar('New');
    I.waitForVisible('.io-ox-calendar-edit-window');

    I.fillField('Subject', 'Abdancen');
    I.fillField('Location', 'Dancefloor');

    addAttendee(I, users[1].get('name'));
    addAttendee(I, users[2].get('name'));

    I.click('Create');


    I.clickToolbar('New');
    I.waitForVisible('.io-ox-calendar-edit-window');

    addAttendee(I, users[1].get('name'));
    addAttendee(I, users[2].get('name'));

    I.click('Find a free time');
    I.waitForVisible({ css: '.freetime-popup' });
    I.seeNumberOfVisibleElements('~Abdancen', 3);
});

Scenario('[C7444] Check availability of resources', async function (I) {

    I.login('app=io.ox/calendar');
    I.waitForVisible({ css: '*[data-app-name="io.ox/calendar"]' });

    // just to be sure, cleanup artefacts
    await I.dontHaveResource('Evil Lair');
    await I.dontHaveResource('Laser Sharks');

    await I.haveResource({ description: 'Evil lair under an active volcano', display_name: 'Evil Lair', name: 'Evil Lair', mailaddress: 'lair@evil.inc' });
    await I.haveResource({ description: 'Evil sharks equipped with lazers', display_name: 'Laser Sharks', name: 'Laser Sharks', mailaddress: 'lasersharks@evil.inc' });

    I.clickToolbar('New');
    I.waitForVisible('.io-ox-calendar-edit-window');

    I.fillField('Subject', 'How to conquer the world');
    I.fillField('Location', 'Secret volcano lair');

    addAttendee(I, 'Evil Lair');
    addAttendee(I, 'Laser Sharks');

    I.click('Create');

    I.clickToolbar('New');
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

    I.login('app=io.ox/calendar');
    I.waitForVisible({ css: '*[data-app-name="io.ox/calendar"]' });

    // just to be sure, cleanup artefacts
    await I.dontHaveResource('Eggs');
    await I.dontHaveResource('Colors');

    await I.haveResource({ description: 'Eggs from happy chickens', display_name: 'Eggs', name: 'Eggs', mailaddress: 'eggs@easter.bunny' });
    await I.haveResource({ description: 'Colors for Easter Eggs. 100% gluten free, organic', display_name: 'Colors', name: 'Colors', mailaddress: 'colors@easter.bunny' });

    I.clickToolbar('New');
    I.waitForVisible('.io-ox-calendar-edit-window');

    I.fillField('Subject', 'Color Easter Eggs');
    I.fillField('Location', 'Easter Bunny house');

    addAttendee(I, 'Eggs');
    addAttendee(I, 'Colors');

    addAttendee(I, users[1].get('name'));
    addAttendee(I, users[2].get('name'));

    I.click('Create');

    I.clickToolbar('New');
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
