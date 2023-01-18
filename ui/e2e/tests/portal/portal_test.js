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

let assert = require('assert');

Feature('Portal');

Before(async function ({ users }) {
    await users.create();
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

Scenario('[C7471] Open items via portal-tile', async function ({ I, users }) {
    // TODO: Need to add Appointment, latest file(upload?)
    const moment = require('moment');
    const utcDiff = (moment().utcOffset()) / 60; // offset by X hours for api calls
    let testrailID = 'C7471';
    let testrailName = 'Open items via portal-tile';
    //Create Mail in Inbox
    await I.haveMail({
        from: [[users[0].userdata.display_name, users[0].userdata.primaryEmail]],
        sendtype: 0,
        subject: testrailID + ' - ' + testrailName,
        to: [[users[0].userdata.display_name, users[0].userdata.primaryEmail]]
    });
    //Create Task
    const taskDefaultFolder = await I.grabDefaultFolder('tasks', { user: users[0] });
    const task = {
        title: testrailID,
        folder_id: taskDefaultFolder,
        note: testrailName,
        full_time: true,
        notification: true,
        private_flag: false,
        timezone: 'Europe/Berlin',
        start_time: moment().valueOf(),
        end_time: moment().add(2, 'days').valueOf(),
        days: 2
    };
    await I.haveTask(task, { user: users[0] });

    //Create Contact
    const contact = {
        display_name: '' + testrailID + ', ' + testrailID + '',
        folder_id: await I.grabDefaultFolder('contacts', { user: users[0] }),
        first_name: testrailID,
        last_name: testrailID,
        birthday: moment().add(2, 'days').add(utcDiff, 'hours').valueOf()
    };
    await I.haveContact(contact, { user: users[0] });
    //Upload File to Infostore
    const infostoreFolderID = await I.grabDefaultFolder('infostore', { user: users[0] });
    await I.haveFile(infostoreFolderID, 'media/files/generic/testdocument.odt');

    //Create Appointment
    const appointmentDefaultFolder = await I.grabDefaultFolder('calendar', { user: users[0] });
    await I.haveAppointment({
        folder: 'cal://0/' + appointmentDefaultFolder,
        summary: testrailID,
        location: testrailID,
        description: testrailID,
        endDate: {
            tzid: 'Europe/Berlin',
            value: moment().add(4 + utcDiff, 'hours').format('YYYYMMDD[T]HHmm00')
        },
        startDate: {
            tzid: 'Europe/Berlin',
            value: moment().add(2 + utcDiff, 'hours').format('YYYYMMDD[T]HHmm00')
        }
    }, { user: users[0] });

    I.login('app=io.ox/portal', { user: users[0] });
    I.waitForVisible('.io-ox-portal-window');

    //Verifiy Inbox Widget
    I.waitForElement('.widget[aria-label="Inbox"] .item', 5);
    I.click('.item', '.widget[aria-label="Inbox"]');
    I.waitForElement('.io-ox-sidepopup', 5);
    I.waitForText(testrailID + ' - ' + testrailName, 5, '.io-ox-sidepopup-pane .subject');
    I.waitForText(users[0].userdata.display_name, 5, '.io-ox-sidepopup-pane');
    I.waitForText(users[0].userdata.primaryEmail, 5, '.io-ox-sidepopup-pane');
    I.click('.item', '.widget[aria-label="Inbox"]');
    I.waitForDetached('.io-ox-sidepopup', 5);

    //Verify Tasks Widget
    I.waitForElement('.widget[aria-label="My tasks"] .item', 5);
    I.click('.item', '.widget[aria-label="My tasks"]');
    I.waitForElement('.io-ox-sidepopup', 5);
    I.waitForText(testrailID, 5, '.io-ox-sidepopup-pane .tasks-detailview .title');
    I.waitForText(testrailName, 5, '.io-ox-sidepopup-pane .tasks-detailview .note');
    I.click('.item', '.widget[aria-label="My tasks"]');
    I.waitForDetached('.io-ox-sidepopup', 5);

    //Verify Birthday
    I.waitForElement('.widget[aria-label="Birthdays"] .item', 5);
    I.click('.item', '.widget[aria-label="Birthdays"]');
    I.waitForElement('.io-ox-sidepopup', 5);
    I.waitForText(testrailID + ', ' + testrailID, 5, '.io-ox-sidepopup-pane .birthday .name');
    I.waitForText(moment().add(2, 'days').format('M/D/YYYY'), 5, '.io-ox-sidepopup-pane .birthday .date');
    I.waitForText('In 2 days', 5, '.io-ox-sidepopup-pane .birthday .distance');
    I.click('~Close', '.io-ox-sidepopup');
    I.waitForDetached('.io-ox-sidepopup', 5);

    //Verify latest files
    I.waitForElement('.widget[aria-label="My latest files"] .item', 5);
    I.click('.item', '.widget[aria-label="My latest files"]');
    I.waitForElement('.io-ox-viewer');
    I.waitForText('testdocument.odt', 5, '.io-ox-viewer .filename-label');
    I.waitForText('testdocument.odt', 5, '.io-ox-viewer .viewer-sidebar-pane .file-name');
    I.click('.io-ox-viewer [data-action="io.ox/core/viewer/actions/toolbar/close"]');
    I.waitForDetached('.io-ox-viewer');

    I.waitForElement('.widget[aria-label="Appointments"] .item', 5);
    I.click('.item', '.widget[aria-label="Appointments"]');
    I.waitForElement('.io-ox-sidepopup', 5);
    I.waitForText(testrailID, 5, '.io-ox-sidepopup-pane h1.subject');
    I.waitForText(testrailID, 5, '.io-ox-sidepopup-pane div.location');
    //TODO: Verifiy Date
    I.click('.item', '.widget[aria-label="Appointments"]');
    I.waitForDetached('.io-ox-sidepopup', 5);
});

Scenario('[C7472] Check if the portalpage is up to date', async function ({ I, users }) {
    // TODO: Need to add Appointment, latest file(upload?)
    //const moment = require('moment');
    let testrailID = 'C7472';
    let testrailName = 'Check if the portalpage is up to date';
    let retries = 5;

    I.login('app=io.ox/portal', { user: users[0] });
    I.waitForVisible('.io-ox-portal-window');
    await I.haveMail({
        from: [[users[0].userdata.display_name, users[0].userdata.primaryEmail]],
        sendtype: 0,
        subject: testrailID + ' - ' + testrailName,
        to: [[users[0].userdata.display_name, users[0].userdata.primaryEmail]]
    });
    let element = await I.grabNumberOfVisibleElements('[aria-label="Inbox"] .item .person');
    while (element === 0 && retries) {
        retries--;
        I.waitForElement('#io-ox-refresh-icon', 5, '.taskbar');
        I.click('.taskbar #io-ox-refresh-icon');
        I.waitForElement('.launcher .fa-spin-paused', 5);
        I.wait(0.5);
        element = await I.grabNumberOfVisibleElements({ css: '[aria-label="Inbox"] .item .person' });
        if (!retries) assert.fail('Timeout waiting for element');
    }
    //Verifiy Inbox Widget
    I.waitForElement('.widget[aria-label="Inbox"] .item', 5);
    I.click('.item', '.widget[aria-label="Inbox"]');
    I.waitForElement('.io-ox-sidepopup', 5);
    I.waitForText(testrailID + ' - ' + testrailName, 5, '.io-ox-sidepopup-pane .subject');
    I.waitForText(users[0].userdata.display_name, 5, '.io-ox-sidepopup-pane');
    I.waitForText(users[0].userdata.primaryEmail, 5, '.io-ox-sidepopup-pane');
    I.click('~Close', '.io-ox-sidepopup');
    I.waitForDetached('.io-ox-sidepopup', 5);
    //TODO: Same for appointments, tasks birthdays and latest files.
});

Scenario('[C7482] Add a mail to portal', async function ({ I, users, mail }) {
    // TODO: Need to add Appointment, latest file(upload?)
    //const moment = require('moment');
    const testrailID = 'C7482',
        testrailName = 'Add a mail to portal',
        testSubject = testrailID + ' - ' + testrailName;
    await I.haveMail({
        from: [[users[0].userdata.display_name, users[0].userdata.primaryEmail]],
        sendtype: 0,
        subject: testSubject,
        to: [[users[0].userdata.display_name, users[0].userdata.primaryEmail]]
    });
    I.login('app=io.ox/mail', { user: users[0] });
    mail.waitForApp();
    mail.selectMail(testSubject);
    I.waitForElement('.mail-detail');
    I.click('~More actions', '.mail-detail-pane');
    I.waitForElement('.dropdown.open', 5);
    I.click('Add to portal', '.dropdown.open .dropdown-menu');
    I.openApp('Portal');
    I.waitForVisible('.io-ox-portal-window');
    I.waitForElement('.io-ox-portal [aria-label="' + testSubject + '"] .item', 5);
    I.waitForText(testSubject, 5, '.io-ox-portal [aria-label="' + testSubject + '"] .title');
    I.click('.item', '.io-ox-portal [aria-label="' + testSubject + '"]');
    I.waitForElement('.io-ox-sidepopup', 5);
    I.waitForText(testSubject, 5, '.io-ox-sidepopup-pane .subject');
    I.waitForText(users[0].userdata.display_name, 5, '.io-ox-sidepopup-pane');
    I.waitForText(users[0].userdata.primaryEmail, 5, '.io-ox-sidepopup-pane');
    I.click('.item', '.io-ox-portal [aria-label="' + testSubject + '"]');
    I.waitForDetached('.io-ox-sidepopup', 5);
});

Scenario('[C7475] Add inbox widget', async function ({ I, portal, users, dialogs }) {
    // TODO: Need to add Appointment, latest file(upload?)
    //const moment = require('moment');
    const testrailID = 'C7475',
        testrailName = 'Add inbox widget',
        subject = `${testrailID} - ${testrailName}`,
        user = users[0].userdata;
    await I.haveMail({
        from: [[user.display_name, user.primaryEmail]],
        sendtype: 0,
        subject,
        to: [[user.display_name, user.primaryEmail]]
    });
    I.haveSetting('io.ox/portal//widgets/user', '{}');
    I.login('app=io.ox/portal');
    portal.waitForApp();

    I.waitForElement('.io-ox-portal .header .add-widget');
    I.click('Add widget');
    I.clickDropdown('Inbox');

    dialogs.waitForVisible();
    dialogs.clickButton('Save');
    I.waitForDetached('.modal-dialog');

    I.waitForElement(locate('.widget .item').withText(subject));
    I.click(subject, '.widget .item');
    I.waitForElement('.io-ox-sidepopup');
    I.waitForText(subject, undefined, '.io-ox-sidepopup');
    I.waitForText(user.display_name, undefined, '.io-ox-sidepopup');
    I.waitForText(user.primaryEmail, undefined, '.io-ox-sidepopup');
    I.click('Inbox', '.widget');
    I.waitForDetached('.io-ox-sidepopup');
});

Scenario('[C7476] Add task widget', async function ({ I, users }) {
    const moment = require('moment');
    let testrailID = 'C7476';
    let testrailName = 'Add task widget';
    const taskDefaultFolder = await I.grabDefaultFolder('tasks', { user: users[0] });
    const task = {
        title: testrailID,
        folder_id: taskDefaultFolder,
        note: testrailName,
        full_time: true,
        notification: true,
        private_flag: false,
        timezone: 'Europe/Berlin',
        start_time: moment().valueOf(),
        end_time: moment().add(2, 'days').valueOf(),
        days: 2
    };
    I.haveTask(task, { user: users[0] });
    I.haveSetting('io.ox/portal//widgets/user', '{}');

    I.login('app=io.ox/portal', { user: users[0] });
    I.waitForElement('.io-ox-portal .header .add-widget', 5);
    I.click({ css: '.add-widget' }, { css: '.io-ox-portal .header' });
    I.waitForElement('.dropdown.open [data-type="tasks"]', 5);
    I.click({ css: '[data-type="tasks"]' }, { css: '.dropdown.open' });


    I.waitForElement('.widget[aria-label="My tasks"] .item', 5);
    I.click('.item', '.widget[aria-label="My tasks"]');
    I.waitForElement('.io-ox-sidepopup', 5);
    I.waitForText(testrailID, 5, '.io-ox-sidepopup-pane .tasks-detailview .title');
    I.waitForText(testrailName, 5, '.io-ox-sidepopup-pane .tasks-detailview .note');
    I.click('.item', '.widget[aria-label="My tasks"]');
    I.waitForDetached('.io-ox-sidepopup', 5);
});

Scenario('[C7477] Add appointment widget', async function ({ I, users }) {
    const moment = require('moment');
    let testrailID = 'C7477';

    const appointmentDefaultFolder = await I.grabDefaultFolder('calendar', { user: users[0] });
    I.haveAppointment({
        folder: 'cal://0/' + appointmentDefaultFolder,
        summary: testrailID,
        location: testrailID,
        description: testrailID,
        endDate: {
            tzid: 'Europe/Berlin',
            value: moment().add(4, 'hours').format('YYYYMMDD[T]HHmm00')
        },
        startDate: {
            tzid: 'Europe/Berlin',
            value: moment().add(2, 'hours').format('YYYYMMDD[T]HHmm00')
        }
    }, { user: users[0] });
    I.haveSetting('io.ox/portal//widgets/user', '{}');
    I.login('app=io.ox/portal', { user: users[0] });
    I.waitForElement('.io-ox-portal .header .add-widget', 5);
    I.click({ css: '.add-widget' }, { css: '.io-ox-portal .header' });
    I.waitForElement('.dropdown.open [data-type="calendar"]', 5);
    I.click({ css: '[data-type="calendar"]' }, { css: '.dropdown.open' });
    I.waitForElement('.widget[aria-label="Appointments"] .item', 5);
    I.click('.item', '.widget[aria-label="Appointments"]');
    I.waitForElement('.io-ox-sidepopup', 5);
    I.waitForText(testrailID, 5, '.io-ox-sidepopup-pane h1.subject');
    I.waitForText(testrailID, 5, '.io-ox-sidepopup-pane div.location');
    I.click('.item', '.widget[aria-label="Appointments"]');
    I.waitForDetached('.io-ox-sidepopup', 5);
});

Scenario('[C7478] Add user data widget', async function ({ I, users, portal }) {
    await I.haveSetting('io.ox/portal//widgets/user', '{}');
    I.login('app=io.ox/portal');
    portal.waitForApp();
    portal.addWidget('User data');
    I.click('My contact data', '.widget');
    I.waitForElement({ css: '.io-ox-contacts-edit-window' });
    I.waitForText(users[0].userdata.sur_name + ', ' + users[0].userdata.given_name, undefined, { css: '.io-ox-contacts-edit-window .contact-summary' });
    I.click('Discard', { css: '.io-ox-contacts-edit-window' });
    I.waitForDetached({ css: '.io-ox-contacts-edit-window' });

    // TODO when we have multiple backends with non-sso login, this can be reenabled
    /*
    I.click('My password', '.widget');

    dialogs.waitForVisible();
    I.waitForText('Change password', 5, dialogs.locators.header);
    I.see('Your current password');
    I.see('New password');
    I.see('Repeat new password');
    dialogs.clickButton('Cancel');
    I.waitForDetached('.modal-dialog');
    */
});

Scenario('[C7480] Add recently changed files widget', async function ({ I, users }) {
    const infostoreFolderID = await I.grabDefaultFolder('infostore', { user: users[0] });
    await I.haveFile(infostoreFolderID, 'media/files/generic/testdocument.odt');
    I.haveSetting('io.ox/portal//widgets/user', '{}');
    I.login('app=io.ox/portal', { user: users[0] });
    I.waitForElement('.io-ox-portal .header .add-widget', 5);
    I.click({ css: '.add-widget' }, { css: '.io-ox-portal .header' });
    I.waitForElement('.dropdown.open [data-type="myfiles"]', 5);
    I.click({ css: '[data-type="myfiles"]' }, { css: '.dropdown.open' });
    I.waitForElement('.widget[aria-label="My latest files"] .item', 5);
    I.click('.item', '.widget[aria-label="My latest files"]');
    I.waitForElement('.io-ox-viewer');
    I.waitForText('testdocument.odt', 5, '.io-ox-viewer .filename-label');
    I.waitForText('testdocument.odt', 5, '.io-ox-viewer .viewer-sidebar-pane .file-name');
    I.click('.io-ox-viewer [data-action="io.ox/core/viewer/actions/toolbar/close"]');
    I.waitForDetached('.io-ox-viewer');
});
