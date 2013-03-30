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

define('io.ox/realtime/groups', ['io.ox/realtime/rt', 'io.ox/core/event'], function (rt, Event) {
    'use strict';

    function RealtimeGroup(id) {
        var self = this, joined = false, heartbeat = null;
        rt.on("receive:" + id, function (e, m) {
            self.trigger("receive", m);
        });
        this.id = id;

        this.join = function () {
            if (joined) {
                return;
            }
            heartbeat = setInterval(function () {
                self.send({
                    element: "message",
                    payloads: [
                        {
                            element: "ping",
                            namespace: "group",
                            data: 1
                        }
                    ]
                });
            }, 60000);
            joined = true;
            this.send({
                element: "message",
                selector: id,
                payloads: [
                    {
                        element: "command",
                        namespace: "group",
                        data: "join"
                    }
                ]
            });
        };

        this.leave = function () {
            if (!joined) {
                return;
            }
            joined = false;
            clearInterval(heartbeat);
            this.send({
                element: "message",
                payloads: [
                    {
                        element: "command",
                        namespace: "group",
                        data: "leave"
                    }
                ]
            });
        };

        this.send = function (message) {
            message.to = id;
            rt.send(message);
        };

        this.destroy = function () {
            if (joined) {
                this.leave();
            }
            rt.off("receive:" + id);
        };

        Event.extend(this);


    }

    var groups = {};

    return {
        getGroup: function (id) {
            if (groups[id]) {
                return groups[id];
            }

            groups[id] = new RealtimeGroup(id);
            return groups[id];
        }
    };


});