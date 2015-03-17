/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */
define('io.ox/core/api/reminder',
    ['io.ox/core/http',
     'io.ox/tasks/api',
     'io.ox/calendar/api',
     'io.ox/core/date',
     'io.ox/core/event'
    ], function (http, taskAPI, calendarAPI, date, Events) {

    'use strict';

    // this works API is a bit different than other APIs. Although reminders are requested from the server at the standard refresh interval
    // we need to update the notification area independent from this.
    // To accomplish this we get the reminders 1 hour in advance and use a timeout that triggers when the next reminder is due

    var // object to store reminders that are not to display yet
        reminderStorage = {},
        // arrays to store the reminders that should be displayed currently
        tasksToDisplay = [],
        appointmentsToDisplay = [],
        // next reminder to be triggered
        nextReminder,
        // timer that triggers the next reminder
        reminderTimer,
        // updates the reminder storage
        updateReminders = function (reminders) {
            var keys = [];
            _(reminders).each(function (reminder) {
                keys.push(reminder.id);
            });
            reminderStorage = _.object( keys, reminders );
        },
        // function to check reminders which reminders should be displayed and keeps the timer for the next reminder up to date
        checkReminders = function () {
            //reset variables
            tasksToDisplay = [];
            appointmentsToDisplay = [];
            clearTimeout(reminderTimer);

            //check if nextReminder was removed meanwhile
            if (nextReminder && !reminderStorage[nextReminder.id]) {
                nextReminder = null;
            }
            //find the next due reminder
            _(reminderStorage).each(function (reminder) {
                if (reminder.alarm <= _.now()) {
                    //tasks
                    if (reminder.module === 4) {
                        tasksToDisplay.push(reminder);
                    // appointments
                    } else {
                        appointmentsToDisplay.push(reminder);
                    }
                } else if (!nextReminder || reminder.alarm < nextReminder.alarm) {
                    nextReminder = reminder;
                }
            });

            //trigger events so notification area is up to date
            api.trigger('set:tasks:reminder', tasksToDisplay);
            api.trigger('set:calendar:reminder', appointmentsToDisplay);

            if  (nextReminder) {
                var timeout = nextReminder.alarm - _.now();
                reminderTimer = setTimeout(function () {
                    nextReminder = null;
                    //get fresh reminders (a task or an appointment may have been deleted meanwhile)
                    api.getReminders();
                }, timeout);
            }
        };

    var api = {

        /**
         * delete reminder
         * @param  {object} or array of objects with reminderId, optional recurrence_position
         * @return {deferred}
         */
        deleteReminder: function (reminders) {
            return http.PUT({
                module: 'reminder',
                params: {action: 'delete'},
                data: reminders
            }).then(function () {
                if (_.isArray(reminders)) {
                   _(reminders).each(function (reminder) {
                        delete reminderStorage[reminder.id];
                    });
                } else {
                    delete reminderStorage[reminders.id];
                }
            });
        },

        /**
         * remind again (works only for task reminders)
         * @param  {number} remindDate (unix datetime)
         * @param  {string} reminderId
         * @return {deferred}
         */
        remindMeAgain: function (remindDate, reminderId) {
            return http.PUT({
                module: 'reminder',
                params: {action: 'remindAgain',
                         id: reminderId,
                         timezone: 'UTC'
                         },
                data: {alarm: remindDate}
            }).always(function () {
                //get the new data
                api.getReminders();
            });
        },

        /**
         * get reminders
         * @param  {number} range (end of scope)
         * @param  {number} module
         * @fires  api#set:tasks:reminder (reminderTaskId, reminderId)
         * @fires  api#set:calendar:reminder (reminderCalId)
         * @return {deferred}
         */
        getReminders: function (range) {
            return http.GET({
                module: 'reminder',
                params: {
                    action: 'range',
                    timezone: 'UTC',
                    // if no range given, get the reminders an our ahead(to be independent of global refresh)
                    end: range || (_.now() + date.HOUR)
                }
            }).pipe(function (list) {
                updateReminders(list);
                checkReminders();
                return list;
            });
        }
    };

    Events.extend(api);

    /**
     * bind to global refresh; clears caches and trigger refresh.all
     * @fires  api#refresh.all
     * @return {promise}
     */
    api.refresh = function () {
        api.getReminders().done(function () {
            // trigger local refresh
            api.trigger('refresh.all');
        });
    };

    ox.on('refresh^', function () {
        api.refresh();
    });

    return api;

});
