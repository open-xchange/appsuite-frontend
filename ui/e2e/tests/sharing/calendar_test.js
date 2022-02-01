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

Feature('Sharing');

Before(async ({ users }) => {
    await users.create();
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C104305] Calendar folders using “Permissions” dialog and sharing link', async ({ I, users, calendar, dialogs }) => {
    let url;
    I.say('Alice shares a folder with 2 appointments');
    await Promise.all([
        I.haveSetting('io.ox/calendar//viewView', 'week:week', { user: users[0] }),
        I.haveSetting('io.ox/calendar//viewView', 'week:week', { user: users[1] })
    ]);
    await session('Alice', async () => {
        I.login('app=io.ox/calendar');
        calendar.newAppointment();
        I.fillField('Subject', 'simple appointment 1');
        await calendar.setDate('startDate', moment().startOf('week').add(1, 'day'));
        I.click('Create');
        I.waitToHide('.io-ox-calendar-edit');
        calendar.newAppointment();
        I.fillField('Subject', 'simple appointment 2');
        // select tomorrow
        await calendar.setDate('startDate', moment().startOf('week').add(3, 'day'));
        I.click('Create');
        I.waitToHide('.io-ox-calendar-edit');

        I.openFolderMenu(`${users[0].get('sur_name')}, ${users[0].get('given_name')}`);
        I.clickDropdown('Share / Permissions');
        dialogs.waitForVisible();
        I.waitForText('Viewer', 5, '.permission-pre-selection');
        I.click('~Select contacts');
        I.waitForElement('.modal .list-view.address-picker li.list-item');
        I.fillField('Search', users[1].get('name'));
        I.waitNumberOfVisibleElements({ css: '.modal .list-view .list-item' }, 1, 5);
        I.waitForText(users[1].get('name'), 5, '.address-picker');
        I.click('.address-picker .list-item');
        I.click({ css: 'button[data-action="select"]' });
        I.waitForDetached('.address-picker');
        I.waitForElement(locate('.permissions-view .row').at(2));
        I.waitForText('Viewer', 10, '.permissions-view');
        I.waitForText('Invited people only');
        I.selectOption('Who can access this calendar?', 'Anyone with the link and invited people');
        I.waitForText('Copy link', 5);
        I.click('Copy link');
        I.waitForElement('button[aria-label="Copy to clipboard"]:not([data-clipboard-text=""])');
        url = await I.grabAttributeFrom('button[aria-label="Copy to clipboard"]', 'data-clipboard-text');
        url = Array.isArray(url) ? url[0] : url;
        I.fillField('.message-text', 'Some text to trigger a mail');
        dialogs.clickButton('Save');
        I.waitForDetached('.modal-dialog');
        I.say(url);
    });

    const checkSharedCalendarFolder = () => {
        I.waitForText('simple appointment 1', 5, { css: '.appointment-container' });
        I.waitForText(users[0].get('sur_name') + ', ' + users[0].get('given_name'), 5, { css: '.io-ox-calendar-window .tree-container' });
        I.retry(5).seeNumberOfVisibleElements('.page.current .appointment', 2);
        I.see('simple appointment 2', { css: '.appointment-container' });

        I.say('check for missing edit rights');
        I.waitForVisible(locate('.appointment').inside('.page.current .weekview-container.week'));
        I.retry(5).click(locate('.appointment').inside('.page.current .weekview-container.week'));
        I.waitForElement('.io-ox-sidepopup');
        I.dontSee('Edit', '.io-ox-sidepopup');
        I.click('~Close', '.io-ox-sidepopup');
    };

    I.say('Bob receives the share');
    await session('Bob', async () => {
        I.login('app=io.ox/mail', { user: users[1] });
        I.waitForText('has shared the calendar', undefined, '.list-view');
        I.click(locate('li.list-item'));
        I.waitForElement('.mail-detail-frame');
        within({ frame: '.mail-detail-frame' }, () => {
            I.waitForText('View calendar');
            I.click('View calendar');
        });
        I.waitForElement('.io-ox-calendar-main');
        calendar.waitForApp();
        checkSharedCalendarFolder();
    });

    I.say('Eve uses external link to shared folder');
    await session('Eve', () => {
        I.haveSetting('io.ox/calendar//viewView', 'week:week');
        I.amOnPage(url);
        I.waitForElement('.io-ox-calendar-main', 30);
        calendar.switchView('Week');
        I.waitForVisible({ css: '[data-page-id="io.ox/calendar/week:week"]' });
        calendar.waitForApp();
        checkSharedCalendarFolder();
        I.logout();
    });

    I.say('Alice revoces access');
    await session('Alice', () => {
        I.openFolderMenu(`${users[0].get('sur_name')}, ${users[0].get('given_name')}`);
        I.clickDropdown('Share / Permissions');
        dialogs.waitForVisible();
        I.waitForVisible({ css: `[aria-label="${users[1].get('sur_name')}, ${users[1].get('given_name')}, Internal user."]` });
        I.click(locate({ css: 'button[title="Actions"]' }).inside('.modal'));
        I.waitForText('Revoke access');
        I.click('Revoke access');
        I.waitForInvisible({ css: `[aria-label="${users[1].get('sur_name')}, ${users[1].get('given_name')}, Internal user."]` });
        dialogs.clickButton('Save');
        I.waitForDetached('.modal-dialog');

        I.openFolderMenu(`${users[0].get('sur_name')}, ${users[0].get('given_name')}`);
        I.clickDropdown('Share / Permissions');
        dialogs.waitForVisible();
        dialogs.clickButton('Unshare');
        dialogs.waitForVisible();
        dialogs.clickButton('OK');
    });

    I.say('Bob has no access');
    await session('Bob', () => {
        I.refreshPage();
        calendar.waitForApp();
        I.retry(5).seeNumberOfElements(locate('.appointment').inside('.io-ox-calendar-main'), 0);
        I.dontSee('simple appointment 1', '.io-ox-calendar-main');
        I.dontSee('simple appointment 2', '.io-ox-calendar-main');
    });
    I.say('Eve has no access');
    await session('Eve', () => {
        I.amOnPage(url);
        I.waitForText('The share you are looking for does not exist.');
    });
});
