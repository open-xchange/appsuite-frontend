/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2018 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */
/// <reference path="../../../steps.d.ts" />

Feature('Contacts > Distribution List > Delete');

Before(async function (users) {
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

const util = require('./util');

Scenario('[C208268] Export distribution list', async function (I, contacts, dialogs) {
    const display_name = util.uniqueName('C208268'),
        listElement = { css: '[aria-label="' + display_name + '"]' };
    await I.haveContact({ display_name: display_name, folder_id: await I.grabDefaultFolder('contacts'), mark_as_distributionlist: true });

    I.login('app=io.ox/contacts');
    contacts.waitForApp();
    I.waitForElement(listElement);
    I.click(listElement);
    I.click('~More actions');
    I.click('Export');
    dialogs.waitForVisible();
    I.checkOption('vCard');
    I.handleDownloads();
    dialogs.clickButton('Export');
    I.waitForDetached('.modal-dialog');
    I.amInPath('/build/e2e/downloads/');
    I.waitForFile(display_name + '.vcf', 10)
    I.seeFile(display_name + '.vcf');
    I.seeInThisFile('BEGIN:VCARD');
    I.click('~More actions');
    I.click('Export');
    dialogs.waitForVisible();
    I.checkOption('CSV');
    I.handleDownloads();
    dialogs.clickButton('Export');
    I.waitForDetached('.modal-dialog');
    I.amInPath('/build/e2e/downloads/');
    I.waitForFile(display_name + '.csv', 10);
    I.seeFile(display_name + '.csv');
    I.seeInThisFile('"Display name",');
});
