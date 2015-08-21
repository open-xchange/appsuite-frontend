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
    'io.ox/core/capabilities',
    'io.ox/core/tk/wizard',
    'gettext!io.ox/tours'
], function (ext, notifications, capabilities, Tour, gt) {

    'use strict';

    /* Link: Intro tour in settings toolbar */
    ext.point('io.ox/core/topbar/right/dropdown').extend({
        id: 'intro-tour',
        index: 210, /* close to the help link */
        draw: function () {
            var node = this,
                link = $('<li>', { 'class': 'io-ox-specificHelp' }).appendTo(node);

            if (_.device('smartphone')) {//tablets are fine just disable phones
                return;
            }

            require(['settings!io.ox/tours'], function (tourSettings) {
                if (tourSettings.get('disableTours', false)) {
                    link.remove();
                    return;
                }

                link.append(
                    $('<a target="_blank" href="" role="menuitem">').text(
                        //#. Tour name; general introduction
                        gt('Getting started')
                    )
                    .on('click', function (e) {
                        e.preventDefault();
                        Tour.registry.run('default/io.ox/intro');
                    })
                );
            });
        }
    });

    /* Tour: intro. The special one that does not belong to an app */
    Tour.registry.add({
        id: 'default/io.ox/intro'
    }, function () {
        //Tour needs webmail and should be disabled for guests (See Bug 40545)
        if (!capabilities.has('webmail && !guest')) return;

        new Tour()
        .step()
            .title(gt.format(gt('Welcome to %s'), ox.serverConfig.productName))
            .content(gt('This guided tour will briefly introduce you to the product. Get more detailed information in the tours for the single apps or in the online help.'))
            .end()
        .step()
            .title(gt('Launching an app'))
            .content(gt('To launch an app, click on an entry on the left side of the menu bar.'))
            .hotspot('.launcher[data-app-name="io.ox/mail"]')
            .end()
        .step()
            .title(gt('Displaying the help or the settings'))
            .content(gt('To display the help or the settings, click the System menu icon in the menu bar.'))
            .referTo('.launcher .fa-bars.launcher-icon')
            .hotspot('.launcher .fa-bars.launcher-icon')
            .on('before:show', function () { notifications.hide(); })
            .end()
        .step()
            .title(gt('The New objects icon'))
            .content(gt('The New objects icon shows the number of unread E-Mails or other notifications. If clicking the icon, the info area opens.'))
            .hotspot('#io-ox-notifications-icon')
            .on('before:show', function () { notifications.show(); })
            .end()
        .step()
            .title(gt('The info area'))
            .content(gt('In case of new notifications, e.g. appointment invitations, the info area is opened.'))
            .hotspot('#io-ox-notifications-icon')
            .end()
        .step()
            .title(gt('Creating new items'))
            .content(gt('To create a new E-Mail, click the Compose new E-Mail in the toolbar.'))
            .navigateTo('io.ox/mail/main')
            .waitFor('.classic-toolbar .io-ox-action-link:first')
            .hotspot('.classic-toolbar .io-ox-action-link:first')
            .on('before:show', function () { notifications.hide(); })
            .end()
        .step()
            .title(gt('Opening or closing the folder tree'))
            .content(gt('To open or close the folder tree, click on View >  Folder view on the right side of the toolbar.'))
            .spotlight('.classic-toolbar [data-dropdown="view"]')
            .end()
        .step()
            .title(gt('Searching for objects'))
            .content(gt('To search for objects, click the Search icon in the menu bar.'))
            .spotlight('.generic-toolbar.io-ox-find')
            .end()
        .step()
            .title(gt('The toolbar'))
            .content(gt('Depending on the app, the toolbar contains various functions for creating, editing and organizing objects.'))
            .spotlight('.classic-toolbar')
            .end()
        .step()
            .title(gt('The folder tree'))
            .content(gt('Use the folder tree to open the folder containing the objects that you want to view in the list.'))
            .spotlight('.folder-tree')
            .end()
        .step()
            .title(gt('The list'))
            .content(gt('Use the list to select an object, show its contents or activate functions.'))
            .spotlight('.list-view')
            .end()
        .step()
            .title(gt('The Detail view'))
            .content(gt('The Detail view displays an object\'s content. Depending on the app, further functions for organizing objects can be found in the Detail view.'))
            .spotlight('.mail-detail-pane')
            .end()
        .step()
            .title(gt('Further information'))
            .content(gt('Detailed instructions for the single apps are located in System menu > Help.'))
            .hotspot('.launcher .fa-bars.launcher-icon')
            .referTo('.launcher .fa-bars.launcher-icon')
            .end()
        .start();
    });
});
