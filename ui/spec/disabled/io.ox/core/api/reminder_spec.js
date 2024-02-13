/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
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

    describe('Core reminder api', function () {
        beforeEach(function () {
            this.server.respondWith('GET', /api\/reminder\?action=range/, function (xhr) {
                xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, '{"timestamp":1368791630910,"data": ' + JSON.stringify(reminderData) + '}');
            });
        });
        it('should trigger correct events', function () {
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
        it('should return correct data', function () {
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
