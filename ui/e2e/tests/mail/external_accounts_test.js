/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Ejaz Ahmed <ejaz.ahmed@open-xchange.com>
 *
 */

/// <reference path="../../steps.d.ts" />
Feature('Mail > External Accounts');

Before(async (users) => {
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});

Scenario('[C125352] No mail oauth service available', function (I) {
    I.login();
    I.openApp('Mail');
    I.click('Add mail account');

    ////Check to see whether mail account wizard is shown up
    I.seeElement('.add-mail-account-address');
    I.seeElement('.add-mail-account-password');
});

