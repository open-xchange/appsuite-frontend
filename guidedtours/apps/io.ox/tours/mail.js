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

define('io.ox/tours/mail', [
    'io.ox/core/tk/wizard',
    'io.ox/core/notifications',
    'io.ox/tours/utils',
    'settings!io.ox/core',
    'gettext!io.ox/tours'
], function (Tour, notifications, utils, settings, gt) {

    'use strict';

    var composeApp;

    Tour.registry.add({
        id: 'default/io.ox/mail',
        app: 'io.ox/mail',
        priority: 1
    }, function () {
        var mailTour = new Tour()
        .step()
            .title(gt('Composing a new E-Mail'))
            .content(gt('To compose a new E-Mail, click on Compose in the toolbar.'))
            .hotspot('.io-ox-mail-window .primary-action .btn:visible, .classic-toolbar [data-action="io.ox/mail/actions/compose"]:visible')
            .on('next', function () {
                if (composeApp) {
                    if (composeApp.getWindow().floating.model.get('minimized')) composeApp.getWindow().floating.model.set('minimized', false);
                    return;
                }
                ox.registry.call('mail-compose', 'open').then(function (result) {
                    composeApp = result.app;
                });
            })
            .end()
        .step()
            .title(gt('Entering the recipient\'s name'))
            .content(gt('Enter the recipient\'s name into the recipients field. As soon as you typed the first letters, suggestions from the address books are displayed. To accept a recipient suggestion, click on it.'))
            .waitFor('.io-ox-mail-compose-window:visible:last .subject:visible')
            .hotspot('.active [data-extension-id=to] .tokenfield.to')
            .on('back', function () {
                if (composeApp && !composeApp.getWindow().floating.model.get('minimized')) {
                    composeApp.getWindow().floating.onMinimize();
                }
            })
            .end()
        .step()
            .title(gt('Entering the subject'))
            .content(gt('Enter the subject into the subject field.'))
            .hotspot('.active [data-extension-id=subject] input')
            .end()
        .step()
            .title(gt('Further functions'))
            .content(gt('In this area you can find further functions, e.g. for adding attachments.'))
            .hotspot('.active [data-extension-id=composetoolbar] > div:first')
            .end()
        .step()
            .title(gt('Entering the E-Mail text'))
            .content(gt('Enter the E-Mail text into the main area. If the text format was set to HTML in the options, you can format the E-Mail text. To do so select a text part and then click an icon in the formatting bar.'))
            .referTo('.io-ox-mail-compose-container')
            .hotspot('.active .io-ox-mail-compose.container .editor .editable')
            .end()
        .step()
            .title(gt('Sending the E-Mail'))
            .content(gt('To send the E-Mail, click on Send'))
            .hotspot('.io-ox-mail-compose-window.active button[data-action=send]')
            .on('before:show', function () {
                if (composeApp && composeApp.getWindow().floating.model.get('minimized')) {
                    composeApp.getWindow().floating.model.set('minimized', false);
                }
            })
            .end()
        .step()
            .on('before:show', function () {
                if (composeApp && !composeApp.getWindow().floating.model.get('minimized')) {
                    composeApp.getWindow().floating.onMinimize();
                }
            })
            .title(gt('Sorting your E-Mails'))
            .content(gt('To sort the E-Mails, click on Sort by. Select a sort criteria.'))
            .waitFor('.io-ox-mail-window')
            .hotspot('.list-view-control > .toolbar > .dropdown:last')
            .navigateTo('io.ox/mail/main')
            .end()
        .step()
            .title(gt('Selecting a view'))
            .content(gt('To choose between the different views, click on View in the toolbar. Select a menu entry in the layout.'))
            .spotlight('.classic-toolbar [data-dropdown="view"] ul a[data-name="layout"]')
            .referTo('.classic-toolbar [data-dropdown="view"] ul')
            .waitFor('.classic-toolbar [data-dropdown="view"] ul a[data-name="layout"]')
            .on('wait', function () {
                $('.classic-toolbar [data-dropdown="view"] ul').css('display', 'block');
            })
            .on('hide', function () {
                $('.classic-toolbar [data-dropdown="view"] ul').css('display', '');
            })
            .end()
        .step()
            .title(gt('Opening an E-Mail in a separate window'))
            .content(gt('If double-clicking on an E-Mail in the list, the E-Mail is opened in a separate window.'))
            .spotlight('.list-view.mail-item > li.list-item:first')
            .end()
        .step()
            .title(gt('Reading E-Mail conversations'))
            .content(gt('To open or close an E-Mail in a conversation, click on a free area in the header.'))
            .hotspot('.thread-view .detail-view-header')
            .end()
        .step()
            .title(gt('Halo view'))
            .content(gt('To receive information about the sender or other recipients, open the Halo view by clicking on a name.'))
            .hotspot('.halo-link')
            .end();

        if (settings.get('selectionMode') !== 'alternative') {
            mailTour.step()
                .title(gt('Editing multiple E-Mails'))
                .content(gt('In order to edit multiple E-Mails at once, enable the checkboxes on the left side of the E-Mails. If the checkboxes are not displayed, click on View > Checkboxes on the right side of the toolbar.'))
                .hotspot('.classic-toolbar [data-dropdown="view"] ul a[data-name="checkboxes"]')
                .referTo('.classic-toolbar [data-dropdown="view"] ul')
                .waitFor('.classic-toolbar [data-dropdown="view"] ul a[data-name="checkboxes"]')
                .on('wait', function () {
                    $('.classic-toolbar [data-dropdown="view"] ul').css('display', 'block');
                })
                .on('hide', function () {
                    $('.classic-toolbar [data-dropdown="view"] ul').css('display', '');
                })
                .end();
        }
        mailTour.step()
            .title(gt('Opening the E-Mail settings'))
            .content(gt('To open the E-Mail settings, click the System menu icon on the upper right side of the menu bar. Select Settings. Click on E-Mail on the left side.'))
            .referTo('#io-ox-topbar-dropdown-icon')
            .hotspot('#io-ox-topbar-dropdown-icon')
            .end()
        .on('stop', function () {
            if (composeApp) {
                //prevent app from asking about changed content
                composeApp.view.dirty(false);
                composeApp.quit();
                composeApp = null;
            }
        })
        .start();
    });
});
