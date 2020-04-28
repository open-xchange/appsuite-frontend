/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Björn Köster <bjoern.koester@open-xchange.com>
 *
 */

/// <reference path="../../../steps.d.ts" />

Feature('Custom mail account');

Before(async function ({ users }) {
    await users.create();
});

After(async function ({ users }) {
    await users.removeAll();
});

Scenario('[C7840] Delete external mail account', async ({ I, mail, settings, dialogs }) => {
    await I.haveSetting('io.ox/mail//messageFormat', 'text');

    await I.haveMailAccount({
        name: 'External',
        extension: 'ext'
    });

    I.login();
    mail.waitForApp();
    I.waitForText('External', 10, '.folder-tree');
    I.openApp('Settings');
    settings.waitForApp();
    settings.select('Accounts');
    // wait a little for the list to settle (bug?)
    I.wait(0.5);
    I.waitForVisible('~Delete External');
    I.retry(5).click('~Delete External');
    dialogs.waitForVisible();
    dialogs.clickButton('Delete account');
    I.waitForInvisible('~Delete External', 30);
    I.openApp('Mail');
    mail.waitForApp();
    I.waitForInvisible(locate('.folder-tree li').withText('External'), 10);
});
