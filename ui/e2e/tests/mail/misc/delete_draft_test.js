/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2020 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Anne Matthes <anne.matthes@open-xchange.com>
 *
 */

/// <reference path="../../../steps.d.ts" />

Feature('Mail > Misc');

Before(async (users) => {
    await Promise.all([
        users.create(),
        users.create()
    ]);
});

After(async (users) => {
    await users.removeAll();
});

Scenario('[C114958] Delete draft when closing composer', async (I, users, mail, dialogs) => {
    const mailListView = '.list-view.visible-selection.mail-item';
    const subject = 'Testsubject Draft';

    I.login('app=io.ox/mail');

    mail.newMail();
    I.fillField('To', users[1].get('primaryEmail'));
    I.fillField('Subject', subject);
    I.pressKey('Tab');
    I.fillField('span', 'Testcontent');
    I.click('~Save and close', '.io-ox-mail-compose-window');
    dialogs.clickButton('Save as draft');
    I.waitForDetached('.io-ox-mail-compose-window');
    I.selectFolder('Drafts');
    mail.waitForApp();
    I.waitForElement(mailListView);
    I.waitForVisible('.list-view li.list-item');
    mail.selectMail(subject);
    I.waitForFocus('.list-view li.list-item.selected');


    I.waitForElement('.mail-detail-frame');
    within({ frame: '.mail-detail-frame' }, () => {
        I.waitForElement(locate('div.default-style').withText('Testcontent'));
    });

    I.waitForElement('.detail-view-header');
    I.click('Delete', '.detail-view-header');

    within(mailListView, () => {
        I.waitForDetached('.list-item.selectable');
        I.dontSee(subject);
    });
});
