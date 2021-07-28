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

define('io.ox/tours/settings', [
    'io.ox/core/tk/wizard',
    'settings!io.ox/core',
    'gettext!io.ox/tours'
], function (Tour, settings, gt) {

    'use strict';

    /* Tour: Settings */
    Tour.registry.add({
        id: 'default/io.ox/settings',
        app: 'io.ox/settings',
        priority: 1
    }, function () {
        var tour = new Tour()
        .step()
            .title(gt('Opening the settings'))
            .content(gt('To open the settings, click on the settings icon on the upper right side of the menu bar.'))
            .hotspot('#io-ox-settings-topbar-icon i')
            .spotlight('#io-ox-settings-topbar-icon a')
            .referTo('#io-ox-settings-topbar-icon a')
            .end()
        .step()
            .title(gt('How the settings are organized'))
            .content(gt('The settings are organized in topics. Select the topic on the left side, e.g Basic settings or Mail.'))
            .navigateTo('io.ox/settings/main')
            .waitFor('.io-ox-settings-window .folder-tree')
            .spotlight('.io-ox-settings-window .folder-tree')
            .end()
        .step()
            .title(gt('Editing settings'))
            .content(gt('Edit a setting on the right side. In most of the cases, the changes are activated immediately.'))
            .spotlight('.io-ox-settings-window .settings-detail-pane')
            .end()
        .step()
            .title(gt('Opening the help'))
            .content(gt('To open the help, click the help icon on the upper right side of the menu bar. Select Help. The help for the currently selected app is displayed. To browse the complete help, click on Start Page or Table Of Contents at the upper part of the window.'))
            .hotspot('#topbar-help-dropdown a.io-ox-context-help')
            .spotlight('#topbar-help-dropdown a.io-ox-context-help')
            .referTo('#topbar-help-dropdown')
            .waitFor('.smart-dropdown-container #topbar-help-dropdown a.io-ox-context-help')
            .on('before:show', function () {
                $('#topbar-help-dropdown:not(:visible)').dropdown('toggle');
            })
            .on('hide', function () {
                $('#topbar-help-dropdown:visible').dropdown('toggle');
            })
            .end();

        if (settings.get('features/dedicatedLogoutButton', false) !== true) {
            // dropdown menu entry
            tour.step()
                .title(gt('Signing out'))
                .content(gt('To sign out, click the System menu icon on the upper right side of the menu bar. Select Sign out.'))
                .hotspot('#topbar-account-dropdown a[data-name="logout"]')
                .spotlight('#topbar-account-dropdown a[data-name="logout"]')
                .referTo('#topbar-account-dropdown')
                .waitFor('#topbar-account-dropdown a[data-name="logout"]')
                .on('wait', function () {
                    $('#topbar-account-dropdown:not(:visible)').dropdown('toggle');
                })
                .on('hide', function () {
                    $('#topbar-account-dropdown:visible').dropdown('toggle');
                })
                .end();

        } else {
            // dedicatedLogoutButton: top bar entry
            tour.step()
                .title(gt('Signing out'))
                .content(gt('To sign out, click the logout icon on the upper right side of the menu bar.'))
                .hotspot('#io-ox-toprightbar a[data-action="sign-out"]')
                .spotlight('#io-ox-toprightbar a[data-action="sign-out"]')
                .referTo('#io-ox-toprightbar')
                .waitFor('#io-ox-toprightbar a[data-action="sign-out"]')
                .end();
        }

        tour.start();
    });
});
