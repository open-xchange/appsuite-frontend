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

Feature('Sharing tasks');

Before(async (users) => {
    await users.create();
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});

Scenario('[C104304] using “Permisions” dialog and sharing link', async (I, users) => {
    let url;
    // Alice shares a folder with 2 tasks
    session('Alice', async () => {
        I.login('app=io.ox/tasks');
        I.clickToolbar('New');
        I.waitForText('Subject');
        I.fillField('Subject', 'simple task 1');
        I.fillField('Description', 'world domination');
        I.click('Create');
        I.clickToolbar('New');
        I.waitForText('Subject');
        I.fillField('Subject', 'simple task 2');
        I.fillField('Description', 'peace on earth');
        I.click('Create');

        I.click({ css: '.folder-tree [title="Actions for Tasks"]' });
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

        I.click({ css: '.folder-tree [title="Actions for Tasks"]' });
        I.click(locate('a').withText('Create sharing link').inside('.dropdown'));
        I.waitForText('Sharing link created for folder');
        [url] = await I.grabValueFrom('.share-wizard input[type="text"]');
        I.click('Close');
    });

    // Bob receives the share
    session('Bob', () => {
        I.login('app=io.ox/mail', { user: users[1] });
        I.waitForText('has shared the folder', undefined, '.list-view');
        I.click(locate('li.list-item'));
        I.waitForElement('.mail-detail-frame');
        within({ frame: '.mail-detail-frame' }, () => {
            I.waitForText('View folder');
            I.click('View folder');
        });

        I.waitForText('simple task 1', 5, '.io-ox-tasks-main .vgrid');
        I.see(`${users[0].get('sur_name')}, ${users[0].get('given_name')}: Tasks`, '.folder-tree');
        I.seeNumberOfElements('.io-ox-tasks-main .vgrid li.vgrid-cell', 2);
        I.see('simple task 2');
        // at least we can not create or edit elements in the folder, so we assume it's read only
        I.see('New', '.classic-toolbar a.disabled');
        I.see('Edit', '.classic-toolbar a.disabled');
    });

    // Eve uses external link to shared folder
    session('Eve', () => {
        I.amOnPage(url);
        I.waitForText('simple task 1', 5, '.io-ox-tasks-main .vgrid');
        I.see(`${users[0].get('sur_name')}, ${users[0].get('given_name')}: Tasks`, '.folder-tree');
        I.seeNumberOfElements('.io-ox-tasks-main .vgrid li.vgrid-cell', 2);
        I.see('simple task 2');
        // at least we can not create or edit elements in the folder, so we assume it's read only
        I.see('New', '.classic-toolbar a.disabled');
        I.see('Edit', '.classic-toolbar a.disabled');
    });

    session('Alice', () => {
        I.click({ css: '.folder-tree [title="Actions for Tasks"]' });
        I.click(locate('a').withText('Permissions / Invite people').inside('.dropdown'));
        I.click(locate({ css: 'button[title="Actions"]' }).inside('.modal'));
        I.click('Revoke access');
        I.click('Save');
        I.waitToHide('.modal');

        I.click({ css: '.folder-tree [title="Actions for Tasks"]' });
        I.click(locate('a').withText('Create sharing link').inside('.dropdown'));
        I.waitForText('Sharing link created for folder');
        I.click('Remove link');
    });

    session('Bob', () => {
        I.click('#io-ox-refresh-icon');
        I.waitForElement('#io-ox-refresh-icon .fa-spin');
        I.waitForDetached('#io-ox-refresh-icon .fa-spin');

        // folder is still in the folder tree, needs hard refresh to get the latest state
        I.dontSee('simple task 1');
        I.dontSee('simple task 2');
    });

    session('Eve', () => {
        I.amOnPage(url);
        I.waitForText('The share you are looking for does not exist.');
    });
});
