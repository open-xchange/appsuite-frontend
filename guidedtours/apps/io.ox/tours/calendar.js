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

define('io.ox/tours/calendar', [
    'io.ox/core/extensions',
    'io.ox/core/notifications',
    'io.ox/core/tk/wizard',
    'gettext!io.ox/tours'
], function (ext, notifications, Tour, gt) {

    'use strict';

    var createApp;

    /* Tour: calendar / appointments */
    Tour.registry.add({
        id: 'default/io.ox/calendar',
        app: 'io.ox/calendar',
        priority: 1
    }, function () {
        new Tour()
            .step()
                .title(gt('Creating a new appointment'))
                .content(gt('To create a new appointment, click on New in the toolbar.'))
                .spotlight('[data-ref="io.ox/calendar/detail/actions/create"]')
                .on('next', function () {
                    ox.load(['io.ox/calendar/edit/main']).then(function (edit) {
                        var app = edit.getApp();
                        createApp = app;
                        return $.when(app, app.launch());
                    }).then(function (app) {
                        return app.create({
                            folder_id: app.folder.get(),
                            participants: []
                        });
                    });
                })
                .end()
            .step()
                .title(gt('Entering the appointment\'s data'))
                .content(gt('Enter the subject, the start and the end date of the appointment. Other details are optional.'))
                .waitFor('[data-extension-id="title"] > label')
                .spotlight('[data-extension-id="title"] > label')
                .end()
            .step()
                .title(gt('Creating recurring appointments'))
                .content(gt('To create recurring appointments, enable Repeat. Functions for setting the recurrence parameters are shown.'))
                .spotlight('[data-extension-id="recurrence"]')
                .end()
            .step()
                .title(gt('Using the reminder function'))
                .content(gt('To not miss the appointment, use the reminder function.'))
                .spotlight('[data-extension-id="alarm"]')
                .end()
            .step()
                .title(gt('Inviting other participants'))
                .content(gt('To invite other participants, enter their names in the field below Participants. To avoid appointment conflicts, click on Find a free time at the upper right side.'))
                .spotlight('.add-participant')
                .end()
            .step()
                .title(gt('Adding attachments'))
                .content(gt('Further down you can add documents as attachments to the appointment.'))
                .hotspot('[data-extension-id="attachments_legend"]')
                .end()
            .step()
                .title(gt('Creating the appointment'))
                .content(gt('To create the appointment, click on Create at the upper right side.'))
                .referTo('[data-action="save"]')
                .hotspot('[data-action="save"]')
                .end()
            .step()
                .title(gt('Selecting a view'))
                .content(gt('To select one of the views like Day, Month or List, click on View in the toolbar. Select a menu entry from the Layout section.'))
                .navigateTo('io.ox/calendar/main')
                .waitFor('.classic-toolbar .pull-right')
                .spotlight('.classic-toolbar .pull-right')
                .on('before:show', function () {
                    if ($('.toolbar-button.dropdown.open .dropdown-menu:visible').length === 0) {
                        $('[data-ref="io.ox/calendar/links/toolbar/view"]:visible').click();
                    }
                })
                .end()
            .step()
                .title(gt('The List view'))
                .content(gt('The List view shows a list of the appointments in the current folder. If clicking on an appointment, the appointment\'s data and some functions are displayed in the Detail view.'))
                .spotlight('.classic-toolbar .pull-right')
                .on('before:show', function () {
                    if ($('.toolbar-button.dropdown.open .dropdown-menu:visible').length === 0) {
                        $('[data-ref="io.ox/calendar/links/toolbar/view"]:visible').click();
                    }
                })
                .end()
            .step()
                .title(gt('The calendar views'))
                .content(gt('The calendar views display a calendar sheet with the appointments for the selected time range.'))
                .spotlight('.classic-toolbar .pull-right:visible')
                .on('show', function () {
                    if ($('.toolbar-button.dropdown.open .dropdown-menu:visible').length === 0) {
                        $('[data-ref="io.ox/calendar/links/toolbar/view"]:visible').click();
                    }
                })
                .end()
            .on('stop', function () {
                if (createApp) {
                    //prevent app from asking about changed content
                    createApp.quit();
                }
            })
            .start();
    });
});
