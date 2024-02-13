/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
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

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

// TODO: very shaky
Scenario.skip('Mail - Toolbar Navigation', async function ({ I, users, mail, toolbar }) {
    const [user] = users;
    let selector = '.classic-toolbar-container > ul[role="toolbar"]';
    await I.haveMail({
        subject: 'Test subject',
        from: [[user.get('displayname'), user.get('primaryEmail')]],
        to: [[user.get('displayname'), user.get('primaryEmail')]]
    });

    I.login();
    mail.waitForApp();

    // toolbar: unselect-state
    I.say('> toolbar: unselect-state');
    I.pressKey('Tab');
    I.pressKey('Tab');
    I.pressKey('Tab');
    I.pressKey('Tab');
    await toolbar.testFocus(selector);
    await toolbar.testWrapAround(selector);
    await toolbar.testDropdowns(selector);
    await toolbar.testTabindex(selector);

    // toolbar: select-state
    I.say('> toolbar: select-state');
    mail.selectMail('Test subject');
    I.pressKey(['Shift', 'Tab']);
    I.pressKey(['Shift', 'Tab']);
    await toolbar.testFocus(selector);
    await toolbar.testWrapAround(selector);
    //await toolbar.testDropdowns(selector);
    await toolbar.testTabindex(selector);

    //toolbar: list-view controls
    I.say('> toolbar: list-view controls');
    selector = '.list-view-control > ul[role="toolbar"]';
    I.pressKey('Tab');
    await toolbar.testFocus(selector);
    await toolbar.testWrapAround(selector);
    //await toolbar.testDropdowns(selector);
    await toolbar.testTabindex(selector);

    // toolbar: detail view
    I.say('> toolbar: detail view');
    selector = '.classic-toolbar-container > ul[role="toolbar"]';
    I.pressKey('Tab');
    I.pressKey('Tab');
    I.pressKey('Tab');
    I.pressKey('Tab');
    I.pressKey('Tab');
    I.pressKey('Tab');
    I.pressKey('Tab');
    await toolbar.testFocus(selector);
    await toolbar.testWrapAround(selector);
    //await toolbar.testDropdowns(selector);
    await toolbar.testTabindex(selector);

    // toolbar: detail view (floating window)
    I.say('> toolbar: detail view (floating window');
    selector = '.io-ox-mail-detail-window .inline-toolbar';
    I.doubleClick(locate('.list-view .list-item').first());
    I.waitForElement(selector);
    I.pressKey('Tab');
    I.pressKey('Tab');
    I.pressKey('Tab');
    I.pressKey('Tab');
    I.pressKey('Tab');
    I.pressKey('Tab');
    I.pressKey('Tab');
    await toolbar.testFocus(selector);
    await toolbar.testWrapAround(selector);
    //await toolbar.testDropdowns(selector);
    await toolbar.testTabindex(selector);

    // toolbar: compose
    I.say('> toolbar: compose');
    mail.newMail();
    I.pressKey('Tab');
    I.pressKey('Tab');
    I.pressKey('Tab');
    I.pressKey('Tab');
    I.pressKey('Tab');
    selector = '.composetoolbar';
    await toolbar.testFocus(selector);
    await toolbar.testWrapAround(selector);
    //await toolbar.testDropdowns(selector);
    await toolbar.testTabindex(selector);
});

