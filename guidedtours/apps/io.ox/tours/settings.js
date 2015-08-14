/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Tobias Prinz <tobias.prinz@open-xchange.com>
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

define('io.ox/tours/settings', [
    'io.ox/core/extensions',
    'io.ox/core/notifications',
    'gettext!io.ox/tours'
], function (ext, notifications, gt) {

    'use strict';

    /* Tour: Settings */
    ext.point('io.ox/tours/extensions').extend({
        id: 'default/io.ox/settings',
        app: 'io.ox/settings',
        priority: 1,
        tour: {
            id: 'Settings',
            steps: [{
                title: gt('Opening the settings'),
                placement: 'left',
                target: function () { return $('.launcher .fa-cog:visible')[0]; },
                content: gt('To open the settings, click the System menu icon on the upper right side of the menu bar. Select Settings. ')
            },
            {
                title: gt('How the settings are organized'),
                placement: 'right',
                target: function () { return $('.io-ox-settings-window .vgrid-scrollpane')[0]; },
                content: gt('The settings are organized in topics. Select the topic on the left side, e.g Basic settings or E-Mail. To view all settings, enable Advanced settings at the bottom.')
            },
            {
                title: gt('Editing settings'),
                placement: 'left',
                target: function () { return $('.io-ox-settings-window .settings-container')[0]; },
                content: gt('Edit a setting on the right side. In most of the cases, the changes are activated immediately.')
            },
            {
                title: gt('Opening the help'),
                placement: 'left',
                target: function () { return $('#io-ox-topbar .launcher .fa-cog')[0]; },
                content: gt('To open the help, click the System menu icon on the upper right side of the menu bar. Select Help. The help for the currently selected app is displayed. To browse the complete help, click on Start Page or Table Of Contents at the upper part of the window.')
            },
            {
                title: gt('Signing out'),
                placement: 'left',
                target: function () { return $('#io-ox-topbar .launcher .fa-cog')[0]; },
                content: gt('To sign out, click the System menu icon on the upper right side of the menu bar. Select Sign out.')
            }]
        }
    });
});
