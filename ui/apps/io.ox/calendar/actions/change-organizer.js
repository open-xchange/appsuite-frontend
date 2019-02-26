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
    'io.ox/core/tk/typeahead',
    'io.ox/participants/model',
    'io.ox/participants/chronos-views',
    'io.ox/core/yell',
    'less!io.ox/calendar/style'
], function (calApi, ModalDialog, util, gt, mini, Typeahead, pModel, pViews, yell) {

    'use strict';

    return {
        // only allow series and this and future
        openDialog: function (appointmentData) {

            if (!appointmentData) return;
            util.showRecurrenceDialog(appointmentData, { dontAllowExceptions: true }).done(function (result) {
                if (result === 'cancel') return;

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
                        $('<label>').text(gt('Select new organizer')).attr({ for: guid = _.uniqueId('label-') }),
                        typeahead.$el.attr({ id: guid }),
                        $('<label>').text(gt('Please leave a comment for other participants.')).attr({ for: guid = _.uniqueId('label-') }),
                        new mini.InputView({ name: 'comment', model: this.model, placeholder: gt('Password'), autocomplete: false }).render().$el.attr('id', guid)
                    );
                    typeahead.render();

                    this.model.once('change:newOrganizer', function () {
                        self.$body.find('label').first().before(
                            $('<label>').text(gt('New organizer')).attr({ for: guid = _.uniqueId('label-') }),
                            organizerView.render().$el.attr({ id: guid })
                        );
                    });

                    // for debugging (prevents closing of autocomplete)
                    // typeahead.$el.data('ttTypeahead').dropdown.close = $.noop;
                    // typeahead.$el.data('ttTypeahead').dropdown.empty = $.noop;
                })
                .addAlternativeButton({ action: 'cancel', label: gt('Cancel') })
                .addButton({ action: 'ok', label: gt('Ok'), className: 'btn-primary' })
                .on('ok', function () {
                    var params = {
                        id: appointmentData.seriesId || appointmentData.id,
                        folder: appointmentData.folder,
                        organizer: this.model.get('newOrganizer').pick(['cn', 'email', 'entity', 'uri'])
                    };
                    // new organizer is the same as the old organizer... nothing to do
                    if (params.organizer.entity === appointmentData.organizer.entity) return;

                    if (result === 'thisandfuture') {
                        params.recurrenceId = appointmentData.recurrenceId;
                    }
                    calApi.changeOrganizer(params, _.extend(util.getCurrentRangeOptions(), { comment: this.model.get('comment'), recurrenceRange: (result === 'thisandfuture' ? 'THISANDFUTURE' : undefined) }))
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
