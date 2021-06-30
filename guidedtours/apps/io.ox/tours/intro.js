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

define('io.ox/tours/intro', [
    'io.ox/core/extensions',
    'io.ox/core/capabilities',
    'io.ox/core/tk/wizard',
    'settings!io.ox/tours',
    'gettext!io.ox/tours'
], function (ext, capabilities, Tour, settings, gt) {

    'use strict';


    /* Tour: intro. The special one that does not belong to an app */
    Tour.registry.add({
        id: 'default/io.ox/intro'
    }, function () {
        //Tour needs webmail and should be disabled for guests (See Bug 40545)
        if (!capabilities.has('webmail && !guest')) return;
        var showAbortDialog = true;
        var tour = new Tour({
            showStepNumbers: true
        })
            .step({ noAutoAlign: true })
            //#. %s is the product name, e.g. OX App Suite
            .title(gt('Welcome to %s', ox.serverConfig.productName))
            .content(gt('This tour will give you a quick introduction to the product in five steps.'))
            .end()
            .step({ back: false, noAutoAlign: true })
            .title(gt('Navigation'))
            .content(gt('All apps can be found in the app menu on the top left.'))
            .hotspot('#io-ox-launcher i', { top: 9, left: 9 })
            .spotlight('.launcher-dropdown')
            .waitFor('.launcher-dropdown')
            .on('wait', function () { $('#io-ox-launcher .dropdown-toggle').click(); $('#io-ox-launcher').attr('forceOpen', true); })
            .on('hide', function () { $('#io-ox-launcher .dropdown-toggle').click(); $('#io-ox-launcher').attr('forceOpen', false); })
            .end()
            .step({ back: false, noAutoAlign: true })
            .title(gt('Personal settings'))
            .content(gt('Your personal data can be changed in the account dropdown. You can also sign out from there.'))
            .hotspot('#io-ox-topbar-account-dropdown-icon .contact-picture', { top: 16, left: 16 })
            .spotlight('#topbar-account-dropdown')
            .waitFor('#topbar-account-dropdown')
            .on('wait', function () { $('#io-ox-topbar-account-dropdown-icon .dropdown-toggle').click(); $('#io-ox-topbar-account-dropdown-icon').attr('forceOpen', true); })
            .on('hide', function () { $('#io-ox-topbar-account-dropdown-icon .dropdown-toggle').click(); $('#io-ox-topbar-account-dropdown-icon').attr('forceOpen', false); })
            .end();

        // single item or dropdown
        if (ext.point('io.ox/core/appcontrol/right/settings').list().length > 1) {
            tour.step({ back: false, noAutoAlign: true })
                .title(gt('Settings'))
                .content(gt('Customize the product to your needs in the settings area.'))
                .hotspot('#io-ox-topbar-settings-dropdown-icon i', { top: 12, left: 6 })
                .spotlight('#topbar-settings-dropdown')
                .waitFor('#topbar-settings-dropdown')
                .on('wait', function () { $('#io-ox-topbar-settings-dropdown-icon .dropdown-toggle').click(); $('#io-ox-topbar-settings-dropdown-icon').attr('forceOpen', true); })
                .on('hide', function () { $('#io-ox-topbar-settings-dropdown-icon .dropdown-toggle').click(); $('#io-ox-topbar-settings-dropdown-icon').attr('forceOpen', false); })
                .end();
        } else {
            tour.step({ back: false, noAutoAlign: true })
                .title(gt('Settings'))
                .content(gt('Customize the product to your needs in the settings area.'))
                .hotspot('#io-ox-settings-topbar-icon i', { top: 12, left: 6 })
                .spotlight('#io-ox-settings-topbar-icon')
                .waitFor('#io-ox-settings-topbar-icon')
                .end();
        }

        tour.step({ back: false, noAutoAlign: true })
            .title(gt('Help'))
            .content(gt('If you need assistance or have further questions, you can use the help app.'))
            .hotspot('#io-ox-topbar-help-dropdown-icon i', { top: 12, left: 6 })
            .spotlight('#io-ox-topbar-help-dropdown-icon')
            .on('wait', function () { $('#io-ox-topbar-help-dropdown-icon .dropdown-toggle').click(); $('#io-ox-topbar-help-dropdown-icon').attr('forceOpen', true); })
            .on('hide', function () { $('#io-ox-topbar-help-dropdown-icon .dropdown-toggle').click(); $('#io-ox-topbar-help-dropdown-icon').attr('forceOpen', false); })
            .end()
            .on('stop', function () {
                if (showAbortDialog) {
                    new Tour()
                        .step()
                        .title(gt('Cancel tour'))
                        //#. %s is the "getting started" tour button label
                        .content(gt('You can restart this tour at any time by clicking on the help icon and choose "%s".',
                            //#. Tour name; general introduction
                            gt('Getting started')))
                        .end()
                        .start();
                }
            })
            .start();
    });
});
