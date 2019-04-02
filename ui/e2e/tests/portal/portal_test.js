/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2018 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Daniel Pondruff <daniel.pondruff@open-xchange.com>
 */
/// <reference path="../../steps.d.ts" />

Feature('Portal').tag('6');

Before(async function (users) {
    await users.create();
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

Scenario('[C7471] Open items via portal-tile', async function (I, users) {
    // TODO: Need to add Appointment, latest file(upload?)
    const moment = require('moment');
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
    I.haveTask(task, { user: users[0] });

    //Create Contact
    const contact = {
        display_name: '' + testrailID + ', ' + testrailID + '',
        folder_id: await I.grabDefaultFolder('contacts', { user: users[0] }),
        first_name: testrailID,
        last_name: testrailID,
        birthday: moment().add(2, 'days').valueOf()

    };
    I.haveContact(contact, { user: users[0] });
    //Upload File to Infostore
    const infostoreFolderID = await I.grabDefaultFolder('infostore', { user: users[0] });
    await I.haveFile(infostoreFolderID, 'e2e/media/files/generic/testdocument.odt');

    //Create Appointment
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

    I.login('app=io.ox/portal', { user: users[0] });
    I.waitForVisible('.io-ox-portal-window');

    //Verifiy Inbox Widget
    I.waitForElement('.widget[aria-label="Inbox"] .item', 5);
    I.click('.item', '.widget[aria-label="Inbox"]');
    I.waitForElement('.io-ox-sidepopup', 5);
    I.waitForText(testrailID + ' - ' + testrailName, 5, '.io-ox-sidepopup-pane .subject');
    I.waitForText(users[0].userdata.display_name, 5, '.io-ox-sidepopup-pane .person-from');
    I.waitForText(users[0].userdata.primaryEmail, 5, '.io-ox-sidepopup-pane .address');
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
    I.click('.item', '.widget[aria-label="Birthdays"]');
    I.waitForDetached('.io-ox-sidepopup', 5);

    //Verify latest files
    I.waitForElement('.widget[aria-label="My latest files"] .item', 5);
    I.click('.item', '.widget[aria-label="My latest files"]');
    I.waitForElement('.io-ox-viewer');
    I.waitForText('testdocument.odt', 5, '.io-ox-viewer .filename-label');
    I.waitForText('testdocument.odt', 5, '.io-ox-viewer .viewer-sidebar-pane .file-name a');
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

    I.logout();
});
Scenario('[C7472] Check if the portalpage is up to date', async function (I, users) {
    // TODO: Need to add Appointment, latest file(upload?)
    //const moment = require('moment');
    let testrailID = 'C7472';
    let testrailName = 'Check if the portalpage is up to date';

    I.login('app=io.ox/portal', { user: users[0] });
    I.waitForVisible('.io-ox-portal-window');
    await I.haveMail({
        from: [[users[0].userdata.display_name, users[0].userdata.primaryEmail]],
        sendtype: 0,
        subject: testrailID + ' - ' + testrailName,
        to: [[users[0].userdata.display_name, users[0].userdata.primaryEmail]]
    });
    let element = await I.grabNumberOfVisibleElements('[aria-label="Inbox"] .item .sender');
    while (element === 0) {
        //TODO: need a limiter to avoid an endless loop
        I.waitForElement('#io-ox-refresh-icon', 5, '.taskbar');
        I.click('#io-ox-refresh-icon', '.taskbar');
        I.waitForElement('.launcher .fa-spin-paused', 5);
        I.wait(0.5);
        element = await I.grabNumberOfVisibleElements('[aria-label="Inbox"] .item .sender');
    }
    //Verifiy Inbox Widget
    I.waitForElement('.widget[aria-label="Inbox"] .item', 5);
    I.click('.item', '.widget[aria-label="Inbox"]');
    I.waitForElement('.io-ox-sidepopup', 5);
    I.waitForText(testrailID + ' - ' + testrailName, 5, '.io-ox-sidepopup-pane .subject');
    I.waitForText(users[0].userdata.display_name, 5, '.io-ox-sidepopup-pane .person-from');
    I.waitForText(users[0].userdata.primaryEmail, 5, '.io-ox-sidepopup-pane .address');
    I.click('.item', '.widget[aria-label="Inbox"]');
    I.waitForDetached('.io-ox-sidepopup', 5);
    I.logout();
    //TODO: Same for appointments, tasks birthdays and latest files.
});
Scenario('[C7482] Add a mail to portal', async function (I, users) {
    // TODO: Need to add Appointment, latest file(upload?)
    //const moment = require('moment');
    let testrailID = 'C7482';
    let testrailName = 'Add a mail to portal';
    await I.haveMail({
        from: [[users[0].userdata.display_name, users[0].userdata.primaryEmail]],
        sendtype: 0,
        subject: testrailID + ' - ' + testrailName,
        to: [[users[0].userdata.display_name, users[0].userdata.primaryEmail]]
    });
    I.login('app=io.ox/mail', { user: users[0] });
    I.waitForVisible('.io-ox-mail-window');
    I.waitForText('C7482 - Add a mail to portal', 5, { css: '.drag-title' });
    I.click('C7482 - Add a mail to portal', { css: '.drag-title' });
    I.waitForElement('article.mail-detail', 5);
    I.click('[aria-label="Mail Toolbar"] [data-action="more"]');
    I.waitForElement('.dropdown.open [data-action="io.ox/mail/actions/add-to-portal"]', 5);
    I.click('.dropdown.open [data-action="io.ox/mail/actions/add-to-portal"]');
    I.openApp('Portal');
    I.waitForVisible('.io-ox-portal-window');
    I.waitForElement('.io-ox-portal [aria-label="' + testrailID + ' - ' + testrailName + '"] .item', 5);
    I.waitForText(testrailID + ' - ' + testrailName, 5, '.io-ox-portal [aria-label="' + testrailID + ' - ' + testrailName + '"] .title');
    I.click('.item', '.io-ox-portal [aria-label="' + testrailID + ' - ' + testrailName + '"]');
    I.waitForElement('.io-ox-sidepopup', 5);
    I.waitForText(testrailID + ' - ' + testrailName, 5, '.io-ox-sidepopup-pane .subject');
    I.waitForText(users[0].userdata.display_name, 5, '.io-ox-sidepopup-pane .person-from');
    I.waitForText(users[0].userdata.primaryEmail, 5, '.io-ox-sidepopup-pane .address');
    I.click('.item', '.io-ox-portal [aria-label="' + testrailID + ' - ' + testrailName + '"]');
    I.waitForDetached('.io-ox-sidepopup', 5);
    I.logout();
});
Scenario('[C7475] Add inbox widget', async function (I, users) {
    // TODO: Need to add Appointment, latest file(upload?)
    //const moment = require('moment');
    let testrailID = 'C7475';
    let testrailName = 'Add inbox widget';
    await I.haveMail({
        from: [[users[0].userdata.display_name, users[0].userdata.primaryEmail]],
        sendtype: 0,
        subject: testrailID + ' - ' + testrailName,
        to: [[users[0].userdata.display_name, users[0].userdata.primaryEmail]]
    });
    I.haveSetting('io.ox/portal//widgets/user', '{}');
    I.login('app=io.ox/portal', { user: users[0] });
    I.waitForElement('.io-ox-portal .header .add-widget', 5);
    I.click({ css: '.add-widget' }, { css: '.io-ox-portal .header' });
    I.waitForElement('.dropdown.open [data-type="mail"]', 5);
    I.click({ css: '[data-type="mail"]' }, { css: '.dropdown.open' });
    I.waitForElement({ css: '.io-ox-dialog-wrapper' }, 5);
    I.click({ css: '[data-action="save"]' }, { css: '.io-ox-dialog-wrapper' });
    I.waitForElement('.widget[aria-label="Inbox"] .item', 5);
    I.click('.item', '.widget[aria-label="Inbox"]');
    I.waitForElement('.io-ox-sidepopup', 5);
    I.waitForText(testrailID + ' - ' + testrailName, 5, '.io-ox-sidepopup-pane .subject');
    I.waitForText(users[0].userdata.display_name, 5, '.io-ox-sidepopup-pane .person-from');
    I.waitForText(users[0].userdata.primaryEmail, 5, '.io-ox-sidepopup-pane .address');
    I.click('.item', '.widget[aria-label="Inbox"]');
    I.waitForDetached('.io-ox-sidepopup', 5);
    I.logout();
});
Scenario('[C7476] Add task widget', async function (I, users) {
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

    I.logout();
});
Scenario('[C7477] Add appointment widget', async function (I, users) {
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
    I.logout();
});
Scenario('[C7478] Add user data widget', async function (I, users) {
    I.haveSetting('io.ox/portal//widgets/user', '{}');
    I.login('app=io.ox/portal', { user: users[0] });
    I.waitForElement('.io-ox-portal .header .add-widget', 5);
    I.click({ css: '.add-widget' }, { css: '.io-ox-portal .header' });
    I.waitForElement('.dropdown.open [data-type="userSettings"]', 5);
    I.click({ css: '[data-type="userSettings"]' }, { css: '.dropdown.open' });
    I.waitForElement({ css: '.io-ox-portal [data-widget-type="userSettings"]' }, 5);
    I.waitForText('User data', 5, { css: '.io-ox-portal [data-widget-type="userSettings"] .title' });
    I.click('My contact data', { css: '.io-ox-portal [data-widget-type="userSettings"] .action' });
    I.waitForElement({ css: '.io-ox-contacts-edit-window.floating-window' }, 5);
    I.waitForText(users[0].userdata.sur_name + ', ' + users[0].userdata.given_name, 5, { css: '.io-ox-contacts-edit-window.floating-window .name' });
    I.click({ css: '.discard' }, { css: '.floating-window.io-ox-contacts-edit-window' });
    I.waitForDetached({ css: '.io-ox-contacts-edit-window.floating-window' }, 5);
    //Dirty ... I.click('My password', { css: '.io-ox-portal [data-widget-type="userSettings"] .action' }); is not working here
    I.click({ css: '.io-ox-portal [data-widget-type="userSettings"] .action:nth-child(2)' });
    I.waitForElement({ css: '.io-ox-dialog-wrapper' }, 5);
    I.waitForText('Change password', 5, { css: '.io-ox-dialog-wrapper #dialog-title' });
    I.waitForElement({ css: '.modal-body input.current-password' }, 5);
    I.waitForElement({ css: '.modal-body input.new-password' }, 5);
    I.waitForElement({ css: '.modal-body input.repeat-new-password' }, 5);
    I.click('Cancel', { css: '.modal-footer button' });
    I.waitForDetached({ css: '.io-ox-dialog-wrapper' }, 5);
    I.logout();
});
Scenario('[C7480] Add recently changed files widget', async function (I, users) {
    const infostoreFolderID = await I.grabDefaultFolder('infostore', { user: users[0] });
    await I.haveFile(infostoreFolderID, 'e2e/media/files/generic/testdocument.odt');
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
    I.waitForText('testdocument.odt', 5, '.io-ox-viewer .viewer-sidebar-pane .file-name a');
    I.click('.io-ox-viewer [data-action="io.ox/core/viewer/actions/toolbar/close"]');
    I.waitForDetached('.io-ox-viewer');
    I.logout();
});
