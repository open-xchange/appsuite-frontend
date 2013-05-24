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
        var self = this, heartbeat = null, selector = "rt-group-" + counter, destroyed = false;
        counter++;
        rt.on("receive:" + selector, function (e, m) {
            self.trigger("receive", m);
        });

        function relayEvent(name) {
            return function () {
                self.trigger(name);
            };
        }

        var relayOfflineEvent = relayEvent("offline");
        var relayOnlineEvent = relayEvent("online");
        var relayResetEvent = relayEvent("reset");
        var relayHighLoadEvent = relayEvent("highLoad");

        rt.on("offline", relayOfflineEvent);
        rt.on("online", relayOnlineEvent);
        rt.on("reset", relayResetEvent);
        rt.on("highLoad", relayHighLoadEvent);

        this.id = id;

        function checkState() {
            if (destroyed) {
                throw new Error("This group has already been destroyed");
            }
        }

        this.join = function (options) {
            checkState();
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
            var stanza = {
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
            };

            if (options.expectWelcomeMessage) {
                return this.query(stanza);
            } else {
                this.send(stanza);
            }
        };

        this.leave = function (options) {
            checkState();
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
            checkState();
            message.to = id;
            return rt.sendWithoutSequence(message);
        };

        this.send = function (message) {
            checkState();
            message.to = id;
            return rt.send(message);
        };

        this.query = function (message) {
            checkState();
            message.to = id;
            return rt.query(message);
        };

        this.destroy = function () {
            checkState();
            if (heartbeat) {
                this.leave();
            }
            rt.off("receive:" + selector);
            rt.off("offline", relayOfflineEvent);
            rt.off("online", relayOnlineEvent);
            rt.off("reset", relayResetEvent);
            rt.off("highLoad", relayHighLoadEvent);
            delete groups[id];
            destroyed = true;
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