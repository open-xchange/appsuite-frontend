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

Feature('Contacts > Misc');

Before(async function (users) {
    await users.create();
});

After(async function (users) {
    await users.removeAll();
});

Scenario('[C8817] - Send E-Mail to contact', function (I, users, search, contacts) {
    const testrailID = 'C8817';
    const subject = Math.round(+new Date() / 1000);
    I.haveSetting('io.ox/mail//messageFormat', 'text');
    I.login('app=io.ox/contacts');
    contacts.waitForApp();
    search.doSearch(users[0].userdata.primaryEmail);
    I.waitForElement({ css: '[href="mailto:' + users[0].userdata.primaryEmail + '"]' });
    I.click({ css: '[href="mailto:' + users[0].userdata.primaryEmail + '"]' });
    I.waitForVisible('.io-ox-mail-compose');
    I.waitForElement('.floating-window-content .container.io-ox-mail-compose .mail-compose-fields');
    I.waitForVisible({ css: 'textarea.plain-text' });
    I.wait(0.2);
    I.fillField('.io-ox-mail-compose [name="subject"]', '' + testrailID + ' - ' + subject);
    I.fillField({ css: 'textarea.plain-text' }, testrailID);
    I.seeInField({ css: 'textarea.plain-text' }, testrailID);
    I.click('Send');
    I.waitForElement('.fa-spin-paused');
    I.wait(1);
    I.logout();
    I.login('app=io.ox/mail', { user: users[0] });
    I.waitForElement('.list-item[aria-label*="' + testrailID + ' - ' + subject + '"]');
    I.doubleClick('.list-item[aria-label*="' + testrailID + ' - ' + subject + '"]');
    I.see(testrailID + ' - ' + subject);
    I.see(testrailID);
});
