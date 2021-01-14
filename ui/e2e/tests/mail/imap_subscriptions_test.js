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
*/

/// <reference path="../../steps.d.ts" />

const changeSubscription = (I, toggle) => {
    I.login('app=io.ox/settings&folder=virtual/settings/io.ox/mail');
    I.waitForText('Change IMAP subscriptions ...');
    I.click('Change IMAP subscriptions ...');
    I.waitForVisible('.modal-dialog');
    I.waitForText('E-Mail');
    I.click('.modal-dialog .folder-arrow');
    I.waitForText('Krawall');
    if (toggle) {
        I.click('.folder [value="default0/INBOX/Krawall"]');
    }
    I.click('Save');
    I.waitForDetached('.modal-dialog');
};

const prepare = async (I) => {
    await I.haveSetting('io.ox/mail//features/registerProtocolHandler', false);
    await I.haveFolder({ title: 'Krawall', module: 'mail', parent: 'default0/INBOX' });
    await I.haveFolder({ title: 'Remmidemmi', module: 'mail', parent: 'default0/INBOX' });
};

const goToMail = (I) => {
    I.openApp('Mail');
    I.waitForText('Inbox');
    I.doubleClick('.tree-container [data-model="virtual/myfolders"]');
    I.waitForText('Remmidemmi');
};

Feature('Settings > Mail > IMAP subscriptions');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[7783] Unsubscribe folder', async ({ I }) => {
    await prepare(I);

    changeSubscription(I, true);
    goToMail(I);
    I.dontSee('Krawall');
});

Scenario('[7784] Subscribe folder', async ({ I }) => {
    await prepare(I);

    changeSubscription(I);
    goToMail(I);
    I.see('Krawall');
});

