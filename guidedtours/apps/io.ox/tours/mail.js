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

define('io.ox/tours/mail', [
    'io.ox/core/tk/wizard',
    'io.ox/core/notifications',
    'io.ox/tours/utils',
    'gettext!io.ox/tours'
], function (Tour, notifications, utils, gt) {

    'use strict';

    var composeApp;

    Tour.registry.add({
        id: 'default/io.ox/mail',
        app: 'io.ox/mail',
        priority: 1
    }, function () {
        new Tour()
        .step()
            .title(gt('Composing a new E-Mail'))
            .content(gt('To compose a new E-Mail, click on Compose in the toolbar.'))
            .hotspot('[data-ref="io.ox/mail/actions/compose"]:visible')
            .on('next', function () {
                ox.registry.call('mail-compose', 'compose').then(function (result) {
                    composeApp = result.app;
                });
                ox.once('mail:compose:ready', function () {
                    //HACK: add ready class, to have some class to waitFor
                    $('.io-ox-mail-compose-window').addClass('ready');
                });
            })
            .end()
        .step()
            .title(gt('Entering the recipient\'s name'))
            .content(gt('Enter the recipient\'s name into the recipients field. As soon as you typed the first letters, suggestions from the address books are displayed. To accept a recipient suggestion, click on it.'))
            .waitFor('.io-ox-mail-compose-window.ready')
            .hotspot('[data-extension-id=to] .tokenfield.to')
            .on('ready', function () {
                //clean up
                //HACK: add ready class, to have some class to waitFor
                $('.io-ox-mail-compose-window').removeClass('ready');
            })
            .end()
        .step()
            .title(gt('Entering the subject'))
            .content(gt('Enter the subject into the subject field.'))
            .hotspot('[data-extension-id=subject] input')
            .end()
        .step()
            .title(gt('Further functions'))
            .content(gt('In this area you can find further functions, e.g. for adding attachments.'))
            .spotlight('[data-extension-id=composetoolbar]')
            .end()
        .step()
            .title(gt('Entering the E-Mail text'))
            .content(gt('Enter the E-Mail text into the main area. If the text format was set to HTMl in the options, you can format the E-Mail text. To do so select a text part and then click an icon in the formatting bar.'))
            .referTo('.io-ox-mail-compose-container')
            .spotlight('.mail-compose-contenteditable-fields, .io-ox-mail-compose.container textarea')
            .end()
        .step()
            .title(gt('Sending the E-Mail'))
            .content(gt('To send the E-Mail, click on Send'))
            .hotspot('.io-ox-mail-compose-window button[data-action=send]')
            .end()
        .step()
            .title(gt('Sorting your E-Mails'))
            .content(gt('To sort the E-Mails, click on Sort by. Select a sort criteria.'))
            .waitFor('.io-ox-mail-window')
            .spotlight('.list-view-control > .toolbar > .dropdown')
            .navigateTo('io.ox/mail/main')
            .end()
        .step()
            .title(gt('Selecting a view'))
            .content(gt('To choose between the different views. click on View in the toolbar. Select a menu entry in the layout.'))
            .spotlight('.classic-toolbar > li[data-dropdown=view]')
            .end()
        .step()
            .title(gt('Opening an E-Mail in a separate window'))
            .content(gt('If double-clicking on an E-Mail in the list, the E-Mail is opened in a separate window.'))
            .spotlight('.list-view.mail-item > li:first')
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
            .end()
        .step()
            .title(gt('Editing multiple E-Mails'))
            .content(gt('In order to edit multiple E-Mails at once, enable the checkboxes on the left side of the E-Mails. If the checkboxes are not displayed, click on View > Checkboxes on the right side of the toolbar.'))
            .hotspot('.classic-toolbar > li[data-dropdown=view]')
            .referTo('.classic-toolbar > li[data-dropdown=view]')
            .end()
        .step()
            .title(gt('Opening the E-Mail settings'))
            .content(gt('To open the E-Mail settings, click the System menu icon on the upper right side of the menu bar. Select Settings. Click on E-Mail on the left side.'))
            .referTo('#io-ox-topbar-dropdown-icon')
            .hotspot('#io-ox-topbar-dropdown-icon')
            .end()
        .on('stop', function () {
            if (composeApp) {
                //prevent app from asking about changed content
                composeApp.model.dirty(false);
                composeApp.quit();
            }
        })
        .start();
    });
});
