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
    'gettext!io.ox/calendar',
    'io.ox/backbone/mini-views',
    'io.ox/core/settings/util',
    'settings!io.ox/calendar',
    'io.ox/core/notifications'
], function (ext, gt, mini, util, settings, notifications) {

    'use strict';

    var POINT = 'io.ox/calendar/settings/detail',

        optionsInterval = function () {
            return _.map([5, 10, 15, 20, 30, 60], function (i) {
                i = String(i);
                return { label: gt.noI18n(i), value: i };
            });
        },

        optionsTime = function () {
            var array = [],
                m = moment().startOf('day');
            for (var i = 0; i < 24; i++) {
                array.push({
                    label: m.format('LT'),
                    value: String(i)
                });
                m.add(1, 'hour');
            }
            return array;
        },

        optionsReminder =  function () {
            var minInt = [15, 30, 45, 60, 120, 240, 360, 480, 720, 1440, 2880, 4320, 5760, 7200, 8640, 10080, 20160, 30240, 40320],
                list = [
                    { label: gt('No reminder'), value: '-1' },
                    { label: gt.format(gt.ngettext('%d minute', '%d minutes', 0), 0), value: '0' }
                ];
            _(minInt).each(function (m) {
                var dur = moment.duration(m, 'minutes');
                list.push({
                    label: dur.humanize(),
                    value: String(dur.asMinutes())
                });
            });
            return list;
        },
        reloadMe = [];

    ext.point(POINT).extend({
        index: 100,
        id: 'calendarsettings',
        draw: function () {
            var holder = $('<div class="io-ox-calendar-settings">');
            this.append(holder);
            ext.point(POINT + '/pane').invoke('draw', holder);
        }
    });

    ext.point(POINT + '/pane').extend({
        index: 100,
        id: 'header',
        draw: function () {
            this.append(util.header(gt.pgettext('app', 'Calendar')));
        }
    });

    settings.on('change', function (setting) {
        var showNotice = _(reloadMe).some(function (attr) {
            return attr === setting;
        });
        settings.saveAndYell(undefined, showNotice ? { force: true } : {}).then(
            function success() {

                if (showNotice) {
                    notifications.yell(
                        'success',
                        gt('The setting has been saved and will become active when you enter the application the next time.')
                    );
                }
            }
        );
    });

    ext.point(POINT + '/pane').extend({
        index: 200,
        id: 'common',
        draw: function () {
            this.append(
                $('<fieldset>').append(
                    $('<div class="form-group">').append(
                        $('<div class="row">').append(
                            util.select('interval', gt('Time scale in minutes'), settings, optionsInterval())
                        )
                    ),
                    $('<div class="form-group">').append(
                        $('<div class="row">').append(
                            util.select('startTime', gt('Start of working time'), settings, optionsTime())
                        )
                    ),
                    $('<div class="form-group">').append(
                        $('<div class="row">').append(
                            util.select('endTime', gt('End of working time'), settings, optionsTime())
                        )
                    ),
                    $('<div class="form-group expertmode">').append(
                        util.checkbox('showDeclinedAppointments', gt('Show declined appointments'), settings)
                    )
                )
            );
        }
    });

    ext.point(POINT + '/pane').extend({
        index: 300,
        id: 'appointment',
        draw: function () {
            this.append(
                util.fieldset(gt('New appointment'),
                    $('<div class="form-group expertmode">').append(
                        $('<div class="row">').append(
                            util.select('defaultReminder', gt('Default reminder'), settings, optionsReminder())
                        )
                    ),
                    $('<div class="form-group expertmode">').append(
                        util.checkbox('markFulltimeAppointmentsAsFree', gt('Mark all day appointments as free'), settings)
                    )
                )
            );
        }
    });

    ext.point(POINT + '/pane').extend({
        index: 400,
        id: 'notifications',
        draw: function () {
            this.append(
                util.fieldset(gt('Email notifications'),
                    $('<div class="form-group expertmode">').append(
                        util.checkbox('notifyNewModifiedDeleted', gt('Receive notification for appointment changes'), settings),
                        util.checkbox('notifyAcceptedDeclinedAsCreator', gt('Receive notification as appointment creator when participants accept or decline'), settings),
                        util.checkbox('notifyAcceptedDeclinedAsParticipant', gt('Receive notification as appointment participant when other participants accept or decline'), settings),
                        util.checkbox('deleteInvitationMailAfterAction', gt('Automatically delete the invitation email after the appointment has been accepted or declined'), settings)
                    )
                )
            );
        }
    });

    ext.point(POINT + '/pane').extend({
        index: 500,
        id: 'workweek',
        draw: (function () {
            var m = moment(),
                days = _(new Array(7)).map(function (num, index) {
                    var weekday = m.weekday(index);
                    return {
                        value: weekday.day(),
                        label: weekday.format('dddd')
                    };
                }),
                counts = _(new Array(7)).map(function (num, index) {
                    return {
                        value: index + 1,
                        label: index + 1
                    };
                }),
                NumberSelectView = mini.SelectView.extend({
                    onChange: function () {
                        this.model.set(this.name, parseInt(this.$el.val(), 10) || 0);
                    }
                });
            return function () {
                this.append(
                    util.fieldset(gt('Calendar workweek view'),
                        $('<div class="form-group expertmode">').append(
                            $('<div class="row">').append(
                                util.select('numDaysWorkweek', gt('Number of days in work week'), settings, counts, NumberSelectView)
                            )
                        ),
                        $('<div class="form-group expertmode">').append(
                            $('<div class="row">').append(
                                util.select('workweekStart', gt('Work week starts on'), settings, days, NumberSelectView)
                            )
                        )
                    )
                );
            };
        }())
    });

});
