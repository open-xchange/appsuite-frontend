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

Feature('Settings > Mail');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

// TODO: shaky, failed at least once (10 runs on 2019-11-28)
Scenario.skip('[7817] Pre-loading external content', async ({ I, users }) => {
    const u = users[0];
    await I.haveSetting('io.ox/mail//features/registerProtocolHandler', false);
    await I.haveMail({
        folder: 'default0/INBOX',
        path: 'e2e/tests/settings/mail/test_external_image.eml'
    }, { u });

    I.login('app=io.ox/settings&folder=virtual/settings/security', { u });
    I.waitForText('Allow pre-loading of externally linked images');
    I.click('Allow pre-loading of externally linked images');
    I.openApp('Mail');
    I.waitForText('Richtig gutes Zeug');
    I.click('Richtig gutes Zeug', '.list-item.selectable');
    I.waitForVisible('h1.subject');
    within({ frame: '.mail-detail-frame' }, async () => {
        I.seeElement('img');
    });
    // this seems faster than navigating back to settings page manually
    I.logout();
    I.login('app=io.ox/settings&folder=virtual/settings/security', { u });
    I.waitForText('Allow pre-loading of externally linked images');
    I.click('Allow pre-loading of externally linked images');
    I.openApp('Mail');
    I.waitForText('Richtig gutes Zeug');
    I.click('Richtig gutes Zeug', '.list-item.selectable');
    I.waitForVisible('h1.subject');
    I.see('External images have been blocked to protect you against potential spam!');
});
