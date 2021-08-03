/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/calendar/actions/change-organizer', [
    'io.ox/calendar/api',
    'io.ox/backbone/views/modal',
    'io.ox/calendar/util',
    'gettext!io.ox/calendar',
    'io.ox/backbone/mini-views/common',
    'io.ox/core/tk/typeahead',
    'io.ox/participants/model',
    'io.ox/participants/chronos-views',
    'io.ox/core/yell',
    'less!io.ox/calendar/style',
    'io.ox/participants/add'
], function (calApi, ModalDialog, util, gt, mini, Typeahead, pModel, pViews, yell) {

    'use strict';

    return {
        // only allow series and this and future
        openDialog: function (appointmentData) {

            if (!appointmentData) return;
            util.showRecurrenceDialog(appointmentData, { dontAllowExceptions: true }).done(function (action) {
                if (action === 'cancel') return;

                new ModalDialog({
                    title: gt('Change organizer')
                })
                .build(function () {
                    this.model = new Backbone.Model({
                        newOrganizer: new Backbone.Model(_(appointmentData.attendees).findWhere({ entity: appointmentData.organizer.entity })),
                        comment: ''
                    });

                    var self = this,
                        strings = util.getDateTimeIntervalMarkup(appointmentData, { output: 'strings', zone: moment().tz() }),
                        recurrenceString = util.getRecurrenceString(appointmentData),
                        descriptionId = _.uniqueId('alarms-dialog-description-'),
                        guid = _.uniqueId('label-'),
                        organizerView = new pViews.ParticipantEntryView({
                            tagName: 'div',
                            model: this.model.get('newOrganizer'),
                            halo: false,
                            closeButton: false,
                            asHtml: true
                        }),
                        typeahead = new Typeahead({
                            apiOptions: {
                                contacts: false,
                                users: true,
                                groups: false,
                                distributionlists: false,
                                resources: false
                            },
                            extPoint: 'io.ox/participants/add',
                            harmonize: function (data) {
                                data = _(data).map(function (m) {
                                    return new pModel.Participant(m);
                                });

                                return _(data).filter(function (model) {
                                    // only internal users allowed, so no secondary mail addresses
                                    return model.get('field') === 'email1';
                                });
                            },
                            click: function (e, data, value) {
                                self.model.set('newOrganizer', new Backbone.Model(util.createAttendee(data)));

                                // clean typeahad input and redraw organizer
                                if (value) typeahead.$el.typeahead('val', '');
                                organizerView.model = self.model.get('newOrganizer');
                                organizerView.$el.empty();
                                organizerView.render();
                            }
                        });

                    this.$body.addClass('change-organizer-dialog').append(
                        $('<p>').attr('id', descriptionId).append(
                            $('<b>').text(appointmentData.summary),
                            $.txt(', '),
                            $.txt(strings.dateStr),
                            $.txt(recurrenceString !== '' ? ' \u2013 ' + recurrenceString : ''),
                            $.txt(' '),
                            $.txt(strings.timeStr)
                        ),
                        $('<label>').text(gt('New organizer')).attr({ for: guid = _.uniqueId('label-') }),
                        organizerView.render().$el.attr({ id: guid }),
                        $('<label>').text(gt('Select new organizer')).attr({ for: guid = _.uniqueId('label-') }),
                        typeahead.$el.attr({ id: guid }),
                        $('<label>').text(gt('Add a message to the notification email for the other participants.')).attr({ for: guid = _.uniqueId('label-') }),
                        new mini.InputView({ name: 'comment', model: this.model, placeholder: '', autocomplete: false }).render().$el.attr('id', guid)
                    );
                    typeahead.render();

                    // for debugging (prevents closing of autocomplete)
                    // typeahead.$el.data('ttTypeahead').dropdown.close = $.noop;
                    // typeahead.$el.data('ttTypeahead').dropdown.empty = $.noop;
                })
                .addCancelButton()
                //#. 'Change' as text for a button to apply the change of the organizer of an appointment.
                .addButton({ action: 'ok', label: gt('Change'), className: 'btn-primary' })
                .on('ok', function () {
                    var params = {
                        id: appointmentData.seriesId || appointmentData.id,
                        folder: appointmentData.folder,
                        organizer: this.model.get('newOrganizer').pick(['cn', 'email', 'entity', 'uri'])
                    };
                    // new organizer is the same as the old organizer... nothing to do
                    if (params.organizer.entity === appointmentData.organizer.entity) return;

                    if (action === 'thisandfuture') {
                        params.recurrenceId = appointmentData.recurrenceId;
                    }
                    calApi.changeOrganizer(params, _.extend(util.getCurrentRangeOptions(), { comment: this.model.get('comment'), recurrenceRange: (action === 'thisandfuture' ? 'THISANDFUTURE' : undefined) }))
                        .then(function () {
                            yell('success', gt('Organizer changed'));
                        }, yell);
                    this.model = null;
                })
                .open();
            });
        }
    };
});
