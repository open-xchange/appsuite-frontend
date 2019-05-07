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

Scenario.skip('[C104305] calendar folders using “Permisions” dialog and sharing link', async (I, users) => {
    let url;
    // Alice shares a folder with 2 appointments
    session('Alice', async () => {
        I.login('app=io.ox/calendar');
        I.clickToolbar('New');
        I.waitForText('Subject');
        I.fillField('Subject', 'simple appointment 1');
        I.click('Create');
        I.waitToHide('.io-ox-calendar-edit');
        I.click('~Close');
        I.clickToolbar('New');
        I.waitForText('Subject');
        I.fillField('Subject', 'simple appointment 2');
        // select tomorrow
        I.click('~Date (M/D/YYYY)');
        I.pressKey(['Control', 'a']);
        I.pressKey(moment().add(1, 'day').format('l'));
        I.click('Create');
        I.waitToHide('.io-ox-calendar-edit');
        I.click('~Close');

        I.click({ css: `.folder-tree [title="Actions for ${users[0].get('sur_name')}, ${users[0].get('given_name')}"]` });
        I.click(locate('a').withText('Permissions / Invite people').inside('.dropdown'));

        I.click('~Select contacts');
        I.waitForElement('.modal .list-view.address-picker li.list-item');
        I.fillField('Search', users[1].get('name'));
        I.waitForText(users[1].get('name'), 5, '.address-picker');
        I.click('.address-picker .list-item');
        I.click({ css: 'button[data-action="select"]' });
        I.waitForElement(locate('.permissions-view .row').at(2));
        I.click('Author');
        I.waitForText('Viewer', '.dropdown');
        I.click('Viewer');

        I.click('Save', '.modal');
        I.waitToHide('.modal');

        I.click({ css: `.folder-tree [title="Actions for ${users[0].get('sur_name')}, ${users[0].get('given_name')}"]` });
        I.click(locate('a').withText('Create sharing link').inside('.dropdown'));
        I.waitForText('Sharing link created for folder');
        [url] = await I.grabValueFrom('.share-wizard input[type="text"]');
        I.click('Close');
    });

    // Bob receives the share
    session('Bob', () => {
        I.login('app=io.ox/mail', { user: users[1] });
        I.waitForText('has shared the calendar', undefined, '.list-view');
        I.click(locate('li.list-item'));
        I.waitForElement('.mail-detail-frame');
        within({ frame: '.mail-detail-frame' }, () => {
            I.waitForText('View calendar');
            I.click('View calendar');
        });

        // FIXME: this is currently broken, needs manual intervention
        // eslint-disable-next-line no-undef
        pause();
        // </FIXME>
        I.waitForText('simple appointment 1', 30, '.io-ox-calendar-main');
        I.see(`${users[0].get('sur_name')}, ${users[0].get('given_name')}`, '.folder-tree');
        I.seeNumberOfElements(locate('.appointment').inside('.io-ox-calendar-main'), 2);
        I.see('simple appointment 2', '.io-ox-calendar-main');

        // check for missing edit rights
        I.click(locate('.appointment').at(1));
        I.waitForElement('.io-ox-sidepopup');
        I.dontSee('Edit', '.io-ox-sidepopup');
        I.click('~Close', '.io-ox-sidepopup');
    });

    // Eve uses external link to shared folder
    session('Eve', () => {
        I.amOnPage(url);
        I.waitForText('simple appointment 1', 5, '.io-ox-calendar-main');
        I.see(`${users[0].get('sur_name')}, ${users[0].get('given_name')}`, '.folder-tree');
        I.seeNumberOfElements('.io-ox-calendar-main .appointment', 2);
        I.see('simple appointment 2');

        // check for missing edit rights
        I.click(locate('.appointment').at(1));
        I.waitForElement('.io-ox-sidepopup');
        I.dontSee('Edit', '.io-ox-sidepopup');
        I.click('~Close', '.io-ox-sidepopup');
    });

    session('Alice', () => {
        I.click({ css: `.folder-tree [title="Actions for ${users[0].get('sur_name')}, ${users[0].get('given_name')}"]` });
        I.click(locate('a').withText('Permissions / Invite people').inside('.dropdown'));
        I.click(locate({ css: 'button[title="Actions"]' }).inside('.modal'));
        I.click('Revoke access');
        I.click('Save');
        I.waitToHide('.modal');

        I.click({ css: `.folder-tree [title="Actions for ${users[0].get('sur_name')}, ${users[0].get('given_name')}"]` });
        I.click(locate('a').withText('Create sharing link').inside('.dropdown'));
        I.waitForText('Sharing link created for folder');
        I.click('Remove link');
    });

    session('Bob', () => {
        I.click('#io-ox-refresh-icon');
        I.waitForElement('#io-ox-refresh-icon .fa-spin');
        I.waitForDetached('#io-ox-refresh-icon .fa-spin');

        I.seeNumberOfElements(locate('.appointment').inside('.io-ox-calendar-main'), 0);
        I.dontSee('simple appointment 1', '.io-ox-calendar-main');
        I.dontSee('simple appointment 2', '.io-ox-calendar-main');
    });

    session('Eve', () => {
        I.amOnPage(url);
        I.waitForText('The share you are looking for does not exist.');
    });
});
