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

Feature('Calendar > Planning');

Before(async (users) => {
    await users.create();
    await users.create();
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});

Scenario('[C7443] Check availability of participants', async function (I, users) {

    I.login('app=io.ox/calendar');
    I.waitForVisible({ css: '*[data-app-name="io.ox/calendar"]' });

    I.clickToolbar('New');
    I.waitForVisible('.io-ox-calendar-edit-window');

    I.fillField('Subject', 'Abdancen');
    I.fillField('Location', 'Dancefloor');

    var addParticipant = function (user) {
        I.fillField('.add-participant.tt-input', user.get('name'));
        I.waitForVisible('.tt-dropdown-menu');
        I.pressKey('Enter');
    };

    addParticipant(users[1]);
    addParticipant(users[2]);

    I.click('Create');


    I.clickToolbar('New');
    I.waitForVisible('.io-ox-calendar-edit-window');

    addParticipant(users[1]);
    addParticipant(users[2]);

    I.click('Find a free time');
    I.waitForVisible({ css: '.freetime-popup' });
    I.seeNumberOfVisibleElements('~Abdancen', 3);
});

Scenario('[C7444] Check availability of resources', async function (I, users) {

    I.login('app=io.ox/calendar');
    I.waitForVisible({ css: '*[data-app-name="io.ox/calendar"]' });

    // just to be sure, cleanup artefacts
    await I.dontHaveResource('Evil Lair', { user: users[0] });
    await I.dontHaveResource('Laser Sharks', { user: users[0] });

    await I.haveResource({ description: 'Evil lair under an active volcano', display_name: 'Evil Lair', name: 'Evil Lair', mailaddress: 'lair@evil.inc' }, { user: users[0] });
    await I.haveResource({ description: 'Evil sharks equipped with lazers', display_name: 'Laser Sharks', name: 'Laser Sharks', mailaddress: 'lasersharks@evil.inc' }, { user: users[0] });

    I.clickToolbar('New');
    I.waitForVisible('.io-ox-calendar-edit-window');

    I.fillField('Subject', 'How to conquer the world');
    I.fillField('Location', 'Secret volcano lair');

    var addResource = function (name) {
        I.fillField('.add-participant.tt-input', name);
        I.waitForVisible('.tt-dropdown-menu');
        I.pressKey('Enter');
    };

    addResource('Evil Lair');
    addResource('Laser Sharks');

    I.click('Create');


    I.clickToolbar('New');
    I.waitForVisible('.io-ox-calendar-edit-window');

    addResource('Evil Lair');
    addResource('Laser Sharks');

    I.click('Find a free time');
    I.waitForVisible({ css: '.freetime-popup' });

    I.seeNumberOfVisibleElements('.freetime-table .appointment', 3);

    await I.dontHaveResource('Evil Lair', { user: users[0] });
    await I.dontHaveResource('Laser Sharks', { user: users[0] });
});
