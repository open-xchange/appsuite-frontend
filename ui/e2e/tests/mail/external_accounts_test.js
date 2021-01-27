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

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C125352] No mail oauth service available', function ({ I, mail }) {
    I.login('app=io.ox/mail');
    mail.waitForApp();

    I.waitForText('Add mail account', 30, '.folder-tree .links.list-unstyled');
    I.click('Add mail account');

    ////Check to see whether mail account wizard is shown up
    I.waitForElement('.add-mail-account-address', 30);
    I.seeElement('.add-mail-account-password');
});

Scenario('[OXUIB-225] Password recovery for account passwords after password change', async ({ I, dialogs, users }) => {
    await I.haveMailAccount({ extension: 'ext' });

    I.login();
    // Check for the external account being registered
    I.waitForText('My External');
    I.dontSeeElement('.modal-dialog');
    I.logout();

    // Change password using external system
    await I.executeSoapRequest('OXUserService', 'change', {
        ctx: { id: users[0].context.id },
        usrdata: {
            id: users[0].get('id'),
            password: 'secret2'
        },
        auth: users[0].context.admin
    });
    users[0].userdata.password = 'secret2';

    I.login();
    I.waitForText('My External');
    dialogs.waitForVisible();
    dialogs.clickButton('Remind me again');
    I.waitToHide('.modal-dialog');

    I.refreshPage();
    I.waitForText('My External');
    dialogs.waitForVisible();
    dialogs.clickButton('Remove passwords');
    I.waitToHide('.modal-dialog');

    I.refreshPage();
    I.waitForText('My External');
    I.dontSeeElement('.modal-dialog');
});
