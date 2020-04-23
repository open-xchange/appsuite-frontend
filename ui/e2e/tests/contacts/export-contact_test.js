/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Daniel Pondruff <daniel.pondruff@open-xchange.com>
 */
/// <reference path="../../steps.d.ts" />

Feature('Contacts > Export');

Before(async function (users) {
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

Scenario('[C208266] - Export single contact', async function (I, dialogs) {
    const testrailID = 'C208266';
    const contact = {
        display_name: '' + testrailID + ', ' + testrailID + '',
        folder_id: await I.grabDefaultFolder('contacts'),
        first_name: testrailID,
        last_name: testrailID

    };
    I.haveContact(contact);
    I.login('app=io.ox/contacts');
    I.waitForElement('.vgrid-cell.contact');
    I.selectFolder('Contacts');
    I.waitForElement(locate('.contact').withText(contact.display_name).inside('.vgrid-scrollpane-container'));
    I.click(locate('.contact').withText(contact.display_name).inside('.vgrid-scrollpane-container'));
    I.click('~More actions');
    I.click('Export');
    dialogs.waitForVisible();
    I.checkOption('vCard');
    I.handleDownloads();
    dialogs.clickButton('Export');
    I.waitForDetached('.modal-dialog');
    I.amInPath('/build/e2e/downloads/');
    I.wait(1);
    I.waitForFile(testrailID + ' ' + testrailID + '.vcf', 10)
    I.seeFile(testrailID + ' ' + testrailID + '.vcf');
    I.seeInThisFile('BEGIN:VCARD');
    I.click('~More actions');
    I.click('Export');
    dialogs.waitForVisible();
    I.checkOption('CSV');
    I.handleDownloads();
    dialogs.clickButton('Export');
    I.waitForDetached('.modal-dialog');
    I.amInPath('/build/e2e/downloads/');
    I.wait(1);
    I.waitForFile(testrailID + ' ' + testrailID + '.csv', 10);
    I.seeFile(testrailID + ' ' + testrailID + '.csv');
    I.seeInThisFile('"Display name",');
});
