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

const expect = require('chai').expect;

Feature('Calendar > Create');

Before(async ({ users }) => {
    await users.create();
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

//helper function for creating appointments, added ability to select color
const createAppointment = ({ subject, folder, startTime, color }) => {
    const { I } = inject();
    // select calendar
    I.clickToolbar('New appointment');
    I.waitForText('Appointments in public calendar');
    I.click('Create in public calendar');
    I.waitForVisible('.io-ox-calendar-edit-window');
    I.retry(5).fillField('Subject', subject);
    I.see(folder, '.io-ox-calendar-edit-window .folder-selection');
    if (startTime) {
        I.retry(3).click('~Start time');
        I.retry(3).click(startTime);
    }
    if (color) {
        I.click('Appointment color', '.color-picker-dropdown');
        I.waitForElement('.color-picker-dropdown.open');
        I.click(locate('a').inside('.color-picker-dropdown.open').withAttr({ title: color }));
    }

    // save
    I.click('Create', '.io-ox-calendar-edit-window');
    I.waitForDetached('.io-ox-calendar-edit-window', 5);
};

Scenario('[C264519] Create appointments with colors in public folder', async function ({ I, users, calendar, dialogs }) {
    const folderLocator = locate({ css: 'div.folder-node' }).withAttr({ title: 'New calendar' });
    const selectInsideFolder = (node) => locate(node).inside(folderLocator);

    I.login('app=io.ox/calendar');
    calendar.waitForApp();

    I.say('Create public calendar');
    I.waitForText('Add new calendar', 5, '.folder-tree');
    I.click('Add new calendar', '.folder-tree');

    I.clickDropdown('Personal calendar');

    dialogs.waitForVisible();
    I.waitForText('Add as public calendar', 5, dialogs.locators.body);
    I.checkOption('Add as public calendar', dialogs.locators.body);
    dialogs.clickButton('Add');
    I.waitForDetached('.modal-dialog');

    I.say('Grant permission to user b');
    I.click('.folder-node .folder-arrow .fa.fa-caret-right');
    I.selectFolder('New calendar');
    I.retry(3).click(selectInsideFolder({ css: 'a.folder-options' }));

    I.clickDropdown('Share / Permissions');
    dialogs.waitForVisible();
    I.waitForElement('.form-control.tt-input', 5, dialogs.locators.header);
    I.fillField('.form-control.tt-input', users[1].get('primaryEmail'));
    I.pressKey('Enter');
    dialogs.clickButton('Save');
    I.waitForDetached('.modal-dialog');

    I.say('create 2 test appointments with different colors');
    createAppointment({ subject: 'testing is fun', folder: 'New calendar', startTime: '8:00 AM', color: 'dark green' });
    createAppointment({ subject: 'testing is awesome', folder: 'New calendar', startTime: '10:00 AM', color: 'dark cyan' });
    I.logout();

    I.say('Login user b');
    I.waitForVisible('#io-ox-login-screen');
    I.login('app=io.ox/calendar', { user: users[1] });
    calendar.waitForApp();

    I.waitForVisible('.folder-node .folder-arrow .fa.fa-caret-right');
    I.click('.folder-node .folder-arrow .fa.fa-caret-right');
    I.selectFolder('New calendar');
    I.retry(3).click(selectInsideFolder({ css: 'div.color-label' }));
    //check if public appointments are there
    I.waitForText('testing is fun', 10, '.workweek');
    I.waitForText('testing is awesome', 10, '.workweek');
    //see if appointment colors still drawn with customized color (See Bug 65410)
    const appointmentColors = (await I.grabCssPropertyFromAll('.workweek .appointment', 'backgroundColor'))
        // webdriver resolves with rgba, puppeteer with rgb for some reason
        .map(c => c.indexOf('rgba') === 0 ? c : c.replace('rgb', 'rgba').replace(')', ', 1)'));
    expect(appointmentColors).to.deep.equal(['rgba(55, 107, 39, 1)', 'rgba(57, 109, 123, 1)']);
});

Scenario('[OXUIB-1143] Keep contact preview when changing appointment color', async function ({ I, users, mail }) {
    const user = users[0];
    await I.haveMail({
        attachments: [{
            content: 'Hello world!',
            content_type: 'text/html',
            disp: 'inline'
        }],
        from: [[user.get('display_name'), user.get('primaryEmail')]],
        subject: 'First mail!',
        to: [[users[0].get('display_name'), users[0].get('primaryEmail')]]
    }, { user });
    I.login('app=io.ox/mail', { user: user });
    mail.waitForApp();
    mail.selectMailByIndex(0);
    I.click('.person-link.person-from');
    I.waitForElement('[data-action="io.ox/contacts/actions/invite"]', 3);
    I.click('[data-action="io.ox/contacts/actions/invite"]');
    I.waitForElement('.color-picker-dropdown.dropdown', 3);
    I.click('.color-picker-dropdown.dropdown');
    I.click('[data-value="#C5C5C5"]');
    I.seeElement('.io-ox-halo');
});
