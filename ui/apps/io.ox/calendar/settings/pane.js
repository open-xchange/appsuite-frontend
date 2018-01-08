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
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define('io.ox/calendar/settings/pane', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/extensible',
    'io.ox/backbone/mini-views',
    'io.ox/backbone/mini-views/alarms',
    'io.ox/core/settings/util',
    'settings!io.ox/calendar',
    'gettext!io.ox/calendar'
], function (ext, ExtensibleView, mini, AlarmsView, util, settings, gt) {

    'use strict';

    // apply some defaults
    if (settings.get('chronos/defaultAlarmDateTime') === undefined) {
        settings.set('chronos/defaultAlarmDateTime', [{
            action: 'DISPLAY',
            description: '',
            trigger: { duration: '-PT15M', related: 'START' }
        }]);
    }
    if (settings.get('chronos/defaultAlarmDate') === undefined) {
        settings.set('chronos/defaultAlarmDate', [{
            action: 'DISPLAY',
            description: '',
            trigger: { duration: '-PT12H', related: 'START' }
        }]);
    }
    if (settings.get('birthdays/defaultAlarmDate') === undefined) {
        settings.set('birthdays/defaultAlarmDate', []);
    }

    ext.point('io.ox/calendar/settings/detail').extend({
        index: 100,
        id: 'view',
        draw: function () {
            this.append(
                new ExtensibleView({ point: 'io.ox/calendar/settings/detail/view', model: settings })
                .inject({
                    getIntervalOptions: function () {
                        return [5, 10, 15, 20, 30, 60].map(function (i) {
                            i = String(i);
                            return { label: gt('%1$d minutes', i), value: i };
                        });
                    },
                    getTimeOptions: function () {
                        var array = [], m = moment().startOf('day');
                        for (var i = 0; i < 24; i++) {
                            array.push({ label: m.format('LT'), value: String(i) });
                            m.add(1, 'hour');
                        }
                        return array;
                    },
                    getWeekDays: function () {
                        return _(new Array(7)).map(function (num, index) {
                            var weekday = moment().weekday(index);
                            return {
                                value: weekday.day(),
                                label: weekday.format('dddd')
                            };
                        });
                    },
                    getWeekLength: function () {
                        return _(new Array(7)).map(function (num, index) {
                            return {
                                value: index + 1,
                                label: gt.format(gt.ngettext('%1$d day', '%1$d days', index + 1), index + 1)
                            };
                        });
                    }
                })
                .build(function () {
                    this.listenTo(settings, 'change', function () {
                        settings.saveAndYell();
                    });
                })
                .render().$el
            );
        }
    });

    var INDEX = 0;

    ext.point('io.ox/calendar/settings/detail/view').extend(
        //
        // Header
        //
        {
            id: 'header',
            index: INDEX += 100,
            render: function () {
                this.$el.addClass('io-ox-calendar-settings').append(
                    util.header(gt.pgettext('app', 'Calendar'))
                );
            }
        },
        //
        // View
        //
        {
            id: 'view',
            index: INDEX += 100,
            render: function () {
                this.$el.append(
                    util.fieldset(
                        //#. the noun, not the verb (e.g. German "Anzeige")
                        gt.pgettext('noun', 'View'),
                        $('<div class="form-group row">').append(
                            // start
                            $('<div class="col-md-4">').append(
                                $('<label for="settings-startTime">').text(gt('Start of working time')),
                                new mini.SelectView({ id: 'settings-startTime', name: 'startTime', model: settings, list: this.getTimeOptions() }).render().$el
                            ),
                            // end
                            $('<div class="col-md-4">').append(
                                $('<label for="settings-endTime">').text(gt('End of working time')),
                                new mini.SelectView({ id: 'settings-endTime', name: 'endTime', model: settings, list: this.getTimeOptions() }).render().$el
                            ),
                            // scale
                            $('<div class="col-md-4">').append(
                                //#. Context: Calendar settings. Default time scale in minutes for new appointments.
                                $('<label for="settings-interval">').text(gt('Time scale')),
                                new mini.SelectView({ id: 'settings-interval', name: 'interval', model: settings, list: this.getIntervalOptions() }).render().$el
                            )
                        ),
                        // declined
                        $('<div class="form-group">').append(
                            util.checkbox('showDeclinedAppointments', gt('Show declined appointments'), settings)
                        )
                    )
                );
            }
        },
        //
        // Work week
        //
        {
            id: 'workweek',
            index: INDEX += 100,
            render: function () {
                this.$el.append(
                    util.fieldset(
                        gt('Workweek view'),
                        // start & length
                        $('<div class="form-group row">').append(
                            // first day
                            $('<div class="col-md-4">').append(
                                $('<label for="settings-workweekStart">').text(gt('Week start')),
                                new mini.SelectView({ id: 'settings-workweekStart', name: 'workweekStart', model: settings, list: this.getWeekDays(), integer: true }).render().$el
                            ),
                            // work week length
                            $('<div class="col-md-4">').append(
                                $('<label for="settings-numDaysWorkweek">').text(gt('Workweek length')),
                                new mini.SelectView({ id: 'settings-numDaysWorkweek', name: 'numDaysWorkweek', model: settings, list: this.getWeekLength(), integer: true }).render().$el
                            )
                        )
                    )
                );
            }
        },
        //
        // New
        //
        {
            id: 'New',
            index: INDEX += 100,
            render: function () {
                this.$el.append(
                    util.fieldset(
                        gt('New appointment'),
                        // same width as col-md-10 but without the strange input and hover issues
                        $('<div>').css('width', '83.33333333%').append(
                            $('<label>').text(gt('Default reminder')),
                            new AlarmsView({ model: settings, attribute: 'chronos/defaultAlarmDateTime' }).render().$el
                        ),
                        // same width as col-md-10 but without the strange input and hover issues
                        $('<div>').css('width', '83.33333333%').append(
                            $('<label>').text(gt('Default reminder for all day appointments')),
                            new AlarmsView({ model: settings, attribute: 'chronos/defaultAlarmDate' }).render().$el
                        ),
                        // same width as col-md-10 but without the strange input and hover issues
                        $('<div>').css('width', '83.33333333%').append(
                            $('<label>').text(gt('Default reminder for appointments in birthday calendar')),
                            new AlarmsView({ model: settings, attribute: 'birthdays/defaultAlarmDate' }).render().$el
                        ),
                        // all day
                        util.checkbox('markFulltimeAppointmentsAsFree', gt('Mark all day appointments as free'), settings)
                    )
                );
            }
        },
        //
        // Notifications
        //
        {
            id: 'notifications',
            index: INDEX += 100,
            render: function () {
                this.$el.append(
                    util.fieldset(gt('Email notifications'),
                        $('<div class="form-group">').append(
                            util.checkbox('notifyNewModifiedDeleted', gt('Receive notification for appointment changes'), settings),
                            util.checkbox('notifyAcceptedDeclinedAsCreator', gt('Receive notification as appointment creator when participants accept or decline'), settings),
                            util.checkbox('notifyAcceptedDeclinedAsParticipant', gt('Receive notification as appointment participant when other participants accept or decline'), settings),
                            util.checkbox('deleteInvitationMailAfterAction', gt('Automatically delete the invitation email after the appointment has been accepted or declined'), settings)
                        )
                    )
                );
            }
        }
    );
});
