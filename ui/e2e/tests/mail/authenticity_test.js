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
 */
///  <reference path="../../steps.d.ts" />

const fs = require('fs');
const path = require('path');

Feature('Middleware > Mail authenticity');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

const testMails = new DataTable(['testMails']);
/* global codecept_dir: true */
const files = fs.readdirSync(path.join(codecept_dir, 'e2e/media/mails/authenticity'));
/*
  files should contain 81 files which are split into chunks of 9 mails.
  this reduces the overhead of running one test per mail while keeping the
  possibility to speed up testrun using parallelisation
*/
while (files.length) {
    testMails.add([files.splice(0, 9)]);
}

Data(testMails).Scenario('[C244757] SPF, DKIM, DMARC, DMARC Policy matrix', async function ({ I, users, mail, current }) {
    let [user] = users;
    const mails = current.testMails.map(m => {
        return I.haveMail({ folder: 'default0/INBOX', path: path.join('e2e/media/mails/authenticity', m) }, { user });
    });
    await Promise.all([
        user.hasConfig('com.openexchange.mail.authenticity.enabled', true),
        user.hasConfig('com.openexchange.mail.authenticity.authServId', 'mx.recipient.ox')
    ].concat.apply(mails, mails));
    I.login('app=io.ox/mail');
    mail.waitForApp();
    for (let index = 0; index < mails.length; index++) {
        mail.selectMailByIndex(index);
        I.waitForElement('.mail-detail-frame');
        I.switchTo('.mail-detail-frame');
        let mailContent = await I.grabTextFrom('.mail-detail-content');
        let result = mailContent.replace(/Result: /, '');
        I.switchTo();
        //I.waitForElement('.address.authenticity-sender');
        I.waitForElement('.address');
        switch (result) {
            case 'pass':
            case 'neutral':
                I.seeCssPropertiesOnElements('.address', { color: 'rgb(118, 118, 118)' });
                I.dontSee('Warning: Be careful with this message. It might be spam or a phishing mail.');
                I.dontSee('Warning: This is a dangerous email containing spam or malware.');
                break;
            case 'suspicious':
                I.seeCssPropertiesOnElements('.address', { color: 'rgb(197, 0, 0)' });
                I.waitForElement('.authenticity .suspicious');
                I.seeCssPropertiesOnElements('.notifications .authenticity .suspicious', { 'background-color': 'rgb(197, 0, 0)' });
                I.waitForElement('.mail-detail .authenticity-icon-suspicious');
                I.see('Warning: Be careful with this message. It might be spam or a phishing mail.');
                break;
            case 'fail':
                I.seeCssPropertiesOnElements('.address', { color: 'rgb(197, 0, 0)' });
                I.waitForElement('.authenticity .fail');
                I.seeCssPropertiesOnElements('.authenticity .fail', { 'background-color': 'rgb(197, 0, 0)' });
                I.waitForElement('.authenticity-icon-fail');
                I.see('Warning: This is a dangerous email containing spam or malware.');
                break;
            default:
                throw new Error(`Unknown result: ${result}`);
        }
    }
    I.seeNumberOfVisibleElements('.list-view li.list-item', mails.length);
});

