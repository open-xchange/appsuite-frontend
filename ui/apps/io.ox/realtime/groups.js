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
    var counter = 0;
    function RealtimeGroup(id) {
        var self = this, heartbeat = null, selector = "rt-group-" + counter;
        counter++;
        rt.on("receive:" + selector, function (e, m) {
            self.trigger("receive", m);
        });
        rt.on("error", function (e) {
            self.trigger("error");
        });
        rt.on("open", function (e) {
            self.trigger("apiOpen");
        });

        this.id = id;

        this.join = function (options) {
            if (!heartbeat) {
                heartbeat = setInterval(function () {
                    rt.sendWithoutSequence({
                        element: "message",
                        to: id,
                        payloads: [
                            {
                                element: "ping",
                                namespace: "group",
                                data: 1
                            }
                        ]
                    });
                }, 60000);
            }
            options = options || {};
            this.send({
                element: "message",
                trace: options.trace,
                selector: selector,
                payloads: [
                    {
                        element: "command",
                        namespace: "group",
                        data: "join"
                    }
                ]
            });
        };

        this.leave = function (options) {
            if (!heartbeat) {
                return;
            }
            options = options || {};
            clearInterval(heartbeat);
            heartbeat = null;
            this.send({
                element: "message",
                trace: options.trace,
                payloads: [
                    {
                        element: "command",
                        namespace: "group",
                        data: "leave"
                    }
                ]
            });
        };

        this.sendWithoutSequence = function (message) {
            message.to = id;
            return rt.sendWithoutSequence(message);
        };

        this.send = function (message) {
            message.to = id;
            return rt.send(message);
        };

        this.destroy = function () {
            if (heartbeat) {
                this.leave();
            }
            rt.off("receive:" + selector);
            delete groups[id];
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