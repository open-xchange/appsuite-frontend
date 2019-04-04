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

    return function (appointmentData) {
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
        .addAlternativeButton({ action: 'cancel', label: gt('Cancel') })
        .addButton({ action: 'ok', label: gt('Ok'), className: 'btn-primary' })
        .on('ok', function () {
            calApi.updateAlarms({ id: appointmentData.id, folder: appointmentData.folder, alarms: alarmsview.model.get('alarms') }, util.getCurrentRangeOptions());
        })
        .open();
    };
});
