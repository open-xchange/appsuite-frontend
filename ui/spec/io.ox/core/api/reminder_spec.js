/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define([
    'io.ox/core/api/reminder'
], function (api) {

    var reminderData = [{
        alarm: _.now() - 1200000, //20 minutes ago,
        folder: 567,
        id: 1,
        last_modified: 1414139255970,
        module: 4, //task
        recurrence_position: 0,
        server_time: 1414141690384,
        target_id: 123,
        user_id: 1337
    }, {
        alarm: _.now() - 600000, //10 minutes ago
        folder: 567,
        id: 2,
        last_modified: 1414139219614,
        module: 1, //calendar
        recurrence_position: 0,
        server_time: 1414141690387,
        target_id: 124,
        user_id: 1337
    }, {
        alarm: _.now() + 600000, //in 10 minutes
        folder: 567,
        id: 3,
        last_modified: 1414139219614,
        module: 1, //calendar
        recurrence_position: 0,
        server_time: 1414141690387,
        target_id: 125,
        user_id: 1337
    }];

    describe('reminder api', function () {
        beforeEach(function () {
            this.server.respondWith('GET', /api\/reminder\?action=range/, function (xhr) {
                xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, '{"timestamp":1368791630910,"data": ' + JSON.stringify(reminderData) + '}');
            });
        });
        describe('should', function () {
            it('trigger correct events', function () {
                var defTaskEvent = $.Deferred(),
                    defCalendarEvent = $.Deferred(),
                    taskEventListener = function () {
                        defTaskEvent.resolve();
                    },
                    calendarEventListener = function () {
                        defCalendarEvent.resolve();
                    };

                api.one('set:calendar:reminder', calendarEventListener);
                api.one('set:tasks:reminder', taskEventListener);
                api.getReminders();
                return $.when(defTaskEvent, defCalendarEvent);
            });
            it('return correct data', function () {
                var defTaskEvent = $.Deferred(),
                    defCalendarEvent = $.Deferred(),
                    taskEventListener = function (e, tasks) {
                        expect(tasks).to.have.length(1);
                        expect(tasks[0].id).to.equal(1);
                        expect(tasks[0].module).to.equal(4);
                        if (tasks.length === 1 && tasks[0].id === 1 && tasks[0].module === 4) {
                            defTaskEvent.resolve();
                        }
                    },
                    calendarEventListener = function (e, appointments) {
                        expect(appointments).to.have.length(1);
                        expect(appointments[0].id).to.equal(2);
                        expect(appointments[0].module).to.equal(1);
                        if (appointments.length === 1 && appointments[0].id === 2 && appointments[0].module === 1) {
                            defCalendarEvent.resolve();
                        }
                    };
                api.one('set:calendar:reminder', calendarEventListener);
                api.one('set:tasks:reminder', taskEventListener);
                api.getReminders();
                return $.when(defTaskEvent, defCalendarEvent);
            });
        });
    });
});