Scenario('Calendar - Toolbar Navigation', async function ({ I, calendar, toolbar }) {

    const folder = `cal://0/${await I.grabDefaultFolder('calendar')}`;
    const time = moment().add(1, 'hours');
    const format = 'YYYYMMDD[T]HHmmss';
    let selector = '.classic-toolbar-container > ul[role="toolbar"]';
    await I.haveAppointment({
        folder: folder,
        summary: 'test appointment',
        startDate: { value: time.format(format), tzid: 'Europe/Berlin' },
        endDate: { value: time.add(1, 'hour').format(format), tzid: 'Europe/Berlin' }
    });

    I.login('app=io.ox/calendar&perspective=week:week');
    calendar.waitForApp();

    // toolbar: unselect-state
    I.say('> toolbar: unselect-state');
    I.pressKey('Tab');
    I.pressKey('Tab');
    I.pressKey('Tab');
    I.pressKey('Tab');
    await toolbar.testFocus(selector);
    await toolbar.testWrapAround(selector);
    //await toolbar.testDropdowns(selector);
    await toolbar.testTabindex(selector);

    // toolbar: sidepopup
    I.say('> toolbar: sidepopup');
    selector = '.io-ox-sidepopup-pane .inline-toolbar';
    I.click('.appointment');
    I.waitForElement(selector);
    I.pressKey('Tab');
    await toolbar.testFocus(selector);
    await toolbar.testWrapAround(selector);
    //await toolbar.testDropdowns(selector);
    await toolbar.testTabindex(selector);
    I.pressKey('Escape');
    I.waitForDetached(selector);

    // toolbar: unselect-state (list)
    I.say('> toolbar: unselect-state (list)');
    selector = '.classic-toolbar-container > ul[role="toolbar"]';
    I.clickToolbar(calendar.locators.view);
    I.click('List', calendar.locators.dropdown);
    I.waitForText('test appointment');
    I.pressKey('Tab');
    await toolbar.testFocus(selector);
    await toolbar.testWrapAround(selector);
    //await toolbar.testDropdowns(selector);
    await toolbar.testTabindex(selector);

    // toolbar: select-state
    I.say('> toolbar: select-state');
    I.click('.list-item.selectable');
    I.pressKey(['Shift', 'Tab']);
    await toolbar.testFocus(selector);
    await toolbar.testWrapAround(selector);
    //await toolbar.testDropdowns(selector);
    await toolbar.testTabindex(selector);

    // toolbar: detail view (floating window)
    I.say('> toolbar: detail view (floating window');
    selector = '.io-ox-calendar-detail-window .inline-toolbar';
    I.doubleClick(locate('.list-view .list-item.selectable').first());
    I.waitForElement(selector);
    I.pressKey('Tab');
    I.pressKey('Tab');
    I.pressKey('Tab');
    await toolbar.testFocus(selector);
    await toolbar.testWrapAround(selector);
    //await toolbar.testDropdowns(selector);
    await toolbar.testTabindex(selector);
});

Scenario('Drive - Toolbar Navigation', async function ({ I, drive, toolbar }) {

    let selector = '.classic-toolbar-container > ul[role="toolbar"]';

    await I.haveFile(await I.grabDefaultFolder('infostore'), { content: 'file', name: 'C45048.txt' });

    I.login('app=io.ox/files');
    drive.waitForApp();

    // toolbar: unselect-state
    I.say('> toolbar: unselect-state');
    I.pressKey('Tab');
    I.pressKey('Tab');
    I.pressKey('Tab');
    await toolbar.testFocus(selector);
    await toolbar.testWrapAround(selector);
    //await toolbar.testDropdowns(selector);
    await toolbar.testTabindex(selector);

    // toolbar: list-view controls
    // I.say('> toolbar: list-view controls');
    // selector = '.list-view-control > ul[role="toolbar"]';
    // I.pressKey('Tab');
    // await toolbar.testFocus(selector);
    // await toolbar.testWrapAround(selector);
    // await toolbar.testTabindex(selector);

    // toolbar: select-state
    I.say('> toolbar: select-state');
    selector = '.classic-toolbar-container > ul[role="toolbar"]';
    I.click(locate('.filename').withText('C45048.txt'));
    I.waitForText('Edit', 5, selector);
    I.pressKey(['Shift', 'Tab']);
    I.pressKey(['Shift', 'Tab']);
    I.pressKey(['Shift', 'Tab']);
    I.pressKey(['Shift', 'Tab']);
    await toolbar.testFocus(selector);
    await toolbar.testWrapAround(selector);
    //await toolbar.testDropdowns(selector);
    await toolbar.testTabindex(selector);

    I.say('> toolbar: file viewer');
    selector = '.viewer-toolbar > ul[role="toolbar"]';
    I.doubleClick('.list-item.file-type-txt');
    I.waitForElement(selector);
    I.pressKey('Tab');
    I.pressKey('Tab');
    I.pressKey('Tab');
    I.pressKey('Tab');
    I.pressKey('Tab');
    I.pressKey('Tab');
    await toolbar.testFocus(selector);
    await toolbar.testWrapAround(selector);
    //await toolbar.testDropdowns(selector);
    await toolbar.testTabindex(selector);
});

