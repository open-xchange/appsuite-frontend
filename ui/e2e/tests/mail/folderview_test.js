/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2020 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 *
 */

/// <reference path="../../steps.d.ts" />

Feature('Mail > Folderview');

Before(async ({ users }) => {
    await users.create();
});
After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[OXUIB-64] Mark folders as favorites', async ({ I, mail }) => {
    await I.haveSetting('io.ox/core//favorites/mail', ['default0']);
    I.login('app=io.ox/mail');
    mail.waitForApp();
    I.click('.folder.virtual.favorites .folder-arrow');
    I.rightClick('.folder.virtual.favorites .folder[data-id="default0"] .folder-node');
    I.click('Remove from favorites');
    I.dontSee('Favorites');
});
