/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Philipp Schumacher <philipp.schumacher@open-xchange.com>
 *
 */

/// <reference path="../../steps.d.ts" />
Feature('General > Configure quick launchers');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C287801] Configure quick launchers', function ({ I, mail, dialogs }) {
    I.login();
    mail.waitForApp();

    // Changing configuration and cancelling the dialog
    I.rightClick('#io-ox-quicklaunch');
    dialogs.waitForVisible();
    I.waitForText('Change quick launch icons', 5, dialogs.locators.header);
    within(dialogs.locators.body, () => {
        I.see('Position 1');
        I.see('Mail', { css: '[id="settings-apps/quickLaunch0"]' });
        I.see('Position 2');
        I.see('Calendar', { css: '[id="settings-apps/quickLaunch0"]' });
        I.see('Position 3');
        I.see('Drive', { css: '[id="settings-apps/quickLaunch0"]' });
        I.selectOption({ css: '[id="settings-apps/quickLaunch0"]' }, 'Address Book');
        I.waitForText('Calendar', 5, { css: '[id="settings-apps/quickLaunch0"]' });
        I.selectOption({ css: '[id="settings-apps/quickLaunch1"]' }, 'Tasks');
        I.waitForText('Calendar', 5, { css: '[id="settings-apps/quickLaunch0"]' });
        I.selectOption({ css: '[id="settings-apps/quickLaunch2"]' }, 'Portal');
        I.waitForText('Calendar', 5, { css: '[id="settings-apps/quickLaunch0"]' });
    });
    dialogs.clickButton('Cancel');
    I.waitForDetached('.modal-dialog');

    // Check if cancelling the dialog didn't change the icons
    I.seeElement('~Mail', '#io-ox-quicklaunch');
    I.seeElement('~Calendar', '#io-ox-quicklaunch');
    I.seeElement('~Drive', '#io-ox-quicklaunch');

    // Changing configuration and applying the settings
    I.rightClick('#io-ox-quicklaunch');
    dialogs.waitForVisible();
    I.waitForText('Change quick launch icons', 5, dialogs.locators.header);
    within(dialogs.locators.body, () => {
        I.see('Position 1');
        I.see('Mail', { css: '[id="settings-apps/quickLaunch0"]' });
        I.see('Position 2');
        I.see('Calendar', { css: '[id="settings-apps/quickLaunch0"]' });
        I.see('Position 3');
        I.see('Drive', { css: '[id="settings-apps/quickLaunch0"]' });
        I.selectOption({ css: '[id="settings-apps/quickLaunch0"]' }, 'Address Book');
        I.waitForText('Calendar', 5, { css: '[id="settings-apps/quickLaunch0"]' });
        I.selectOption('[id="settings-apps/quickLaunch1"]', 'Tasks');
        I.waitForText('Calendar', 5, { css: '[id="settings-apps/quickLaunch0"]' });
        I.selectOption({ css: '[id="settings-apps/quickLaunch2"]' }, 'Portal');
        I.waitForText('Calendar', 5, { css: '[id="settings-apps/quickLaunch0"]' });
    });
    dialogs.clickButton('Save changes');
    I.waitForDetached('.modal-dialog');

    // Check if configuration was applied
    I.seeElement('~Address Book', '#io-ox-quicklaunch');
    I.seeElement('~Tasks', '#io-ox-quicklaunch');
    I.seeElement('~Portal', '#io-ox-quicklaunch');
});
