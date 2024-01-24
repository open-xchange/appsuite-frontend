/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

/// <reference path="../../../steps.d.ts" />

const expect = require('chai').expect;

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
    I.waitForText('Calendar', 5, { css: '[id="settings-apps/quickLaunch0"]' });
    I.selectOption({ css: '[id="settings-apps/quickLaunch1"]' }, 'Tasks');
    I.waitForText('Calendar', 5, { css: '[id="settings-apps/quickLaunch0"]' });
    I.selectOption({ css: '[id="settings-apps/quickLaunch2"]' }, 'Portal');
    I.waitForText('Calendar', 5, { css: '[id="settings-apps/quickLaunch0"]' });
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
    I.waitForText('Calendar', 5, '[id="settings-apps/quickLaunch0"]');
    I.selectOption({ css: '[id="settings-apps/quickLaunch1"]' }, 'Tasks');
    I.waitForText('Calendar', 5, '[id="settings-apps/quickLaunch0"]');
    I.selectOption({ css: '[id="settings-apps/quickLaunch2"]' }, 'Portal');
    I.waitForText('Calendar', 5, '[id="settings-apps/quickLaunch0"]');
    I.click('Save changes');
    I.waitForInvisible('Change quick launch icons');
    I.seeElement('~Address Book', '#io-ox-quicklaunch');
    I.seeElement('~Tasks', '#io-ox-quicklaunch');
    I.seeElement('~Portal', '#io-ox-quicklaunch');
});

Scenario('Configure quick launchers to be all None', async function ({ I, dialogs }) {
    await I.haveSetting('io.ox/core//apps/quickLaunchCount', 5);
    I.login(['app=io.ox/settings', 'folder=virtual/settings/io.ox/core']);
    I.waitForText('Configure quick launchers ...', 5, '.rightside');

    I.click('Configure quick launchers ...');
    dialogs.waitForVisible();
    for (let i = 0; i < 5; i++) {
        I.selectOption({ css: `[id="settings-apps/quickLaunch${i}"]` }, 'None');
    }
    dialogs.clickButton('Save changes');
    I.waitForDetached('.modal-dialog');

    I.click('Configure quick launchers ...');
    dialogs.waitForVisible();
    for (let i = 0; i < 5; i++) {
        var selection = await I.executeScript(async function (i) {
            return $(`#settings-apps\\/quickLaunch${i}`).val();
        }, i);
        expect(selection).to.equal('none');
    }
});
