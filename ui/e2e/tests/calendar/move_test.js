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

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

Scenario('Move appointment to different folder', async function ({ I, dialogs }) {
    const folder = `cal://0/${await I.grabDefaultFolder('calendar')}`;
    const startDate = moment().startOf('day').add(10, 'hours').format('YYYYMMDD[T]HHmmss');
    const endDate   = moment().startOf('day').add(11, 'hours').format('YYYYMMDD[T]HHmmss');
    const folderName = 'New calendar';
    await Promise.all([
        I.haveSetting({
            'io.ox/core': { autoOpenNotification: false, showDesktopNotifications: false },
            'io.ox/calendar': { showCheckboxes: true, viewView: 'week:week' }
        }),
        I.haveAppointment({
            folder,
            summary: 'test event',
            startDate: { tzid: 'Europe/Berlin', value: startDate },
            endDate:   { tzid: 'Europe/Berlin', value: endDate },
            attendees: []
        }),
        I.haveFolder({ title: folderName, module: 'event', parent: folder })
    ]);

    const defaultFolderNode = locate({ css: `.folder[data-id="${folder}"]` }).as('Default folder');

    I.login('app=io.ox/calendar');
    I.waitForVisible(defaultFolderNode);

    I.say('Open Sideboard');
    I.waitForVisible('.weekview-container.week .appointment');
    I.click('.weekview-container.week .appointment');
    I.waitForVisible('.io-ox-sidepopup .inline-toolbar .more-dropdown');

    I.say('Move Action');
    I.click('.io-ox-sidepopup .inline-toolbar .more-dropdown');
    I.waitForElement('.smart-dropdown-container.dropdown.open');
    I.click('Move', '.smart-dropdown-container.dropdown.open');

    I.say('Move to new folder');
    dialogs.waitForVisible();
    within('.modal-dialog', () => {
        I.waitForElement({ css: '[data-id="virtual/flat/event/private"] .folder-arrow' });
        I.click({ css: '[data-id="virtual/flat/event/private"] .folder-arrow' });
        I.waitForText(folderName);
        I.click(`~${folderName}`);
    });
    dialogs.clickButton('Move');
    I.waitForDetached('.modal-dialog');

    I.say('Deselect default folder');
    I.click(defaultFolderNode.find('.color-label.selected').as('Selected checkbox'));
    I.waitForElement(defaultFolderNode.find({ css: '.color-label:not(.selected)' }).as('Deselected checkbox'));

    I.say('Check');
    I.waitForVisible('.weekview-container.week .appointment');
    I.seeElement('.weekview-container.week .appointment');
    I.seeElement({ css: '[aria-label^="New calendar"][aria-checked="true"]' });
});
