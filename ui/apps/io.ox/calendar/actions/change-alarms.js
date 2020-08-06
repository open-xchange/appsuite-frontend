/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2018 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/calendar/actions/change-alarms', [
    'io.ox/calendar/api',
    'io.ox/backbone/views/modal',
    'io.ox/backbone/mini-views/alarms',
    'io.ox/calendar/util',
    'gettext!io.ox/calendar',
    'less!io.ox/calendar/style'
], function (calApi, ModalDialog, AlarmsView, util, gt) {

    'use strict';

    var showDialog = function (appointmentData, options) {
        options = options || {};
        var alarmsview = new AlarmsView.linkView({ model: new Backbone.Model(appointmentData) });
        new ModalDialog({
            title: gt('Change reminders')
        })
        .build(function () {
            var strings = util.getDateTimeIntervalMarkup(appointmentData, { output: 'strings', zone: moment().tz() }),
                recurrenceString = util.getRecurrenceString(appointmentData),
                descriptionId = _.uniqueId('alarms-dialog-description-');

            this.$el.attr('aria-describedby', descriptionId);

            this.$body.append(
                $('<p>').attr('id', descriptionId).append(
                    $('<b>').text(appointmentData.summary),
                    $.txt(', '),
                    $.txt(strings.dateStr),
                    $.txt(recurrenceString !== '' ? ' \u2013 ' + recurrenceString : ''),
                    $.txt(' '),
                    $.txt(strings.timeStr)
                ),
                $('<fieldset>').append(
                    $('<legend class="confirm-dialog-legend">').text(gt('Reminder')),
                    alarmsview.render().$el
                )
            );
        })
        .addCancelButton()
        //#. 'Change' as text for an apply button to change the reminder of an appointment alert via a modal dialog.
        .addButton({ action: 'ok', label: gt('Change'), className: 'btn-primary' })
        .on('ok', function () {
            var params = { id: appointmentData.id, folder: appointmentData.folder, alarms: alarmsview.model.get('alarms') };
            if (options.single && appointmentData.recurrenceId) {
                params.recurrenceId = appointmentData.recurrenceId;
            }
            calApi.updateAlarms(params, util.getCurrentRangeOptions());
        })
        .open();
    };

    return function (appointmentData) {
        if (appointmentData.recurrenceId && appointmentData.seriesId) {
            new ModalDialog({ title: gt('Change appointment reminders'), width: 600 })
                .build(function () {
                    this.$body.append(gt('This appointment is part of a series. Do you want to change your reminders for the whole series or just for this appointment within the series?'));
                })
                .addCancelButton({ left: true })
                .addButton({ className: 'btn-default', label: gt('Change appointment'), action: 'appointment' })
                .addButton({ action: 'series',
                    //#. Use singular in this context
                    label: gt('Change series') })
                .on('series', function () { showDialog(appointmentData, { single: false }); })
                .on('appointment', function () { showDialog(appointmentData, { single: true }); })
                .open();
            return;
        }
        showDialog(appointmentData, { single: true });
    };

});
