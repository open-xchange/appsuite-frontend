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
    'io.ox/contacts/util',
    'less!io.ox/calendar/style'
], function (calApi, ModalDialog, util, gt, mini, contactsUtil) {

    'use strict';

    return {
        openDialog: function (appointmentData) {

            if (!appointmentData) return;

            var attendeeList = _(appointmentData.attendees).chain().map(function (attendee) {
                // only internal attendees for now
                if (attendee.cuType !== 'INDIVIDUAL' || attendee.entity === undefined) return;
                if (appointmentData.organizer && appointmentData.organizer.entity && attendee.entity === appointmentData.organizer.entity) return;
                var sortName = attendee.contact ? attendee.contact.last_name || attendee.contact.first_name || attendee.contact.display_name || attendee.cn || '' : attendee.cn || '';

                return { value: attendee.entity, label: attendee.contact ? contactsUtil.getFullName(attendee.contact) : attendee.cn, sortName: sortName };
            })
            .compact()
            .sortBy(function (obj) {
                return obj.sortName;
            }).value();

            if (!attendeeList.length) {
                require(['io.ox/core/yell'], function (yell) {
                    //.# error message when someone tries to change the organizer of an appointment
                    yell('info', gt('You need at least one other user to change the organizer.'));
                });
                return;
            }

            new ModalDialog({
                title: gt('Change organizer')
            })
            .build(function () {

                var strings = util.getDateTimeIntervalMarkup(appointmentData, { output: 'strings', zone: moment().tz() }),
                    recurrenceString = util.getRecurrenceString(appointmentData),
                    descriptionId = _.uniqueId('alarms-dialog-description-'),
                    guid = _.uniqueId('label-');

                this.model = new Backbone.Model({ comment: '', newOrganizer: attendeeList[0].value });

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
                    $('<label>').text(gt('Select new organizer')).attr({ for: guid = _.uniqueId('label-') }),
                    new mini.SelectView({ name: 'newOrganizer', model: this.model, list: attendeeList }).render().$el.attr('id', guid),
                    $('<label>').text(gt('Leave a comment for the new organizer.')).attr({ for: guid = _.uniqueId('label-') }),
                    new mini.InputView({ name: 'comment', model: this.model, placeholder: gt('Password'), autocomplete: false }).render().$el.attr('id', guid)
                );
            })
            .addAlternativeButton({ action: 'cancel', label: gt('Cancel') })
            .addButton({ action: 'ok', label: gt('Ok'), className: 'btn-primary' })
            .on('ok', function () {

                // only series master updates are supported atm
                calApi.update({
                    id: appointmentData.seriesId || appointmentData.id,
                    folder: appointmentData.folder, organizer: _(_(appointmentData.attendees).where({ entity: this.model.get('newOrganizer') })[0]).pick(['cn', 'email', 'entity', 'uri'])
                }, {
                    comment: this.model.get('comment'),
                    sendInternalNotifications: true
                });
                this.model = null;
            })
            .open();
        }
    };
});
