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

define('io.ox/tours/intro', [
    'io.ox/core/extensions',
    'io.ox/core/notifications',
    'io.ox/tours/utils',
    'gettext!io.ox/tours'
], function (ext, notifications, utils, gt) {

    'use strict';

    /* Tour: intro. The special one that does not belong to an app */
    ext.point('io.ox/tours/extensions').extend({
        id: 'default/io.ox/intro',
        app: 'io.ox/intro',
        priority: 1,
        tour: {
            id: 'Switching from OX6',
            steps: [{
                title: gt.format(gt('Welcome to %s'), ox.serverConfig.productName),
                placement: 'bottom',
                target: 'io-ox-topbar',
                content: gt('This guided tour will briefly introduce you to the product. Get more detailed information in the tours for the single apps or in the online help.'),
                xOffset: 'center',
                arrowOffset: 'center',
                width: 380,
                padding: 45
            },
            {
                title: gt('Launching an app'),
                placement: 'bottom',
                target: function () { return $('.launcher[data-app-name="io.ox/mail"]')[0]; },
                content: gt('To launch an app, click on an entry on the left side of the menu bar.')
            },
            {
                onShow: function () { notifications.hide(); },
                title: gt('Displaying the help or the settings'),
                placement: 'left',
                target: function () { return $('.launcher .fa-bars.launcher-icon:visible')[0]; },
                content: gt('To display the help or the settings, click the System menu icon in the menu bar.'),
                arrowOffset: 1,
                yOffset: -5
            },
            {
                onShow: function () { notifications.show(); },
                title: gt('The New objects icon'),
                placement: 'left',
                target: function () { return $('#io-ox-notifications-icon:visible')[0]; },
                content: gt('The New objects icon shows the number of unread E-Mails or other notifications. If clicking the icon, the info area opens.'),
                arrowOffset: -1
            },
            {
                onShowDeferred: utils.switchToAppFunc('io.ox/mail/main'),
                title: gt('The info area'),
                placement: 'left',
                target: function () { return $('#io-ox-notifications-icon')[0]; },
                content: gt('In case of new notifications, e.g. appointment invitations, the info area is opened on the right side.')
            },
            {
                onShow: function () { notifications.hide(); },
                title: gt('Creating new items'),
                placement: 'right',
                target: function () { return $('.classic-toolbar .io-ox-action-link:visible')[0]; },
                content: gt('To create a new E-Mail, click the Compose new E-Mail in the toolbar.'),
                arrowOffset: 1,
                yOffset: -5
            },
            {
                title: gt('Opening or closing the folder tree'),
                placement: 'left',
                target: function () { return $('.classic-toolbar .pull-right:visible')[0]; },
                content: gt('To open or close the folder tree, click on View >  Folder view on the right side of the toolbar.')
            },
            {
                title: gt('Searching for objects'),
                placement: 'left',
                target: function () { return $('#io-ox-search-topbar-icon:visible')[0]; },
                content: gt('To search for objects, click the Search icon in the menu bar.')
            },
            {
                title: gt('The toolbar'),
                placement: 'bottom',
                target: function () { return $('.classic-toolbar:visible')[0]; },
                content: gt('Depending on the app, the toolbar contains various functions for creating, editing and organizing objects.')
            },
            {
                title: gt('The folder tree'),
                placement: 'right',
                target: function () { return $('.foldertree-container:visible')[0]; },
                content: gt('Use the folder tree to open the folder containing the objects that you want to view in the list.')
            },
            {
                title: gt('The list'),
                placement: 'top', // see bug #34010
                target: function () { return $('.list-view:visible')[0]; },
                content: gt('Use the list to select an object, show its contents or activate functions.'),
                yOffset: 50,
                xOffset: 200
            },
            {
                title: gt('The Detail view'),
                placement: 'left',
                target: function () { return $('.mail-detail-pane:visible')[0]; },
                content: gt('The Detail view displays an object\'s content. Depending on the app, further functions for organizing objects can be found in the Detail view.'),
                xOffset: 100
            },
            {
                title: gt('Further information'),
                placement: 'left',
                target: function () { return $('.launcher .fa-cog:visible')[0]; },
                content: gt('Detailed instructions for the single apps are located in System menu > Help.'),
                arrowOffset: 1,
                yOffset: -5
            }]
        }
    });
});
