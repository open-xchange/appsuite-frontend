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

define('io.ox/tours/intro', [
    'io.ox/core/extensions',
    'io.ox/core/capabilities',
    'io.ox/core/tk/wizard',
    'settings!io.ox/tours',
    'gettext!io.ox/tours',
    'io.ox/tours/whats-new'
], function (ext, capabilities, Tour, settings, gt) {

    'use strict';

    var whatsNewPoint = ext.point('io.ox/tours/whats_new');

    /* Tour: intro. The special one that does not belong to an app */
    Tour.registry.add({
        id: 'default/io.ox/intro'
    }, function () {
        //Tour needs webmail and should be disabled for guests (See Bug 40545)
        if (!capabilities.has('webmail && !guest')) return;

        var tour = new Tour()
        .step()
            .title(gt.format(gt('Welcome to %s'), ox.serverConfig.productName))
            .content(gt('This guided tour will briefly introduce you to the product. Get more detailed information in the tours for the single apps or in the online help.'))
            .end()
        .step()
            .title(gt('Launching an app'))
            .on('before:show', function () { if ($('.launcher-dropdown:visible').length === 0) $('#io-ox-launcher .btn').first().click(); })
            .content(gt('To launch an app click on an entry inside the app launcher menu.'))
            .hotspot('#io-ox-launcher>button>.fa')
            .on('hide', function () { if ($('.launcher-dropdown:visible').length === 1) $('#io-ox-launcher .btn').first().click(); })
            .end()
        .step()
            .title(gt('Displaying the help or the settings'))
            .content(gt('To display the help or the settings, click the System menu icon in the menu bar.'))
            .hotspot('#io-ox-topbar-dropdown-icon')
            .referTo('#topbar-settings-dropdown')
            .waitFor('#topbar-settings-dropdown')
            .on('wait', function () { $('#io-ox-topbar-dropdown-icon .dropdown-toggle').click(); })
            .on('hide', function () { $('#io-ox-topbar-dropdown-icon .dropdown-toggle').click(); })
            .end()
        // notification area is not always shown in new topbar
        /*.step()
            .title(gt('The New objects icon'))
            .content(gt('The New objects icon shows the number of appointment reminders or other notifications. If clicking the icon, the info area opens.'))
            .hotspot('#io-ox-notifications-icon')
            .referTo('#io-ox-notifications')
            .on('before:show', function () { notifications.show(); $('#io-ox-notifications').show(); })
            .end()
        .step()
            .title(gt('The info area'))
            .content(gt('In case of new notifications, e.g. appointment invitations, the info area is opened.'))
            .hotspot('#io-ox-notifications-icon')
            .referTo('#io-ox-notifications')
            .on('before:show', function () { notifications.show(); $('#io-ox-notifications').show(); })
            .end()*/
        .step()
            .title(gt('Creating new items'))
            .content(gt('To create a new E-Mail, click the Compose new E-Mail in the toolbar.'))
            .navigateTo('io.ox/mail/main')
            .waitFor('.io-ox-mail-window .primary-action .btn:visible, .classic-toolbar [data-action="io.ox/mail/actions/compose"]:visible')
            .hotspot('.io-ox-mail-window .primary-action .btn:visible, .classic-toolbar [data-action="io.ox/mail/actions/compose"]:visible')
            .referTo('.io-ox-mail-window .primary-action .btn:visible, .classic-toolbar [data-action="io.ox/mail/actions/compose"]:visible')
            .end()
        .step()
            .title(gt('Opening or closing the folder tree'))
            .content(gt('To open or close the folder tree, click on View >  Folder view on the right side of the toolbar.'))
            .spotlight('.classic-toolbar [data-dropdown="view"] ul a[data-name="folderview"]')
            .referTo('.classic-toolbar [data-dropdown="view"] ul')
            .waitFor('.classic-toolbar [data-dropdown="view"] ul a[data-name="folderview"]')
            .on('wait', function () {
                $('.classic-toolbar [data-dropdown="view"] ul').css('display', 'block');
            })
            .on('hide', function () {
                $('.classic-toolbar [data-dropdown="view"] ul').css('display', '');
            })
            .end()
        .step()
            .title(gt('Searching for objects'))
            .content(gt('To search for objects, click the Search icon in the menu bar.'))
            .spotlight('.search-box')
            .end()
        .step()
            .title(gt('The toolbar'))
            .content(gt('Depending on the app, the toolbar contains various functions for creating, editing and organizing objects.'))
            .spotlight('.classic-toolbar-container > .classic-toolbar')
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
            .end();

        // integrate what's new tour steps
        var baton = new ext.Baton({ tour: tour }),
            list = whatsNewPoint.list(),
            blackList = ['launcher-icon', 'launcher', 'help'];

        _(list).each(function (step) {
            if (blackList.indexOf(step.id) !== -1) return;
            step.invoke('steps', this, baton);
        });

        // no need to show the what's new tour when the user has already seen the steps here
        settings.set('whatsNew/autoShow', 0).save();

        tour.step()
            .title(gt('Further information'))
            .content(gt('Detailed instructions for the single apps are located in System menu > Help.'))
            .hotspot('#topbar-settings-dropdown .io-ox-context-help')
            .referTo('#topbar-settings-dropdown')
            .waitFor('#topbar-settings-dropdown')
            .on('wait', function () { $('#io-ox-topbar-dropdown-icon .dropdown-toggle').click(); })
            .on('hide', function () { $('#io-ox-topbar-dropdown-icon .dropdown-toggle').click(); })
            .end()
            .start();
    });
});
