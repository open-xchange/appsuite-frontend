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
       ['settings!io.ox/calendar', 'io.ox/calendar/settings/model',
        'dot!io.ox/calendar/settings/form.html', 'io.ox/core/extensions',
        'gettext!io.ox/calendar/calendar'], function (settings, calendarSettingsModel, tmpl, ext, gt) {

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
            NOTIFICATIONS_FOR_ACCEPTDECLINEDPARTICIPANT: gt('E-Mail notification for appointment participant?')

        },
        optionsInterval = [gt('5'), gt('10'), gt('15'), gt('20'), gt('30'), gt('60')],
        optionsTime = [{label: gt('00:00'), value: '0'},
                       {label: gt('01:00'), value: '1'},
                       {label: gt('02:00'), value: '2'},
                       {label: gt('03:00'), value: '3'},
                       {label: gt('04:00'), value: '4'},
                       {label: gt('05:00'), value: '5'},
                       {label: gt('06:00'), value: '6'},
                       {label: gt('07:00'), value: '7'},
                       {label: gt('08:00'), value: '8'},
                       {label: gt('09:00'), value: '9'},
                       {label: gt('10:00'), value: '10'},
                       {label: gt('11:00'), value: '11'},
                       {label: gt('12:00'), value: '12'},
                       {label: gt('13:00'), value: '13'},
                       {label: gt('14:00'), value: '14'},
                       {label: gt('15:00'), value: '15'},
                       {label: gt('16:00'), value: '16'},
                       {label: gt('17:00'), value: '17'},
                       {label: gt('18:00'), value: '18'},
                       {label: gt('19:00'), value: '19'},
                       {label: gt('20:00'), value: '20'},
                       {label: gt('21:00'), value: '21'},
                       {label: gt('22:00'), value: '22'},
                       {label: gt('23:00'), value: '23'}],

        optionsView = [{label: gt('Calendar'), value: 'calendar'},
                       {label: gt('Team'), value: 'team'},
                       {label: gt('List'), value: 'list'}],
        optionsCalendarRange =  [{label: gt('Day'), value: 'day'},
                                 {label: gt('Workweek'), value: 'workweek'},
                                 {label: gt('Month'), value: 'month'},
                                 {label: gt('Week'), value: 'week'},
                                 {label: gt('Custom'), value: 'custom'}],
        optionsReminder = [{label: gt('no reminder'), value: '0'},
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
        calendarViewSettings;

    var CalendarSettingsView = Backbone.View.extend({
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
                optionsTimeWorktime: optionsTime,
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

    ext.point('io.ox/calendar/settings/detail').extend({
        index: 200,
        id: 'calendarsettings',
        draw: function (data) {

            calendarViewSettings = new CalendarSettingsView({model: calendarSettings});
            var holder = $('<div>').css('max-width', '800px');
            this.append(holder.append(
                calendarViewSettings.render().el)
            );
        },

        save: function () {
//            console.log(calendarViewSettings.model);
            calendarViewSettings.model.save();
        }
    });

});
