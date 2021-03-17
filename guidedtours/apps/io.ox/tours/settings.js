/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Tobias Prinz <tobias.prinz@open-xchange.com>
 * @author Julian Bäume <julian.baeume@open-xchange.com>
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
