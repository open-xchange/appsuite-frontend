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

Feature('Sharing');

Before(async (users) => {
    await users.create();
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});

Scenario('[C104306] contact folders using “Permisions” dialog and sharing link @shaky', async (I, users) => {
    let url;
    // Alice shares a folder with 2 contacts
    session('Alice', async () => {
        I.login('app=io.ox/contacts');
        I.waitForText('My address books');
        I.doubleClick(locate('~My address books'));
        I.waitForText('Contacts', 5, '.folder-tree');
        I.selectFolder('Contacts');

        I.clickToolbar('New');
        I.waitForText('Add contact');
        I.click('Add contact');
        I.waitForText('Create contact');
        I.fillField('First name', 'Alice');
        I.fillField('Last name', 'Wonderland');
        I.click('Save');
        I.waitToHide('.abs.window-blocker');
        I.clickToolbar('New');
        I.waitForText('Add contact');
        I.click('Add contact');
        I.waitForText('Create contact');
        I.fillField('First name', 'Bob');
        I.fillField('Last name', 'Builder');
        I.click('Save');
        I.waitToHide('.abs.window-blocker');

        I.click({ css: '.folder-tree [title="Actions for Contacts"]' });
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

        I.click({ css: '.folder-tree [title="Actions for Contacts"]' });
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

        I.waitForText('Builder', 30, '.io-ox-contacts-window');
        I.see(`${users[0].get('sur_name')}, ${users[0].get('given_name')}: Contacts`, '.folder-tree');
        I.seeNumberOfElements(locate('.contact.vgrid-cell').inside('.io-ox-contacts-window'), 2);
        I.see('Wonderland', '.io-ox-contacts-window');

        // check for missing edit rights
        I.seeElement(locate('.io-ox-contacts-window .classic-toolbar a.disabled').withText('Edit'));
    });

    // Eve uses external link to shared folder
    session('Eve', () => {
        I.amOnPage(url);
        I.waitForText(`${users[0].get('sur_name')}, ${users[0].get('given_name')}: Contacts`, 5, '.folder-tree');
        I.seeNumberOfElements(locate('.contact.vgrid-cell').inside('.io-ox-contacts-window'), 2);
        I.see('Builder', '.vgrid');
        I.see('Wonderland', '.vgrid');

        // check for missing edit rights
        I.seeElement(locate('.io-ox-contacts-window .classic-toolbar a.disabled').withText('Edit'));
    });

    session('Alice', () => {
        I.click({ css: '.folder-tree [title="Actions for Contacts"]' });
        I.click(locate('a').withText('Permissions / Invite people').inside('.dropdown'));
        I.click(locate({ css: 'button[title="Actions"]' }).inside('.modal'));
        I.click('Revoke access');
        I.click('Save');
        I.waitToHide('.modal');

        I.click({ css: '.folder-tree [title="Actions for Contacts"]' });
        I.click(locate('a').withText('Create sharing link').inside('.dropdown'));
        I.waitForText('Sharing link created for folder');
        I.click('Remove link');
    });

    session('Bob', () => {
        I.click('#io-ox-refresh-icon');
        I.waitForElement('#io-ox-refresh-icon .fa-spin');
        I.waitForDetached('#io-ox-refresh-icon .fa-spin');

        I.seeNumberOfElements(locate('.contact').inside('.io-ox-contacts-window'), 0);
        I.dontSee('Builder', '.io-ox-contacts-window');
        I.dontSee('Wonderland', '.io-ox-contacts-window');
    });

    session('Eve', () => {
        I.amOnPage(url);
        I.waitForText('The share you are looking for does not exist.');
    });
});
