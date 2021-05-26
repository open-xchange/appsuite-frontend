/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

const { I } = inject();

module.exports = {

    locators: {
        tree: locate({ css: '.io-ox-settings-window .leftside .tree-container' }).as('Tree'),
        main: locate({ css: '.io-ox-settings-window .rightside' }).as('Main content'),
        dialog: locate({ css: '.modal[data-point="io.ox/settings/mailfilter/filter/settings/detail/dialog"]' }).as('Create/Edit dialog'),
        lastaction: locate({ css: '.io-ox-mailfilter-edit .actions > li:last-of-type' }).as('Last action')
    },

    connectYourDevice: function () {
        I.waitForVisible('#io-ox-topbar-settings-dropdown-icon');
        I.click('#io-ox-topbar-settings-dropdown-icon');
        I.waitForVisible(locate('a')
            .withAttr({ 'data-action': 'client-onboarding' })
            .inside('#topbar-settings-dropdown'));
        I.click('Connect your Device', '#topbar-settings-dropdown');
        I.waitForText('Please select the platform of your device.');
    },

    // new connect your device wizard, see OXUI-793
    connectDeviceWizard: function () {
        I.waitForVisible('#io-ox-topbar-settings-dropdown-icon');
        I.click('#io-ox-topbar-settings-dropdown-icon');
        I.waitForVisible(locate('a')
            .withText('Connect your device')
            .inside('#topbar-settings-dropdown'));
        I.click('Connect your device', '#topbar-settings-dropdown');
        I.waitForVisible('.wizard-step');
    },

    settings: function () {
        I.waitForVisible('#io-ox-topbar-settings-dropdown-icon');
        I.click('#io-ox-topbar-settings-dropdown-icon');
        I.waitForVisible('[data-name="settings-app"]', '#topbar-settings-dropdown');
        I.click('[data-name="settings-app"]', '#topbar-settings-dropdown');
        I.waitForVisible('.settings-container');
    },

    tours: function name() {
        I.waitForVisible('#io-ox-topbar-help-icon');
        I.click('#io-ox-topbar-help-icon');
        I.waitForText('Getting started');
        I.click('Getting started', '#topbar-help-dropdown');
        // test cancel mechanism
        I.waitForElement('.wizard-container .wizard-content');
    },

    help: function name() {
        I.waitForElement('#io-ox-topbar-help-dropdown-icon');
        I.click('#io-ox-topbar-help-dropdown-icon .dropdown-toggle');
        I.waitForElement('.io-ox-context-help', '#topbar-help-dropdown');
        I.click('.io-ox-context-help', '#topbar-help-dropdown');
        I.waitForElement('.io-ox-help-window');
        I.waitForVisible('.inline-help-iframe');
    }

};
