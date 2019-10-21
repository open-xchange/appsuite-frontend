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

Scenario('[C83383] mail folders using “Permisions” dialog', async (I, users) => {
    // Alice shares a mail folder
    I.login('app=io.ox/mail');
    I.waitForText('Spam', 5, '.folder-tree');
    I.selectFolder('Spam');
    I.click({ css: '.folder-tree [title="Actions for Spam"]' });
    I.click(locate('a').withText('Permissions').inside('.dropdown'));
    I.click('~Select contacts');
    I.waitForElement('.modal .list-view.address-picker li.list-item');
    I.fillField('Search', users[1].get('name'));
    I.waitForText(users[1].get('name'), 5, '.address-picker');
    I.waitForText(users[1].get('primaryEmail'));
    I.click(users[1].get('primaryEmail'), '.address-picker .list-item');
    I.click({ css: 'button[data-action="select"]' });
    I.waitForElement(locate('.permissions-view .row').at(2));
    I.click('Author');
    I.waitForText('Viewer', '.dropdown');
    I.click('Viewer');

    I.click('Save', '.modal');
    I.waitToHide('.modal');

    I.logout();

    // Bob receives the share
    I.login('app=io.ox/mail', { user: users[1] });
    I.waitForText('has shared the folder', undefined, '.list-view');
    I.click(locate('li.list-item'));
    I.waitForElement('.mail-detail-frame');
    within({ frame: '.mail-detail-frame' }, () => {
        I.waitForText('View folder');
        I.click('View folder');
    });
    I.waitForText('Empty', 5, '.list-view');
    I.waitForText(`${users[0].get('name')}`, 10, '.folder-tree');
    I.see('Spam', '.folder-tree [data-id="default0/shared"]');
});
