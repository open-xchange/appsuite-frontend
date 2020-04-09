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

Feature('Calendar > Actions');

Before(async function (users) {
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

Scenario('Move appointment to different folder', async function (I) {
    await I.haveSetting({
        'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
        'io.ox/calendar': { showCheckboxes: true, viewView: 'week:week' }
    });
    const folder = `cal://0/${await I.grabDefaultFolder('calendar')}`;
    const time = moment().startOf('day').add(10, 'hours');
    const format = 'YYYYMMDD[T]HHmmss';
    const folderName = 'New calendar';
    await I.haveAppointment({
        folder: folder,
        summary: 'test event',
        startDate: { value: time.format(format), tzid: 'Europe/Berlin' },
        endDate: { value: time.add(1, 'hour').format(format), tzid: 'Europe/Berlin' },
        attendees: []
    });

    await I.haveFolder({ title: folderName, module: 'event', parent: folder });

    let defaultFolderNode = locate({ css: `.folder[data-id="${folder}"]` }).as('Default folder');
    let folderPicker = locate({ css: '.folder-picker-dialog' }).as('Folder picker');

    I.login('app=io.ox/calendar');
    I.waitForVisible(defaultFolderNode);

    I.say('Open Sideboard');
    I.waitForVisible('.weekview-container.week .appointment');
    I.click('.weekview-container.week .appointment');
    I.waitForVisible('.io-ox-sidepopup');

    I.say('Move Action');
    I.click('.io-ox-sidepopup .inline-toolbar .more-dropdown');
    I.waitForElement('.smart-dropdown-container.dropdown.open');
    I.click('Move', '.smart-dropdown-container.dropdown.open');

    I.say('Move to new folder');
    I.waitForElement(folderPicker);
    I.waitForElement({ css: '[data-id="virtual/flat/event/private"] .folder-arrow' }, folderPicker);
    I.click({ css: '[data-id="virtual/flat/event/private"] .folder-arrow' }, folderPicker);
    I.waitForText(folderName, folderPicker);
    I.click(folderPicker.find('.selectable[aria-label^="New calendar"]'));
    I.waitForText(folderName, folderPicker);
    I.waitForElement(locate({ css: '.btn-primary:not(disabled)' }).as('Enabled move button'));
    I.wait(0.2);
    I.click('Move');
    I.waitForDetached(folderPicker);

    I.say('Deselect default folder');
    I.click(defaultFolderNode.find('.color-label.selected').as('Selected checkbox'));
    I.waitForElement(defaultFolderNode.find({ css: '.color-label:not(.selected)' }).as('Deselected checkbox'));

    I.say('Check');
    I.waitForVisible('.weekview-container.week .appointment');
    I.seeElement('.weekview-container.week .appointment');
    I.seeElement({ css: '[aria-label^="New calendar"][aria-checked="true"]' });
});
