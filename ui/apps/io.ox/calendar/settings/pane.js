/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define('io.ox/calendar/settings/pane',
    ['settings!io.ox/calendar',
     'io.ox/core/date',
     'io.ox/calendar/settings/model',
     'io.ox/core/extensions',
     'io.ox/core/notifications',
     'gettext!io.ox/calendar'
    ], function (settings, date, calendarSettingsModel, ext, notifications, gt) {

    'use strict';

    var model =  settings.createModel(calendarSettingsModel),
        POINT = 'io.ox/calendar/settings/detail',
        reloadMe = [],

        optionsInterval = [
            {label: gt.noI18n('5'), value: '5'},
            {label: gt.noI18n('10'), value: '10'},
            {label: gt.noI18n('15'), value: '15'},
            {label: gt.noI18n('20'), value: '20'},
            {label: gt.noI18n('30'), value: '30'},
            {label: gt.noI18n('60'), value: '60'}
        ],

        optionsTime = function () {
            var array = [];
            for (var i = 0; i < 24; i++) {
                array.push({
                    label : new date.Local(0, 0, 0, i, 0, 0, 0).format(date.TIME),
                    value : String(i)
                });
            }
            return array;
        },

        optionsYesNo = [{label: gt('Yes'), value: true}, {label: gt('No'), value: false}],

        optionsReminder = [
            {label: gt('No reminder'), value: '-1'},
            {label: gt('0 minutes'), value: '0'},
            {label: gt('15 minutes'), value: '15'},
            {label: gt('30 minutes'), value: '30'},
            {label: gt('45 minutes'), value: '45'},
            {label: gt('1 hour'), value: '60'},
            {label: gt('2 hour'), value: '120'},
            {label: gt('4 hour'), value: '240'},
            {label: gt('6 hour'), value: '360'},
            {label: gt('8 hour'), value: '480'},
            {label: gt('12 hour'), value: '720'},
            {label: gt('1 day'), value: '1440'},
            {label: gt('2 days'), value: '2880'},
            {label: gt('3 days'), value: '4320'},
            {label: gt('4 days'), value: '5760'},
            {label: gt('5 days'), value: '7200'},
            {label: gt('6 days'), value: '8640'},
            {label: gt('1 week'), value: '10080'},
            {label: gt('2 weeks'), value: '20160'},
            {label: gt('3 weeks'), value: '30240'},
            {label: gt('4 weeks'), value: '40320'}
        ],

        buildOptionsSelect = function (list, name, id) {
            var select = $('<select>').attr({ id: id }).addClass('input-xlarge').on('change', function () {
                model.set(name, this.value);
            });
            _.map(list, function (option) {
                var o = $('<option>').attr({ value: option.value}).text(option.label);
                return select.append(o);
            });
            select.val(model.get(name));
            return select;
        },

        buildInputRadio = function (list, name) {
            return _.map(list, function (option) {
                var o = $('<input type="radio" name="' + name + '">').val(option.value)
                .on('click', function () {
                    model.set(name, boolParser(this.value));
                });
                if (model.get(name) === option.value) o.prop('checked', true);
                return $('<label class="radio">').text(option.label).append(o);
            });
        },

        boolParser = function (value) {
            return value === 'true' ? true : false;
        };

    model.on('change', function (e, path) {
        model.saveAndYell().then(
            function success() {
                var showNotice = _(reloadMe).any(function (attr) {
                    return attr === path;
                });
                if (showNotice) {
                    notifications.yell(
                        'success',
                        gt('The setting has been saved and will become active when you enter the application the next time.')
                    );
                }
            }
        );
    });

    ext.point(POINT).extend({
        index: 100,
        id: 'calendarsettings',
        draw: function () {
            var self = this,
                pane = $('<div class="io-ox-tasks-settings">');
            self.append($('<div>').addClass('section').append(pane));
            ext.point(POINT + '/pane').invoke('draw', pane);
        }
    });

    ext.point(POINT + '/pane').extend({
        index: 100,
        id: 'header',
        draw: function () {
            this.append(
                $('<h1>').text(gt.pgettext('app', 'Calendar'))
            );
        }
    });

    ext.point(POINT + '/pane').extend({
        index: 200,
        id: 'time',
        draw: function () {
            this.append(
                $('<legend>').addClass('sectiontitle expertmode').text(gt('Time')),
                $('<div>').addClass('control-group expertmode').append(
                    $('<label>').attr('for', 'interval_in_minutes').addClass('control-label').text(gt('Time scale in minutes')),
                    $('<div>').addClass('controls').append(
                        $('<label>').addClass('select').append(
                            buildOptionsSelect(optionsInterval, 'interval', 'interval_in_minutes')
                        )
                    )
                ),
                $('<div>').addClass('control-group expertmode').append(
                    $('<label>').attr('for', 'working_time_start').addClass('control-label').text(gt('Start of working time')),
                    $('<div>').addClass('controls').append(
                        $('<label>').addClass('select').append(
                            buildOptionsSelect(optionsTime(), 'startTime', 'working_time_start')
                        )
                    )
                ),
                $('<div>').addClass('control-group expertmode').append(
                    $('<label>').attr('for', 'working_time_end').addClass('control-label').text(gt('End of working time')),
                    $('<div>').addClass('controls').append(
                        $('<label>').addClass('select').append(
                            buildOptionsSelect(optionsTime(), 'endTime', 'working_time_end')
                        )
                    )
                )
            );
        }
    });

    ext.point(POINT + '/pane').extend({
        index: 300,
        id: 'calendar_view',
        draw: function () {
            this.append(
                $('<legend>').addClass('sectiontitle').text(gt('Default calendar view')),
                $('<div>').addClass('form-horizontal').append(
                    $('<div>').addClass('control-group expertmode').append(
                        $('<label>').addClass('control-label').text(gt('Show declined appointments')),
                        $('<div>').addClass('controls').append(
                            buildInputRadio(optionsYesNo, 'showDeclinedAppointments')
                        )
                    )
                )
            );
        }
    });

    ext.point(POINT + '/pane').extend({
        index: 400,
        id: 'appointment',
        draw: function () {
            this.append(
                $('<legend>').addClass('sectiontitle').text(gt('New appointment')),
                $('<div>').addClass('control-group expertmode').append(
                    $('<label>').attr('for', 'time_for_reminder').addClass('control-label').text(gt('Default reminder')),
                    $('<div>').addClass('controls').append(
                        $('<label>').addClass('select').append(
                            buildOptionsSelect(optionsReminder, 'defaultReminder', 'time_for_reminder')
                        )
                    )
                ),
                $('<div>').addClass('form-horizontal').append(
                    $('<div>').addClass('control-group expertmode').append(
                        $('<label>').addClass('control-label').text(gt('Mark all day appointments as free')),
                        $('<div>').addClass('controls').append(
                            buildInputRadio(optionsYesNo, 'markFulltimeAppointmentsAsFree')
                        )
                    )
                )
            );
        }
    });

    ext.point(POINT + '/pane').extend({
        index: 500,
        id: 'notifications',
        draw: function () {
            this.append(
                $('<legend>').addClass('sectiontitle').text(gt('Email notification for appointment')),
                $('<div>').addClass('form-horizontal').append(
                    $('<div>').addClass('control-group expertmode').append(
                        $('<label>').addClass('control-label').text(gt('Email notification for New, Changed, Deleted?')),
                        $('<div>').addClass('controls').append(
                            buildInputRadio(optionsYesNo, 'notifyNewModifiedDeleted')
                        )
                    )
                ),
                $('<legend>').addClass('sectiontitle').text(gt('Email notification for Accept/Declined')),
                $('<div>').addClass('form-horizontal').append(
                    $('<div>').addClass('control-group expertmode').append(
                        $('<label>').addClass('control-label').text(gt('Email notification for appointment creator?')),
                        $('<div>').addClass('controls').append(
                            buildInputRadio(optionsYesNo, 'notifyAcceptedDeclinedAsCreator')
                        )
                    )
                ),
                $('<div>').addClass('form-horizontal').append(
                    $('<div>').addClass('control-group expertmode').append(
                        $('<label>').addClass('control-label').text(gt('Email notification for appointment participant?')),
                        $('<div>').addClass('controls').append(
                            buildInputRadio(optionsYesNo, 'notifyAcceptedDeclinedAsParticipant')
                        )
                    )
                ),
                $('<legend>').addClass('sectiontitle').text(gt('Incoming Notification Mails')),
                $('<div>').addClass('form-horizontal').append(
                    $('<div>').addClass('control-group expertmode').append(
                        $('<label>').addClass('control-label').text(gt('Automatically delete a notification mail after it has been accepted or declined?')),
                        $('<div>').addClass('controls').append(
                            buildInputRadio(optionsYesNo, 'deleteInvitationMailAfterAction')
                        )
                    )
                )
            );
        }
    });

});
