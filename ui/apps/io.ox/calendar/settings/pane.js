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

define('io.ox/calendar/settings/pane', [
    'settings!io.ox/calendar',
    'io.ox/core/date',
    'io.ox/calendar/settings/model',
    'io.ox/core/extensions',
    'io.ox/core/notifications',
    'gettext!io.ox/calendar',
    'io.ox/backbone/mini-views'
], function (settings, date, calendarSettingsModel, ext, notifications, gt, mini) {

    'use strict';

    var model =  settings.createModel(calendarSettingsModel),
        POINT = 'io.ox/calendar/settings/detail',
        reloadMe = [],

        optionsInterval = [
            { label: gt.noI18n('5'), value: '5' },
            { label: gt.noI18n('10'), value: '10' },
            { label: gt.noI18n('15'), value: '15' },
            { label: gt.noI18n('20'), value: '20' },
            { label: gt.noI18n('30'), value: '30' },
            { label: gt.noI18n('60'), value: '60' }
        ],

        optionsTime = function () {
            var array = [];
            for (var i = 0; i < 24; i++) {
                array.push({
                    label: new date.Local(0, 0, 0, i, 0, 0, 0).format(date.TIME),
                    value: String(i)
                });
            }
            return array;
        },

        minInt = [15,30,45,60,120,240,360,480,720,1440,2880,4320,5760,7200,8640,10080,20160,30240,40320],

        optionsReminder = [
            { label: gt('No reminder'), value: '-1' },
            { label: gt.format(gt.ngettext('%d minute', '%d minutes', 0), 0), value: '0' }
        ];

    _(minInt).each(function (m) {
        var dur = moment.duration(m, 'minutes');
        optionsReminder.push({
            label: dur.humanize(true),
            value: dur.asMinutes()
        });
    });

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
                $('<fieldset>').append(
                    $('<legend>').addClass('sectiontitle').append(
                        $('<h2>').text(gt('Time'))
                    ),
                    $('<div>').addClass('form-group').append(
                        $('<div>').addClass('row').append(
                            $('<label>').attr('for', 'interval').addClass('control-label col-sm-4').text(gt('Time scale in minutes')),
                            $('<div>').addClass('col-sm-4').append(
                                new mini.SelectView({ list: optionsInterval, name: 'interval', model: model, id: 'interval', className: 'form-control' }).render().$el
                            )
                        )
                    ),
                    $('<div>').addClass('form-group').append(
                        $('<div>').addClass('row').append(
                            $('<label>').attr('for', 'startTime').addClass('control-label col-sm-4').text(gt('Start of working time')),
                            $('<div>').addClass('col-sm-4').append(
                                new mini.SelectView({ list: optionsTime(), name: 'startTime', model: model, id: 'startTime', className: 'form-control' }).render().$el
                            )
                        )
                    ),
                    $('<div>').addClass('form-group').append(
                        $('<div>').addClass('row').append(
                            $('<label>').attr('for', 'endTime').addClass('control-label col-sm-4').text(gt('End of working time')),
                            $('<div>').addClass('col-sm-4').append(
                                new mini.SelectView({ list: optionsTime(), name: 'endTime', model: model, id: 'endTime', className: 'form-control' }).render().$el
                            )
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
                $('<fieldset>').append(
                    $('<legend>').addClass('sectiontitle expertmode').append(
                        $('<h2>').text(gt('Default calendar view'))
                    ),
                    $('<div>').addClass('form-group expertmode').append(
                        $('<div>').addClass('checkbox').append(
                            $('<label>').addClass('control-label').text(gt('Show declined appointments')).prepend(
                                new mini.CheckboxView({ name: 'showDeclinedAppointments', model: model }).render().$el
                            )
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
                $('<fieldset>').append(
                    $('<legend>').addClass('sectiontitle expertmode').append(
                        $('<h2>').text(gt('New appointment'))
                    ),
                    $('<div>').addClass('form-group expertmode').append(
                        $('<div>').addClass('row').append(
                            $('<label>').attr('for', 'defaultReminder').addClass('control-label col-sm-4').text(gt('Default reminder')),
                            $('<div>').addClass('col-sm-4').append(
                                new mini.SelectView({ list: optionsReminder, name: 'defaultReminder', model: model, id: 'defaultReminder', className: 'form-control' }).render().$el
                            )
                        )
                    ),
                    $('<div>').addClass('form-group expertmode').append(
                        $('<div>').addClass('checkbox').append(
                            $('<label>').addClass('control-label').text(gt('Mark all day appointments as free')).prepend(
                                new mini.CheckboxView({ name: 'markFulltimeAppointmentsAsFree', model: model }).render().$el
                            )
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
                $('<fieldset>').append(
                    $('<legend>').addClass('sectiontitle expertmode').append(
                        $('<h2>').text(gt('Email notifications'))
                    ),
                    $('<div>').addClass('form-group expertmode').append(
                        $('<div>').addClass('checkbox').append(
                            $('<label>').addClass('control-label').text(gt('Receive notification for appointment changes')).prepend(
                                new mini.CheckboxView({ name: 'notifyNewModifiedDeleted', model: model }).render().$el
                            )
                        ),
                        $('<div>').addClass('checkbox').append(
                            $('<label>').addClass('control-label').text(gt('Receive notification as appointment creator when participants accept or decline')).prepend(
                                new mini.CheckboxView({ name: 'notifyAcceptedDeclinedAsCreator', model: model }).render().$el
                            )
                        ),
                        $('<div>').addClass('checkbox').append(
                            $('<label>').addClass('control-label').text(gt('Receive notification as appointment participant when other participants accept or decline')).prepend(
                                new mini.CheckboxView({ name: 'notifyAcceptedDeclinedAsParticipant', model: model }).render().$el
                            )
                        ),
                        $('<div>').addClass('checkbox').append(
                            $('<label>').addClass('control-label').text(gt('Automatically delete incoming notifications after it has been accepted or declined')).prepend(
                                new mini.CheckboxView({ name: 'deleteInvitationMailAfterAction', model: model }).render().$el
                            )
                        )
                    )
                )
            );
        }
    });

});
