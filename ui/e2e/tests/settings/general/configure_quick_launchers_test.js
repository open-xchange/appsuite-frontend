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

/// <reference path="../../../steps.d.ts" />

Feature('Settings > Basic');

Before(async ({ users }) => {
    await users.create();
});

After(async ({ users }) => {
    await users.removeAll();
});

Scenario('[C287803] Configure quick launchers', function ({ I }) {
    I.login(['app=io.ox/settings', 'folder=virtual/settings/io.ox/core']);
    // wait for form (the button we're interesting in has no meta data)
    I.waitForElement({ css: 'select[name="language"]' });
    I.seeElement('~Mail', '#io-ox-quicklaunch');
    I.seeElement('~Calendar', '#io-ox-quicklaunch');
    I.seeElement('~Drive', '#io-ox-quicklaunch');
    I.click('Configure quick launchers ...', '.settings-detail-pane');
    I.waitForText('Change quick launch icons');
    I.see('Position 1');
    I.see('Mail', { css: '[id="settings-apps/quickLaunch0"]' });
    I.see('Position 2');
    I.see('Calendar', { css: '[id="settings-apps/quickLaunch0"]' });
    I.see('Position 3');
    I.see('Drive', { css: '[id="settings-apps/quickLaunch0"]' });
    I.selectOption({ css: '[id="settings-apps/quickLaunch0"]' }, 'Address Book');
    I.waitForText('Calendar', '5', { css: '[id="settings-apps/quickLaunch0"]' });
    I.selectOption({ css: '[id="settings-apps/quickLaunch1"]' }, 'Tasks');
    I.waitForText('Calendar', '5', { css: '[id="settings-apps/quickLaunch0"]' });
    I.selectOption({ css: '[id="settings-apps/quickLaunch2"]' }, 'Portal');
    I.waitForText('Calendar', '5', { css: '[id="settings-apps/quickLaunch0"]' });
    I.click('Cancel');
    I.waitForInvisible('Change quick launch icons');
    I.seeElement('~Mail', '#io-ox-quicklaunch');
    I.seeElement('~Calendar', '#io-ox-quicklaunch');
    I.seeElement('~Drive', '#io-ox-quicklaunch');
    I.click('Configure quick launchers ...', '.settings-detail-pane');
    I.waitForText('Change quick launch icons');
    I.see('Position 1');
    I.see('Mail', { css: '[id="settings-apps/quickLaunch0"]' });
    I.see('Position 2');
    I.see('Calendar', { css: '[id="settings-apps/quickLaunch0"]' });
    I.see('Position 3');
    I.see('Drive', { css: '[id="settings-apps/quickLaunch0"]' });
    I.selectOption({ css: '[id="settings-apps/quickLaunch0"]' }, 'Address Book');
    I.waitForText('Calendar', '5', '[id="settings-apps/quickLaunch0"]');
    I.selectOption({ css: '[id="settings-apps/quickLaunch1"]' }, 'Tasks');
    I.waitForText('Calendar', '5', '[id="settings-apps/quickLaunch0"]');
    I.selectOption({ css: '[id="settings-apps/quickLaunch2"]' }, 'Portal');
    I.waitForText('Calendar', '5', '[id="settings-apps/quickLaunch0"]');
    I.click('Save changes');
    I.waitForInvisible('Change quick launch icons');
    I.seeElement('~Address Book', '#io-ox-quicklaunch');
    I.seeElement('~Tasks', '#io-ox-quicklaunch');
    I.seeElement('~Portal', '#io-ox-quicklaunch');
});
