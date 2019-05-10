/**
* This work is provided under the terms of the CREATIVE COMMONS PUBLIC
* LICENSE. This work is protected by copyright and/or other applicable
* law. Any use of the work other than as authorized under this license
* or copyright law is prohibited.
*
* http://creativecommons.org/licenses/by-nc-sa/2.5/
* © 2017 OX Software GmbH, Germany. info@open-xchange.com
*
* @author Christoph Kopp <christoph.kopp@open-xchange.com>
*/

/// <reference path="../../steps.d.ts" />

const moment = require('moment');

Feature('Calendar Actions');

Before(async function (users) {
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

Scenario('Move event to different folder', async function (I) {
    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true }
    });
    const folder = `cal://0/${await I.grabDefaultFolder('calendar')}`;
    const time = moment().startOf('day').add(10, 'hours');
    const format = 'YYYYMMDD[T]HHmmss';
    const movefolder = 'New calendar';
    await I.haveAppointment({
        folder: folder,
        summary: 'test event',
        startDate: { value: time.format(format), tzid: 'Europe/Berlin' },
        endDate: { value: time.add(1, 'hour').format(format), tzid: 'Europe/Berlin' },
        attendees: []
    });

    await I.haveFolder(movefolder, 'event', folder);

    I.login('app=io.ox/calendar');

    // unselect folder
    I.click(locate('~New calendar').find('.color-label'));

    I.click('.weekview-container.workweek .appointment');
    I.click('.io-ox-sidepopup .inline-toolbar .more-dropdown');
    I.waitForElement('.smart-dropdown-container.dropdown.open');

    I.click('Move', '.smart-dropdown-container.dropdown.open');

    I.waitForElement('.folder-picker-dialog');

    I.waitForElement('[data-id="virtual/flat/event/private"] .folder-arrow', '.folder-picker-dialog');

    I.click('[data-id="virtual/flat/event/private"] .folder-arrow', '.folder-picker-dialog');
    I.waitForText(movefolder, '.folder-picker-dialog .selectable');

    I.click(locate('.folder-picker-dialog .selectable').find('~New calendar'));
    I.waitForText(movefolder, '.folder-picker-dialog .selected');
    I.wait(1);
    I.click('Move');

    I.waitForDetached('.folder-picker-dialog');

    I.seeElement('.weekview-container.workweek .appointment');
    I.seeElement('[aria-label="New calendar"][aria-checked="true"]');

});
