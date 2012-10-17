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
            NOTIFICATIONS_FOR_ACCEPTDECLINEDPARTICIPANT: gt('E-Mail notification for appointment participant?'),
            YES: gt('Yes'),
            NO: gt('No')
        },
        optionsInterval = [gt('5'), gt('10'), gt('15'), gt('20'), gt('30'), gt('60')],
        optionsTime = [gt('00:00'),
                       gt('01:00'),
                       gt('02:00'),
                       gt('03:00'),
                       gt('04:00'),
                       gt('05:00'),
                       gt('06:00'),
                       gt('07:00'),
                       gt('08:00'),
                       gt('09:00'),
                       gt('10:00'),
                       gt('11:00'),
                       gt('12:00'),
                       gt('13:00'),
                       gt('14:00'),
                       gt('15:00'),
                       gt('16:00'),
                       gt('17:00'),
                       gt('18:00'),
                       gt('19:00'),
                       gt('20:00'),
                       gt('21:00'),
                       gt('22:00'),
                       gt('23:00')],
        optionsView = [gt('Calendar'), gt('Team'), gt('List')],
        optionsCalendarRange =  [gt('Day'), gt('Work Week'), gt('Month'), gt('Week'), gt('Custom')],
        optionsReminder = [gt('no reminder'),
                            gt('15 minutes'),
                            gt('30 minutes'),
                            gt('45 minutes'),
                            gt('1 hour'),
                            gt('2 hour'),
                            gt('4 hour'),
                            gt('6 hour'),
                            gt('8 hour'),
                            gt('12 hour'),
                            gt('1 day'),
                            gt('2 days'),
                            gt('3 days'),
                            gt('4 days'),
                            gt('5 days'),
                            gt('6 days'),
                            gt('1 week'),
                            gt('2 weeks'),
                            gt('3 weeks'),
                            gt('4 weeks')],

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
                optionsReminderSelection: optionsReminder

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
