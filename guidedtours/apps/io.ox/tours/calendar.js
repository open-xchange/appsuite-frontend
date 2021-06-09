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
                .content(gt('To create a new appointment, click on New appointmentS in the toolbar.'))
                .spotlight('.io-ox-calendar-window .primary-action .btn:visible, [data-ref="io.ox/calendar/detail/actions/create"]:visible')
                .on('before:show', function () {
                    if (createApp && !createApp.getWindow().floating.model.get('minimized')) {
                        createApp.getWindow().floating.onMinimize();
                    }
                })
                .on('next', function () {
                    if (createApp) {
                        if (createApp.getWindow().floating.model.get('minimized')) createApp.getWindow().floating.model.set('minimized', false);
                        return;
                    }
                    ox.load(['io.ox/calendar/edit/main', 'io.ox/calendar/model']).then(function (edit, models) {
                        var app = edit.getApp();
                        createApp = app;
                        return $.when(app, models, app.launch());
                    }).then(function (app, models) {
                        var refDate = moment().startOf('hour').add(1, 'hours');

                        return app.create(new models.Model({
                            folder: app.folder.get(),
                            startDate: { value: refDate.format('YYYYMMDD[T]HHmmss'), tzid: refDate.tz() },
                            endDate: { value: refDate.add(1, 'hours').format('YYYYMMDD[T]HHmmss'), tzid: refDate.tz() }
                        }));
                    });
                })
                .end()
            .step()
                .title(gt('Entering the appointment\'s data'))
                .content(gt('Enter the subject, the start and the end date of the appointment. Other details are optional.'))
                .waitFor('.io-ox-calendar-edit-window.active [data-extension-id="title"] > label')
                .spotlight('.io-ox-calendar-edit-window.active [data-extension-id="title"] > label')
                .on('before:show', function () {
                    if ($('.io-ox-calendar-edit-window.active [data-extension-id="title"] > label').length === 0) return;
                    $('.io-ox-calendar-edit-window.active [data-extension-id="title"] > label')[0].scrollIntoView();
                })
                .on('show', function () {
                    $('.io-ox-calendar-edit-window.active [data-extension-id="title"] > label')[0].scrollIntoView();
                })
                .end()
            .step()
                .title(gt('Creating recurring appointments'))
                .content(gt('To create recurring appointments, enable Repeat. Functions for setting the recurrence parameters are shown.'))
                .spotlight('.io-ox-calendar-edit-window.active [data-extension-id="recurrence"]')
                .on('before:show', function () {
                    $('.io-ox-calendar-edit-window.active [data-extension-id="recurrence"]')[0].scrollIntoView();
                })
                .end()
            .step()
                .title(gt('Inviting other participants'))
                .content(gt('To invite other participants, enter their names in the field below Participants. To avoid appointment conflicts, click on Find a free time at the upper right side.'))
                .spotlight('.io-ox-calendar-edit-window.active .add-participant')
                .on('before:show', function () {
                    $('.io-ox-calendar-edit-window.active .add-participant:last')[0].scrollIntoView();
                })
                .end()
            .step()
                .title(gt('Using the reminder function'))
                .content(gt('To not miss the appointment, use the reminder function.'))
                .spotlight('.io-ox-calendar-edit-window.active .alarms-link-view')
                .on('before:show', function () {
                    $('.io-ox-calendar-edit-window.active [data-extension-id="alarms-container"]')[0].scrollIntoView();
                })
                .end()
            .step()
                .title(gt('Adding attachments'))
                .content(gt('Further down you can add documents as attachments to the appointment.'))
                .hotspot('.io-ox-calendar-edit-window.active [data-extension-id="attachments_legend"]')
                .on('before:show', function () {
                    $('.io-ox-calendar-edit-window.active [data-extension-id="attachments_legend"]:last')[0].scrollIntoView();
                })
                .end()
            .step()
                .title(gt('Creating the appointment'))
                .content(gt('To create the appointment, click on Create at the lower left side.'))
                .referTo('.io-ox-calendar-edit-window.active [data-action="save"]')
                .hotspot('.io-ox-calendar-edit-window.active [data-action="save"]')
                .on('before:show', function () {
                    if (createApp && createApp.getWindow().floating.model.get('minimized')) {
                        createApp.getWindow().floating.model.set('minimized', false);
                    }
                })
                .end()
            .step()
                .title(gt('Selecting a view'))
                .content(gt('To select one of the views like Day, Month or List, click on View in the toolbar. Select a menu entry from the Layout section.'))
                .navigateTo('io.ox/calendar/main')
                .spotlight('.io-ox-calendar-window .classic-toolbar [data-dropdown="view"] ul a[data-name="layout"]')
                .referTo('.io-ox-calendar-window .classic-toolbar [data-dropdown="view"] ul')
                .waitFor('.io-ox-calendar-window .classic-toolbar [data-dropdown="view"] ul a[data-name="layout"]')
                .on('wait', function () {
                    if (createApp && !createApp.getWindow().floating.model.get('minimized')) {
                        createApp.getWindow().floating.onMinimize();
                    }
                    $('.io-ox-calendar-window .classic-toolbar [data-dropdown="view"] ul').css('display', 'block');
                })
                .on('hide', function () {
                    $('.io-ox-calendar-window .classic-toolbar [data-dropdown="view"] ul').css('display', '');
                })
                .end()
            .step()
                .title(gt('The calendar views'))
                .content(gt('The calendar views display a calendar sheet with the appointments for the selected time range.'))
                .spotlight('.io-ox-calendar-window .classic-toolbar [data-dropdown="view"] ul a[data-name="layout"]')
                .referTo('.io-ox-calendar-window .classic-toolbar [data-dropdown="view"] ul')
                .waitFor('.io-ox-calendar-window .classic-toolbar [data-dropdown="view"] ul a[data-name="layout"]')
                .on('wait', function () {
                    $('.io-ox-calendar-window .classic-toolbar [data-dropdown="view"] ul').css('display', 'block');
                })
                .on('hide', function () {
                    $('.io-ox-calendar-window .classic-toolbar [data-dropdown="view"] ul').css('display', '');
                })
                .end()
            .step()
                .title(gt('The List view'))
                .content(gt('The List view shows a list of the appointments in the current folder. If clicking on an appointment, the appointment\'s data and some functions are displayed in the Detail view.'))
                .spotlight('.io-ox-calendar-window .classic-toolbar [data-dropdown="view"] ul a[data-value="list"]')
                .referTo('.io-ox-calendar-window .classic-toolbar [data-dropdown="view"] ul')
                .waitFor('.io-ox-calendar-window .classic-toolbar [data-dropdown="view"] ul a[data-value="list"]')
                .on('wait', function () {
                    $('.io-ox-calendar-window .classic-toolbar [data-dropdown="view"] ul').css('display', 'block');
                })
                .on('hide', function () {
                    $('.io-ox-calendar-window .classic-toolbar [data-dropdown="view"] ul').css('display', '');
                })
                .end()
            .on('stop', function () {
                if (createApp) {
                    createApp.quit();
                    createApp = null;
                }
            })
            .start();
    });
});
