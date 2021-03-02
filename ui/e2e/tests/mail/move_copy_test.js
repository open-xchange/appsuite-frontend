/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 *
 */

/// <reference path="../../steps.d.ts" />

Feature('Mail > Move/Copy');

Before(async function ({ I, users }) {
    await users.create();
});

After(async function ({ I, users }) {
    await users.removeAll();
});

// TODO: introduce global actors?
const A = {
    check: function (I, subjects, folder) {
        subjects = [].concat(subjects);
        I.selectFolder(folder);
        I.waitNumberOfVisibleElements('.list-view li.list-item', subjects.length);
        subjects.forEach(function (subject) {
            I.waitForText(subject, 5, '.list-view.mail-item');
        });
    },
    clickMoreAction: function (I, toolbar, action) {
        I.waitForVisible(toolbar);
        within(toolbar, () => {
            I.waitForVisible('~More actions', 5);
        });
        I.click('~More actions', toolbar);
        I.waitForElement('.dropdown.open');
        I.click(`.dropdown.open .dropdown-menu [data-action="${action}"]`);
    },
    createFolderInDialog: function (I, folder) {
        I.waitForVisible('.folder-picker-dialog');
        I.click('Create folder', '.folder-picker-dialog');
        I.waitForElement('.modal[data-point="io.ox/core/folder/add-popup"]');
        I.fillField('Folder name', folder);
        I.click('Add');

        I.waitForDetached('.modal[data-point="io.ox/core/folder/add-popup"]');
        I.waitForText(folder, undefined, '.folder-picker-dialog .selected:not(.disabled) .folder-label');
    },
    selectFolderInDialog: function (I, folder) {
        // toogle 'myfolders'
        I.waitForElement('.folder-picker-dialog');
        I.click('.folder-picker-dialog .folder[data-id="virtual/myfolders"] .folder-arrow');
        I.waitForElement(`.folder-picker-dialog .folder[data-id="default0/INBOX/${folder}"]`);
        I.click(`.folder-picker-dialog .folder[data-id="default0/INBOX/${folder}"]`);
        I.waitForElement(`.folder-picker-dialog .folder[data-id="default0/INBOX/${folder}"].selected`);
        I.waitForEnabled('.folder-picker-dialog button[data-action="ok"]');
    },
    isEmpty: function (I, folder) {
        I.selectFolder(folder);
        I.seeTextEquals('Empty', '.list-view .notification');
    },
    select: function (I, number) {
        number = number || 1;
        for (var i = 0; i < number; i++) {
            I.click('.list-view .selectable:not(.selected) .list-item-checkmark');
        }
    }
};

// TODO: introduce global helpers?
const H = {
    fillInbox: function create(I, user, subjects) {
        return Promise.all([].concat(subjects).map(subject => I.haveMail({
            attachments: [{
                content: `<p>${subject}</p>`,
                content_type: 'text/html',
                disp: 'inline'
            }],
            from: [[user.get('displayname'), user.get('primaryEmail')]],
            sendtype: 0,
            subject: subject,
            to: [[user.get('displayname'), user.get('primaryEmail')]]
        })));
    }
};


Scenario('[C7407] Move mail from inbox to a sub-folder', async function ({ I, users, mail }) {
    let [user] = users,
        folder = 'C7407',
        subject = 'C7407';

    await Promise.all([
        H.fillInbox(I, user, [subject]),
        I.haveFolder({ title: folder, module: 'mail', parent: 'default0/INBOX' })
    ]);

    I.login('app=io.ox/mail');
    mail.waitForApp();
    A.select(I, 1);
    I.waitForVisible({ css: '.detail-view-header [aria-label="More actions"]' });
    A.clickMoreAction(I, '.detail-view-header', 'io.ox/mail/actions/move');
    A.selectFolderInDialog(I, folder);
    I.click('Move', '.folder-picker-dialog');
    I.waitForDetached('.folder-picker-dialog');

    A.isEmpty(I, 'Inbox');
    A.check(I, subject, folder);
});