Scenario('Contacts - Toolbar Navigation', async function ({ I, contacts, toolbar }) {

    let selector = '.classic-toolbar-container > ul[role="toolbar"]';
    const contact = {
        //display_name: '' + testrailID + ', ' + testrailID + '',
        folder_id: await I.grabDefaultFolder('contacts'),
        first_name: 'Navigation',
        last_name: 'Toolbar'
    };
    await Promise.all([
        I.haveContact(contact)
    ]);

    I.login('app=io.ox/contacts');
    contacts.waitForApp();

    // toolbar: unselect-state
    I.say('> toolbar: unselect-state');
    I.waitForElement(selector);
    I.pressKey('Tab');
    I.pressKey('Tab');
    I.pressKey('Tab');
    await toolbar.testFocus(selector);
    await toolbar.testWrapAround(selector);
    //await toolbar.testDropdowns(selector);
    await toolbar.testTabindex(selector);

    // toolbar: select-state
    I.say('> toolbar: select-state');
    selector = '.classic-toolbar-container > ul[role="toolbar"]';
    contacts.selectContact('Toolbar, Navigation');
    I.waitForElement('~More actions');
    I.pressKey(['Shift', 'Tab']);
    I.pressKey(['Shift', 'Tab']);
    I.pressKey(['Shift', 'Tab']);
    await toolbar.testFocus(selector);
    await toolbar.testWrapAround(selector);
    //await toolbar.testDropdowns(selector);
    await toolbar.testTabindex(selector);

    // toolbar: detail view (floating window)
    I.say('> toolbar: detail view (floating window');
    selector = '.io-ox-contacts-detail-window .inline-toolbar';
    I.doubleClick(locate('.vgrid-cell.selectable').first());
    I.waitForElement(selector);
    I.pressKey('Tab');
    I.pressKey('Tab');
    await toolbar.testFocus(selector);
    await toolbar.testWrapAround(selector);
    //await toolbar.testDropdowns(selector);
    await toolbar.testTabindex(selector);
});

Scenario('Tasks - Toolbar Navigation', async function ({ I, tasks, toolbar }) {

    let selector = '.classic-toolbar-container > ul[role="toolbar"]';
    const taskDefaultFolder = await I.grabDefaultFolder('tasks');

    await Promise.all([
        I.haveFolder({ module: 'tasks', title: 'Empty', parent: taskDefaultFolder }),
        I.haveTask({ title: 'Toolbar Navigation', folder_id: taskDefaultFolder, note: 'Toolbar Navigation Details' })
    ]);

    I.login('app=io.ox/tasks&folder=52');
    tasks.waitForApp();

    // toolbar: unselect-state
    I.say('> toolbar: unselect-state');
    await I.selectFolder('Empty');
    I.waitForText('Empty');
    I.wait(2);
    for (let i = 1; i <= 4; i++) I.pressKey('Tab');

    //await toolbar.testFocus(selector);
    await toolbar.testWrapAround(selector);
    //await toolbar.testDropdowns(selector);
    await toolbar.testTabindex(selector);

    // toolbar: select-state
    I.say('> toolbar: select-state');
    await I.selectFolder('Tasks');
    tasks.selectTask('Toolbar Navigation');
    I.waitForElement('~More actions');
    I.pressKey(['Shift', 'Tab']);
    I.pressKey(['Shift', 'Tab']);
    I.pressKey(['Shift', 'Tab']);
    await toolbar.testFocus(selector);
    await toolbar.testWrapAround(selector);
    //await toolbar.testDropdowns(selector);
    await toolbar.testTabindex(selector);

    // toolbar: detail view (floating window)
    I.say('> toolbar: detail view (floating window');
    selector = '.detail-view-container ul[role="toolbar"]';
    I.doubleClick('~Toolbar Navigation, .');
    I.waitForElement(selector);
    I.pressKey('Tab');
    I.pressKey('Tab');
    await toolbar.testFocus(selector);
    await toolbar.testWrapAround(selector);
    //await toolbar.testDropdowns(selector);
    await toolbar.testTabindex(selector);
});

// TODO: fix core bug: all taskbar-buttons are reachable via tab until you press left or right once
Scenario.skip('Taskbar - Toolbar Navigation', async function ({ I, tasks, toolbar }) {

    let selector = '#io-ox-taskbar-container > ul[role="toolbar"]';

    I.login('app=io.ox/tasks&folder=52');
    tasks.waitForApp();

    // create minimized floating windows
    await ['#1', '#2', '#3'].forEach(async function (subject) {
        tasks.newTask();
        await within({ frame: '.floating-window.active' }, () => {
            I.fillField('Subject', subject);
            I.click('[data-action=minimize]');
        });
    });
    // navigate first element
    I.waitForDetached('.floating-window.active');
    I.pressKey(['Shift', 'Tab']);
    I.pressKey(['Shift', 'Tab']);

    // TODO: enable once bug was fixed
    // await toolbar.testFocussed(selector, 'button');
    // await toolbar.testWrapArround(selector, 'button');
    await toolbar.testTabindex(selector, 'button');
});
