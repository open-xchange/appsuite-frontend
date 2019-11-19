/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 *
 */

/// <reference path="../../steps.d.ts" />

const moment = require('moment');

Feature('Sharing');

Before(async (users) => {
    await users.create();
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});

Scenario('[C104305] calendar folders using “Permisions” dialog and sharing link', async (I, users, calendar) => {
    let url;
    I.say('Alice shares a folder with 2 appointments');
    session('Alice', async () => {
        I.login('app=io.ox/calendar');
        calendar.newAppointment();
        I.fillField('Subject', 'simple appointment 1');
        I.click('Create');
        I.waitToHide('.io-ox-calendar-edit');
        calendar.newAppointment();
        I.fillField('Subject', 'simple appointment 2');
        // select tomorrow
        await calendar.setDate('startDate', moment().add(1, 'day'));
        I.click('Create');
        I.waitToHide('.io-ox-calendar-edit');

        I.openFolderMenu(`${users[0].get('sur_name')}, ${users[0].get('given_name')}`);
        I.clickDropdown('Permissions / Invite people');

        I.waitForElement('.modal');
        I.click('~Select contacts');
        I.waitForElement('.modal .list-view.address-picker li.list-item');
        I.fillField('Search', users[1].get('name'));
        I.waitForText(users[1].get('name'), 5, '.address-picker');
        I.click('.address-picker .list-item');
        I.click({ css: 'button[data-action="select"]' });
        I.waitForDetached('.address-picker');
        I.waitForElement(locate('.permissions-view .row').at(2));
        I.click('Author');
        I.clickDropdown('Viewer');

        I.click('Save', '.modal');
        I.waitToHide('.modal');

        I.click({ css: `.folder-tree [title="Actions for ${users[0].get('sur_name')}, ${users[0].get('given_name')}"]` });
        I.click(locate('a').withText('Create sharing link').inside('.dropdown'));
        I.waitForFocus('.share-wizard input[type="text"]');
        url = await I.grabValueFrom('.share-wizard input[type="text"]');
        url = Array.isArray(url) ? url[0] : url;
        I.click('Close');
    });

    const checkSharedCalendarFolder = () => {
        I.waitForText('simple appointment 1');
        I.waitForText(`${users[0].get('sur_name')}, ${users[0].get('given_name')}`);
        I.seeNumberOfElements('.appointment', 2);
        I.see('simple appointment 2');

        I.say('check for missing edit rights');
        I.click(locate('.appointment').at(1));
        I.waitForElement('.io-ox-sidepopup');
        I.dontSee('Edit', '.io-ox-sidepopup');
        I.click('~Close', '.io-ox-sidepopup');
    };

    I.say('Bob receives the share');
    session('Bob', () => {
        I.login('app=io.ox/mail', { user: users[1] });
        I.waitForText('has shared the calendar', undefined, '.list-view');
        I.click(locate('li.list-item'));
        I.waitForElement('.mail-detail-frame');
        within({ frame: '.mail-detail-frame' }, () => {
            I.waitForText('View calendar');
            I.click('View calendar');
        });
        I.waitForElement('.io-ox-calendar-main');
        // SHAKY: 'TypeError: Cannot read property 'mainFrame' of null'
        // SHAKY: 'Node is either not visible or not an HTMLElement'
        within('.io-ox-calendar-main', checkSharedCalendarFolder);
    });

    I.say('Eve uses external link to shared folder');
    session('Eve', () => {
        I.amOnPage(url);
        I.waitForElement('.io-ox-calendar-main', 30);
        within('.io-ox-calendar-main', checkSharedCalendarFolder);
    });

    I.say('Alice revoces access');
    session('Alice', () => {
        I.openFolderMenu(`${users[0].get('sur_name')}, ${users[0].get('given_name')}`);
        I.clickDropdown('Permissions / Invite people');
        I.waitForElement('.modal');
        I.click(locate({ css: 'button[title="Actions"]' }).inside('.modal'));
        I.click('Revoke access');
        I.click('Save');
        I.waitToHide('.modal');

        I.openFolderMenu(`${users[0].get('sur_name')}, ${users[0].get('given_name')}`);
        I.clickDropdown('Create sharing link');
        I.waitForFocus('.share-wizard input[type="text"]');
        I.click('Remove link');
    });

    I.say('Bob has no access');
    session('Bob', () => {
        I.triggerRefresh();
        I.seeNumberOfElements(locate('.appointment').inside('.io-ox-calendar-main'), 0);
        I.dontSee('simple appointment 1', '.io-ox-calendar-main');
        I.dontSee('simple appointment 2', '.io-ox-calendar-main');
    });
    I.say('Eve has no access');
    session('Eve', () => {
        I.amOnPage(url);
        I.waitForText('The share you are looking for does not exist.');
    });
});
