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

define('io.ox/calendar/actions/change-organizer', [
    'io.ox/calendar/api',
    'io.ox/backbone/views/modal',
    'io.ox/calendar/util',
    'gettext!io.ox/calendar',
    'io.ox/backbone/mini-views/common',
    'less!io.ox/calendar/style'
], function (calApi, ModalDialog, util, gt, mini) {

    'use strict';

    return {
        openDialog: function (appointmentData) {
            var model = new Backbone.Model({ comment: '' });

            new ModalDialog({
                title: gt('Change organizer')
            })
            .build(function () {
                var strings = util.getDateTimeIntervalMarkup(appointmentData, { output: 'strings', zone: moment().tz() }),
                    recurrenceString = util.getRecurrenceString(appointmentData),
                    descriptionId = _.uniqueId('alarms-dialog-description-'),
                    guid = _.uniqueId('containerlabel-');

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
                    $('<label>').text(gt('Leave a comment for the new organizer.')).attr({ for: guid }),
                    new mini.InputView({ name: 'comment', model: model, placeholder: gt('Password'), autocomplete: false }).render().$el.attr('id', guid)
                );
            })
            .addAlternativeButton({ action: 'cancel', label: gt('Cancel') })
            .addButton({ action: 'ok', label: gt('Ok'), className: 'btn-primary' })
            .on('ok', function () {
                console.log(model.attributes);
                model = null;
            })
            .open();
        }
    };
});
