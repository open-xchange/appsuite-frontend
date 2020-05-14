/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Greg Hill <greg.hill@open-xchange.com>
 */

/// <reference path="../../../steps.d.ts" />

Feature('Settings > Security > Application Passwords');
let assert = require('assert');

Before(async (users) => {
    await users.create();
});

After(async (users) => {
    await users.removeAll();
});

Scenario.skip('Add and use application password', async (I) => {

    // Login to settings
    I.login(['app=io.ox/settings', 'folder=virtual/settings/appPasswords']);
    I.waitForElement('[data-point="io.ox/settings/security/appPasswords/settings/detail/view"] .btn');
    I.click('Add application password');

    // Select calendar type password
    I.waitForElement('#settings-scope');
    I.see('Application');
    I.selectOption('#settings-scope', 'caldav');
    I.click('Create Password');

    // Get the new login information
    I.waitForElement('#loginInfo');
    I.see('Username:');
    I.see('Password:');

    let loginData = await I.grabTextFrom('#loginInfo');
    let username = loginData.match(/Username: [^@]*/i);
    let password = loginData.match(/Password: [^\s]*/i);
    assert(username.length > 0, 'assigned username');
    assert(password.length > 0, 'assigned password');
    /*
    var newuser = {
        name: username[0].substring(username[0].indexOf(':') + 1).trim(),
        password: password[0].substring(password[0].indexOf(':') + 1).trim(),
        context: {
            id: users[0].context.id
        }
    };
    */

    I.click('Close');

    // Confirm new password listed.  Labeled as never used
    I.waitForElement('.appPermDiv');
    I.see('My Phone', '.appPermDiv');
    I.see('Last Login: Never used', '.appLoginData');

    // Test delete
    I.click('.remove[data-action="delete"]');
    I.wait(1);
    I.click('Delete account');
    I.wait(1);
    I.dontSee('.appLoginDiv');

    I.logout();
});