const helper = {
    selectAndVerifyAuthenticity: function (I, mail, isSuspicious) {
        mail.selectMail('12-C-SPFpass-DKIMfail-DMARCfail-reject');
        if (isSuspicious) {
            I.waitForElement('.mail-detail-frame');
            I.waitForElement('.authenticity .fail');
            I.see('Warning: This is a dangerous email containing spam or malware.');
        } else {
            I.waitForElement('.mail-detail-frame');
            I.waitForElement('.mail-detail .notifications');
            I.dontSee('Warning: This is a dangerous email containing spam or malware.');
        }
        I.waitForNetworkTraffic();
    },
    openMoveDialog: function (I) {
        I.waitForVisible('~More actions', '.classic-toolbar-container');
        I.waitForClickable('.classic-toolbar-container [data-action="more"]');
        I.waitForEnabled('.classic-toolbar-container [data-action="more"]');
        I.wait(0.5);
        I.clickToolbar('.classic-toolbar-container [data-action="more"]');
        I.waitForVisible('.dropdown.open');
        I.clickDropdown('Move');
        I.waitForElement('.folder-picker-dialog');
    },
    selectFolderInMoveDialog: function (I, folderName) {
        I.click(`.folder-picker-dialog .folder[data-id="default0/INBOX/${folderName}"]`);
        I.waitForElement(`.folder-picker-dialog .folder[data-id="default0/INBOX/${folderName}"].selected`);
    },
    clickMoveAndChangeFolder: function (I, dialogs, folderName) {
        dialogs.clickButton('Move');
        I.waitForDetached('.modal-dialog');
        I.waitForText(folderName, 5, '.folder-tree');
        I.selectFolder(folderName, 'mail');
        I.waitForElement(`.folder.selected[aria-label*="${folderName}"]`, 5, '.folder-tree');
        I.waitForDetached('.busy-indicator.io-ox-busy', 5, '.window-content.vsplit .leftside');
    }
};

Scenario('[C241140] Availability within folders', async function ({ I, users, mail, dialogs }) {
    const [user] = users;
    await Promise.all([
        user.hasConfig('com.openexchange.mail.authenticity.enabled', true),
        user.hasConfig('com.openexchange.mail.authenticity.authServId', 'mx.recipient.ox'),
        // 1.) Receive a mail with authentication headers, stored to INBOX.
        I.haveMail({ folder: 'default0/INBOX', path: 'e2e/media/mails/authenticity/12-C-SPFpass-DKIMfail-DMARCfail-reject.eml' }, { user })
    ]);
    I.login('app=io.ox/mail');
    mail.waitForApp();
    helper.selectAndVerifyAuthenticity(I, mail, true);
    // 2.) Create a new mail folder and move that mail there.
    helper.openMoveDialog(I);
    I.click('Create folder');
    I.waitForText('Add new folder', 5, dialogs.locators.header);
    I.fillField('Folder name', 'Testfolder');
    dialogs.clickButton('Add');
    I.waitForText('Move', 5, dialogs.locators.header);
    I.waitForElement('.folder-picker-dialog .folder[data-id="default0/INBOX/Testfolder"].selected');
    helper.clickMoveAndChangeFolder(I, dialogs, 'Testfolder');
    helper.selectAndVerifyAuthenticity(I, mail, true);
    // 3.) Move the mail to "Spam"
    helper.openMoveDialog(I);
    helper.selectFolderInMoveDialog(I, 'Spam');
    helper.clickMoveAndChangeFolder(I, dialogs, 'Spam');
    helper.selectAndVerifyAuthenticity(I, mail, true);
    // 4.) Move the mail to "Trash"
    helper.openMoveDialog(I);
    helper.selectFolderInMoveDialog(I, 'Trash');
    helper.clickMoveAndChangeFolder(I, dialogs, 'Trash');
    helper.selectAndVerifyAuthenticity(I, mail, true);
    // 5.) Archive the mail
    I.waitForVisible('~Archive', '.classic-toolbar-container');
    I.click('~Archive', '.classic-toolbar-container');
    I.waitForText('Archive', '.folder-tree');
    I.waitForElement('.folder-tree [data-id="default0/INBOX/Archive"] .folder-arrow');
    I.click('.folder-tree [data-id="default0/INBOX/Archive"] .folder-arrow');
    I.waitForText('2018', '.folder-tree');
    I.selectFolder('2018');
    helper.selectAndVerifyAuthenticity(I, mail, true);
    // 6.) Move the mail to "Sent objects"
    helper.openMoveDialog(I);
    helper.selectFolderInMoveDialog(I, 'Sent');
    helper.clickMoveAndChangeFolder(I, dialogs, 'Sent');
    helper.selectAndVerifyAuthenticity(I, mail, false);
    // 7.) Move the mail to "Drafts"
    helper.openMoveDialog(I);
    helper.selectFolderInMoveDialog(I, 'Drafts');
    helper.clickMoveAndChangeFolder(I, dialogs, 'Drafts');
    helper.selectAndVerifyAuthenticity(I, mail, false);
});
