/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
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

define('io.ox/dev/chineseRoom/room', [
    'io.ox/realtime/groups',
    'io.ox/core/event'
], function (groups, Events) {

    'use strict';

    function ChineseRoom(roomName) {
        var self = this;
        this.group = groups.getGroup('synthetic.china://' + roomName);
        this.collection = new Backbone.Collection();
        Events.extend(this);

        this.join = function (options) {
            return this.group.join(options);
        };

        this.leave = function (options) {
            return this.group.leave(options);
        };

        this.destroy = function () {
            this.group.destroy();
            delete rooms[roomName];
        };

        this.say = function (text) {
            return this.group.send({
                element: 'message',
                payloads: [
                    {
                        element: 'action',
                        data: 'say'
                    },
                    {
                        element: 'message',
                        namespace: 'china',
                        data: text
                    }
                ]
            });
        };

        this.sayAndTrace = function (text, tracer) {
            return this.group.send({
                tracer: tracer,
                element: 'message',
                payloads: [
                    {
                        element: 'action',
                        data: 'say'
                    },
                    {
                        element: 'message',
                        namespace: 'china',
                        data: text
                    }
                ]
            });
        };

        this.requestLog = function () {
            return this.group.send({
                element: 'message',
                payloads: [
                    {
                        element: 'action',
                        data: 'getLog'
                    }
                ]
            });
        };

        this.requestLogByQuery = function () {
            return this.group.query({
                element: 'message',
                payloads: [
                    {
                        element: 'action',
                        data: 'getLog'
                    }
                ]
            });
        };

        this.group.on('receive', function (e, m) {
            if (false && m.log) {
                console.log('-------------------------');
                _(m.log).each(function (entry) {
                    console.log(entry);
                });
                console.log('-------------------------');
            }
            var message = m.get('china', 'message');

            if (message) {
                console.log(m.from, message.data);
                self.trigger('received', { from: m.from, message: message.data });

            }

            if (m.get('china', 'replay')) {
                _(m.getAll('china', 'replay')).each(function (m) {
                    console.log(m.data.sender, m.data.message);
                });
            }
        });

        this.group.on('offline', function () {
            console.log('Offline!');
        });

        this.group.on('online', function () {
            console.log('Online!');
        });

        this.group.on('reset', function () {
            console.log('Reset!');
        });

        this.group.on('error:notMember', function () {
            console.log('Not a member!');
        });

    }

    var rooms = {};

    return {
        getRoom: function (name) {
            if (rooms[name]) {
                return rooms[name];
            }
            rooms[name] = new ChineseRoom(name);
            return rooms[name];
        }
    };
});
