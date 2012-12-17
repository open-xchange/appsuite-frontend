/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define('io.ox/calendar/settings/pane',
    ['settings!io.ox/calendar',
     'io.ox/core/date',
     'io.ox/calendar/settings/model',
     'dot!io.ox/calendar/settings/form.html',
     'io.ox/core/extensions',
     'io.ox/core/capabilities',
     'gettext!io.ox/calendar/calendar'
    ], function (settings, date, calendarSettingsModel, tmpl, ext, capabilities, gt) {

    'use strict';

    var calendarSettings =  settings.createModel(calendarSettingsModel),
        staticStrings =  {
            TITLE_CALENDAR: gt('Calendar'),
            TITLE_TIME: gt('Time'),
            INTERVAL_IN_MINUTES: gt('Interval in minutes'),
            WORKING_TIME_START: gt('Start of working time'),
            WORKING_TIME_END: gt('End of working time'),
            TITLE_VIEW: gt('Default calendar view'),
            VIEW: gt('View'),
            TR_CALENDAR_VIEW: gt('Time range for the calender view'),
            TR_TEAM_VIEW: gt('Time range for the team view'),
            TR_LIST_VIEW: gt('Time range for the list view'),
            TITLE_NEW_APPOINTMENT: gt('New appointment'),
            TIME_FOR_REMINDER: gt('Default time for reminder'),
            TITLE_NOTIFICATIONS_FOR_APPOINTMENT: gt('E-Mail notification for appointment'),
            NOTIFICATIONS_FOR_APPOINTMENTS: gt('E-Mail notification for New, Changed, Deleted?'),
            TITLE_NOTIFICATIONS_FOR_ACCEPTDECLINED: gt('E-Mail notification for Accept/Declined'),
            NOTIFICATIONS_FOR_ACCEPTDECLINEDCREATOR: gt('E-Mail notification for appointment creator?'),
            NOTIFICATIONS_FOR_ACCEPTDECLINEDPARTICIPANT: gt('E-Mail notification for appointment participant?'),
            SHOW_DECLINED_APPOINTMENTS: gt('Show declined appointments')
        },

        optionsInterval = [gt('5'), gt('10'), gt('15'), gt('20'), gt('30'), gt('60')],

        optionsTime = function () {
            var array = [];
            for (var i = 0; i < 24; i++) {
                array.push({
                    label : new date.Local(0, 0, 0, i, 0, 0, 0).format(date.TIME),
                    value : i + ''
                });
            }
            return array;
        },

        optionsView = [{label: gt('Day'), value: 'day'},
                       {label: gt('Workweek'), value: 'workweek'},
                       {label: gt('Week'), value: 'week'},
                       {label: gt('Month'), value: 'month'},
                       {label: gt('List'), value: 'list'}],

        optionsCalendarRange =  [{label: gt('Day'), value: 'day'},
                                 {label: gt('Workweek'), value: 'workweek'},
                                 {label: gt('Month'), value: 'month'},
                                 {label: gt('Week'), value: 'week'},
                                 {label: gt('Custom'), value: 'custom'}],

        optionsReminder = [{label: gt('No reminder'), value: '-1'},
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
                            {label: gt('4 weeks'), value: '40320'}],

        optionsYes = {label: gt('Yes'), value: true},
        optionsNo = {label: gt('No'), value: false},

        calendarViewSettings,
        CalendarSettingsView = Backbone.View.extend({
            tagName: "div",
            _modelBinder: undefined,
            initialize: function (options) {
                // create template
                this._modelBinder = new Backbone.ModelBinder();

            },
            render: function () {
                var self = this;
                self.$el.empty().append(tmpl.render('io.ox/calendar/settings', {
                    strings: staticStrings,
                    optionsIntervalMinutes: optionsInterval,
                    optionsTimeWorktime: optionsTime(),
                    optionsViewDefault: optionsView,
                    optionsCalendarRangeDefault: optionsCalendarRange,
                    optionsReminderSelection: optionsReminder,
                    optionsYesAnswers: optionsYes,
                    optionsNoAnswers: optionsNo
                }));

                var defaultBindings = Backbone.ModelBinder.createDefaultBindings(self.el, 'data-property');
                self._modelBinder.bind(self.model, self.el, defaultBindings);

                return self;
            }
        });

    if (capabilities.has('calendar')) {
        ext.point('io.ox/calendar/settings/detail').extend({
            index: 200,
            id: 'calendarsettings',
            draw: function (data) {
                calendarViewSettings = new CalendarSettingsView({model: calendarSettings});
                this.append($('<div>').addClass('section').append(
                    calendarViewSettings.render().el)
                );
            },
            save: function () {
                calendarViewSettings.model.save();
            }
        });
    }
});
