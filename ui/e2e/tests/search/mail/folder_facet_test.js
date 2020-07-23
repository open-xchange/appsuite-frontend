/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Philipp Schumacher <philipp.schumacher@open-xchange.com>
 *
 */

/// <reference path="../../../steps.d.ts" />

const { expect } = require('chai');

Feature('Search > Mail');

Before(async (users) => {
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});

Scenario('[C114373] Search in all folders', async function (I, users, mail, search) {
    let [user] = users;
    user.hasConfig('com.openexchange.find.basic.mail.allMessagesFolder', 'virtual/all');
    user.hasConfig('com.openexchange.find.basic.mail.searchmailbody', true);

    await Promise.all([
        I.haveSetting('io.ox/core//search/mandatory/folder', '[]'),
        I.haveFolder({ title: 'Subfolder', module: 'mail', parent: 'default0/INBOX' }),
        I.haveMail({
            folder: 'default0/INBOX/Subfolder',
            path: 'e2e/tests/settings/mail/test.eml'
        }, { user })
    ]);
    I.login();
    mail.waitForApp();

    search.waitForWidget();
    search.doSearch('Foo');

    I.waitForText('No matching items found.', 5, '.list-view');
    I.waitForText('Search in all folders', 5, '.list-view');
    I.click('Search in all folders');
    I.waitForText('Richtig gutes Zeug', 5);

    // check
    I.click(search.locators.options);
    I.waitForVisible(search.locators.dropdown);
    let folderoption = await I.grabValueFrom('.io-ox-find select[name=option]');
    // "disabled" represents "All Folders"
    expect(folderoption).to.be.equal('disabled');
});

Scenario('[C8402] Search in different folders', async (I, users, mail, search) => {

    // Precondition: Some emails are in the inbox- and in a subfolder and have the subject "test".
    const INBOX = 'default0/INBOX';
    const SUBFOLDER = await I.haveFolder({ title: 'Subfolder', module: 'mail', parent: 'default0/INBOX' });

    const USER = users[0];
    const USER_MAILDOMAINPART = users[0].get('primaryEmail').split('@')[1];

    await I.haveMail({
        folder: INBOX,
        path: 'e2e/media/mails/c8402_1.eml'
    }, { USER });

    await I.haveMail({
        folder: SUBFOLDER,
        path: 'e2e/media/mails/c8402_2.eml'
    }, { USER });

    I.login('app=io.ox/mail');
    mail.waitForApp();
    search.waitForWidget();

    // Enter "test" in the inputfield, than hit enter.
    search.doSearch('test');
    I.waitForText('First', 5, '.list-view');
    I.waitForText('Inbox', 5, '.list-view');

    // Change the search folder to the subfolder
    I.seeElement('.search-field.focus');
    search.option('Folder', 'More…');
    I.waitForText('Select folder');

    I.doubleClick(
        locate('.folder-label')
            .withText(USER_MAILDOMAINPART)
            .inside('.folder-picker-dialog'));

    I.click(
        locate('.folder-label')
            .withText('Subfolder')
            .inside('.folder-picker-dialog'));

    I.click('Select');
    I.waitForInvisible('Select folder');

    I.waitForText('Second', 5, '.list-view');
    I.waitForText('Subfolder', 5, '.list-view');
});