Scenario('[C7408] Move several mails from inbox to a sub-folder', async function ({ I, users, mail }) {
    let [user] = users,
        folder = 'C7408',
        subjects = ['C7408-1', 'C7408-2', 'C7408-3'];

    await Promise.all([
        I.haveSetting('io.ox/mail//showCheckboxes', true),
        H.fillInbox(I, user, subjects),
        I.haveFolder({ title: folder, module: 'mail', parent: 'default0/INBOX' })
    ]);

    I.login('app=io.ox/mail');
    mail.waitForApp();

    A.select(I, 3);
    A.clickMoreAction(I, '.classic-toolbar-container', 'io.ox/mail/actions/move');
    A.selectFolderInDialog(I, folder);
    I.click('Move', '.folder-picker-dialog');
    I.waitForDetached('.folder-picker-dialog');

    A.isEmpty(I, 'Inbox');
    A.check(I, subjects, folder);
});

Scenario('[C7409] Copy mail from inbox to a sub-folder', async function ({ I, users, mail }) {
    let [user] = users,
        folder = 'C7409',
        subject = 'C7409';

    await Promise.all([
        H.fillInbox(I, user, [subject]),
        I.haveFolder({ title: folder, module: 'mail', parent: 'default0/INBOX' })
    ]);

    I.login('app=io.ox/mail');
    mail.waitForApp();

    mail.selectMail('C7409');
    I.click('~More actions', '.detail-view-header');
    I.clickDropdown('Copy');
    A.selectFolderInDialog(I, folder);
    I.click('Copy', '.folder-picker-dialog');
    I.waitForDetached('.folder-picker-dialog');

    A.check(I, subject, 'Inbox');
    A.check(I, subject, folder);
});

Scenario('[C7410] Copy several mails from inbox to a sub-folder', async function ({ I, users, mail }) {
    let [user] = users,
        folder = 'C7410',
        subjects = ['C7410-1', 'C7410-2', 'C7410-3'];

    await Promise.all([
        I.haveSetting('io.ox/mail//showCheckboxes', true),
        H.fillInbox(I, user, subjects),
        I.haveFolder({ title: folder, module: 'mail', parent: 'default0/INBOX' })
    ]);

    I.login('app=io.ox/mail');
    mail.waitForApp();

    A.select(I, 3);
    A.clickMoreAction(I, '.classic-toolbar-container', 'io.ox/mail/actions/copy');
    A.selectFolderInDialog(I, folder);
    I.click('Copy', '.folder-picker-dialog');
    I.waitForDetached('.folder-picker-dialog');

    A.check(I, subjects, 'Inbox');
    A.check(I, subjects, folder);
});

Scenario.skip('[C114349] Create folder within move dialog', async function ({ I, users, mail }) {
    let [user] = users,
        folder = 'C114349-move',
        subject = 'C114349-move';

    await H.fillInbox(I, user, [subject]);
    I.login('app=io.ox/mail');
    mail.waitForApp();

    A.select(I, 1);
    A.clickMoreAction(I, '.detail-view-header', 'io.ox/mail/actions/move');
    A.createFolderInDialog(I, subject);
    I.click('Move', '.folder-picker-dialog');
    I.waitForDetached('.folder-picker-dialog');

    A.isEmpty(I, 'Inbox');
    A.check(I, folder, subject);
});

Scenario('[C114349] Create folder within copy dialog', async function ({ I, users, mail }) {
    let [user] = users,
        folder = 'C114349-copy',
        subject = 'C114349-copy';

    await H.fillInbox(I, user, [subject]);
    I.login('app=io.ox/mail');
    mail.waitForApp();

    A.select(I, 1);
    A.clickMoreAction(I, '.detail-view-header', 'io.ox/mail/actions/copy');
    A.createFolderInDialog(I, subject);
    I.click('Copy', '.folder-picker-dialog');
    I.waitForDetached('.folder-picker-dialog');

    A.check(I, folder, 'Inbox');
    A.check(I, folder, subject);
});
