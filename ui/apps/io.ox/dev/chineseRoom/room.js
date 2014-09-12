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
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
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
