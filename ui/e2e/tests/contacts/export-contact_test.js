/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
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

Scenario('[C7357] Export a address book', async function (I, dialogs) {
    I.login('app=io.ox/contacts');
    I.selectFolder('Global address book');
    I.openFolderMenu('Global address book');
    I.waitForVisible('.dropdown-menu a[data-action="export"]');
    I.click('.dropdown-menu a[data-action="export"]');
    dialogs.waitForVisible();
    I.checkOption('vCard');
    I.handleDownloads();
    dialogs.clickButton('Export');
    I.waitForDetached('.modal-dialog');
    I.amInPath('/build/e2e/downloads/');
    I.waitForFile('Global address book.vcf', 10)
    I.seeFile('Global address book.vcf');
    I.seeInThisFile('BEGIN:VCARD');
    I.selectFolder('Global address book');
    I.openFolderMenu('Global address book');
    I.waitForVisible('.dropdown-menu a[data-action="export"]');
    I.click('.dropdown-menu a[data-action="export"]');
    dialogs.waitForVisible();
    I.checkOption('CSV');
    I.handleDownloads();
    dialogs.clickButton('Export');
    I.waitForDetached('.modal-dialog');
    I.amInPath('/build/e2e/downloads/');
    I.waitForFile('Global address book.csv', 10);
    I.seeFile('Global address book.csv');
    I.seeInThisFile('"Display name",');
});
