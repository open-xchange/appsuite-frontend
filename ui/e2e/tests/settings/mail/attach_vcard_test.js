/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Alexander Quast <alexander.quast@open-xchange.com>
 *
 */

/// <reference path="../../../steps.d.ts" />

const checkSetting = (I) => {
    I.login('app=io.ox/settings&folder=virtual/settings/io.ox/mail/settings/compose');
    I.waitForText('Append vCard');
    I.click('Append vCard');
};

const goToMailAndSendMail = (I, user, subject) => {
    I.openApp('Mail');
    I.clickToolbar('Compose');
    I.waitForFocus('input[placeholder="To"]');
    I.fillField('To', user.get('primaryEmail'));
    I.fillField('Subject', subject);
    I.click('Send');
    I.waitForDetached('.io-ox-mail-compose-window');
};

const openMail = (I, subject) => {
    I.waitForText(subject, 10, '.list-item.selectable');
    I.retry(5).click(subject, '.list-item.selectable');
    // wait for everything being loaded
    I.waitForVisible('.fa-refresh.fa-spin');
    I.waitForDetached('.fa-refresh.fa-spin');
};

Feature('Settings > Mail');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});


Scenario('[C7775] Append vCard when sending mail', async ({ I, users }) => {
    await I.haveSetting('io.ox/mail//features/registerProtocolHandler', false);
    const user = users[0];

    checkSetting(I);
    goToMailAndSendMail(I, user, 'Richtig gutes Zeug');
    openMail(I, 'Richtig gutes Zeug');

    I.see('1 attachment');
    I.click('Add to address book');
    I.waitForVisible('.io-ox-contacts-edit-window');
    I.waitForText('Save');
    I.click('Save');
    I.waitForDetached('.io-ox-contacts-edit-window');
    I.logout();

    checkSetting(I);
    goToMailAndSendMail(I, user, 'Katalog von Pearl');
    I.waitForVisible('~Refresh');
    I.click('~Refresh');
    I.waitForVisible('.fa-refresh.fa-spin');
    I.waitForDetached('.fa-refresh.fa-spin');
    openMail(I, 'Katalog von Pearl');
    I.dontSee('1 attachment');
});
