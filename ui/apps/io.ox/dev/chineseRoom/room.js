/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define('io.ox/dev/chineseRoom/room', ['io.ox/realtime/groups', 'io.ox/core/event'], function (groups, Events) {
    'use strict';

    function ChineseRoom(roomName) {
        var self = this;
        this.group = groups.getGroup("synthetic.china://" + roomName);
        this.collection = new Backbone.Collection();
        Events.extend(this);

        this.join = function () {
            this.group.join();
        };

        this.leave = function () {
            this.group.leave();
        };

        this.destroy = function () {
            this.group.destroy();
            delete rooms[roomName];
        };

        this.say = function (text) {
            return this.group.send({
                element: "message",
                payloads: [
                    {
                        element: "action",
                        data: "say"
                    },
                    {
                        element: "message",
                        namespace: "china",
                        data: text
                    }
                ]
            });
        };

        this.sayAndTrace = function (text) {
            return this.group.send({
                trace: true,
                element: "message",
                payloads: [
                    {
                        element: "action",
                        data: "say"
                    },
                    {
                        element: "message",
                        namespace: "china",
                        data: text
                    }
                ]
            });
        };

        this.requestLog = function (text) {
            return this.group.send({
                element: "message",
                payloads: [
                    {
                        element: "action",
                        data: "getLog"
                    }
                ]
            });
        };

        this.group.on("receive", function (e, m) {
            if (false && m.log) {
                console.log("-------------------------");
                _(m.log).each(function (entry) {
                    console.log(entry);
                });
                console.log("-------------------------");
            }
            var message = m.get("china", "message");

            if (message) {
                console.log(m.from, message.data);
                self.trigger("received", {from: m.from, message: message.data});

            }

            if (m.get("china", "replay")) {
                _(m.getAll("china", "replay")).each(function (m) {
                    console.log(m.data.sender, m.data.message);
                });
            }
        });

        this.group.on("offline", function () {
            console.log("Offline!");
        });

        this.group.on("online", function () {
            console.log("Online!");
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