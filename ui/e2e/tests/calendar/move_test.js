/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
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

Scenario('Move appointment to different folder', async function ({ I, dialogs, calendar }) {
    const folder = `cal://0/${await I.grabDefaultFolder('calendar')}`;
    const startDate = moment().startOf('day').add(10, 'hours').format('YYYYMMDD[T]HHmmss');
    const endDate   = moment().startOf('day').add(11, 'hours').format('YYYYMMDD[T]HHmmss');
    const newFolderName = 'New calendar';
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
        I.haveFolder({ title: newFolderName, module: 'event', parent: folder })
    ]);

    const defaultFolderNode = locate({ css: `.folder[data-id="${folder}"]` }).as('Default folder');

    I.login('app=io.ox/calendar');
    calendar.waitForApp();
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
        I.waitForText(newFolderName);
        I.click(`~${newFolderName}`);
    });
    dialogs.clickButton('Move');
    I.waitForDetached('.modal-dialog');
    I.pressKey('Escape');
    I.say('Deselect default folder');
    I.click(defaultFolderNode.find('.color-label.selected').as('Selected checkbox'));
    I.waitForElement(defaultFolderNode.find({ css: '.color-label:not(.selected)' }).as('Deselected checkbox'));

    I.say('Check');
    calendar.waitForApp();
    I.waitForVisible('.weekview-container.week .appointment');
    I.waitForElement('.weekview-container.week .appointment');
    I.waitForElement({ css: '[aria-label^="New calendar"][aria-checked="true"]' });
});

Scenario('Moving appointment updates sidepopup', async function ({ I, dialogs, calendar, users }) {
    const folder = `cal://0/${await I.grabDefaultFolder('calendar')}`;
    const startDate = moment().startOf('day').add(10, 'hours').format('YYYYMMDD[T]HHmmss');
    const endDate   = moment().startOf('day').add(11, 'hours').format('YYYYMMDD[T]HHmmss');
    const defaultFolderName = `${users[0].userdata.sur_name}, ${users[0].userdata.given_name}`;
    const newFolderName = 'New calendar';
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
        I.haveFolder({ title: newFolderName, module: 'event', parent: folder })
    ]);

    const defaultFolderNode = locate({ css: `.folder[data-id="${folder}"]` }).as('Default folder');

    I.login('app=io.ox/calendar');
    calendar.waitForApp();
    I.waitForVisible(defaultFolderNode);

    I.say('Open Sideboard');
    I.waitForVisible('.weekview-container.week .appointment');
    I.click('.weekview-container.week .appointment');
    I.waitForVisible('.io-ox-sidepopup .inline-toolbar .more-dropdown');

    // check original details
    I.waitForText(defaultFolderName, 5, '.details-table');

    I.say('Move Action');
    I.click('.io-ox-sidepopup .inline-toolbar .more-dropdown');
    I.waitForElement('.smart-dropdown-container.dropdown.open');
    I.click('Move', '.smart-dropdown-container.dropdown.open');

    I.say('Move to new folder');
    dialogs.waitForVisible();
    within('.modal-dialog', () => {
        I.waitForElement({ css: '[data-id="virtual/flat/event/private"] .folder-arrow' });
        I.click({ css: '[data-id="virtual/flat/event/private"] .folder-arrow' });
        I.waitForText(newFolderName);
        I.click(`~${newFolderName}`);
    });
    dialogs.clickButton('Move');
    I.waitForDetached('.modal-dialog');

    // check updated details
    I.waitForText(newFolderName, 5, '.details-table');

    // see OXUIB-1144: after moving an appointment, it should be possible to move the appointment again
    I.say('Move back to original folder');
    I.click('.io-ox-sidepopup .inline-toolbar .more-dropdown');
    I.waitForElement('.smart-dropdown-container.dropdown.open');
    I.click('Move', '.smart-dropdown-container.dropdown.open');
    dialogs.waitForVisible();
    within('.modal-dialog', () => {
        I.waitForText(defaultFolderName);
        I.click(`~${defaultFolderName}`);
    });
    dialogs.clickButton('Move');
    I.waitForDetached('.modal-dialog');
    I.waitForText(defaultFolderName, 5, '.details-table');
});
