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

define('io.ox/realtime/groups',
    ['io.ox/realtime/rt',
     'io.ox/core/event'
    ], function (rt, Event) {

    'use strict';

    var counter = 0;

    function RealtimeGroup(id) {
        var self = this, heartbeat = null, selector = 'rt-group-' + counter, destroyed = false, pendingDeferreds = [];
        counter++;
        rt.on('receive:' + selector, function (e, m) {
            self.trigger('receive', m);
        });

        function relayEvent(name) {
            return function () {
                self.trigger(name);
            };
        }

        function capture(deferred) {
            var def = $.Deferred();
            if (!deferred) {
                return;
            }
            deferred.done(def.resolve).fail(def.reject);
            pendingDeferreds.push(def);
            def.always(function () {
                pendingDeferreds = _(pendingDeferreds).without(def);
            });
            return def;
        }

        var relayOfflineEvent = relayEvent('offline'),
            relayOnlineEvent = relayEvent('online'),
            relayResetEvent = relayEvent('reset'),
            relayHighLoadEvent = relayEvent('highLoad');

        rt.on('offline', relayOfflineEvent);
        rt.on('online', relayOnlineEvent);
        rt.on('reset', relayResetEvent);
        rt.on('highLoad', relayHighLoadEvent);

        this.id = id;

        function checkState() {
            if (destroyed) {
                throw new Error('This group has already been destroyed');
            }
        }

        this.join = function (options) {
            checkState();
            if (!heartbeat) {
                heartbeat = setInterval(function () {
                    rt.sendWithoutSequence({
                        element: 'message',
                        to: id,
                        payloads: [
                            {
                                element: 'ping',
                                namespace: 'group',
                                data: 1
                            }
                        ]
                    });
                }, 60000);
            }
            options = options || {};
            var stanza = {
                element: 'message',
                trace: options.trace,
                selector: selector,
                payloads: [
                    {
                        element: 'command',
                        namespace: 'group',
                        data: 'join'
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
                return $.when(); // Already left
            }
            options = options || {};
            clearInterval(heartbeat);
            heartbeat = null;
            var stanza = {
                element: 'message',
                trace: options.trace,
                payloads: [
                    {
                        element: 'command',
                        namespace: 'group',
                        data: 'leave'
                    }
                ]
            };
            if (options.expectSignOffMessage) {
                return this.query(stanza);
            } else {
                this.send(stanza);
            }
        };

        this.sendWithoutSequence = function (message) {
            checkState();
            message.to = id;
            return capture(rt.sendWithoutSequence(message));
        };

        this.send = function (message) {
            checkState();
            message.to = id;
            return capture(rt.send(message));
        };

        this.query = function (message) {
            checkState();
            message.to = id;
            return capture(rt.query(message));
        };

        this.destroy = function () {
            checkState();
            if (heartbeat) {
                this.leave();
            }
            _(pendingDeferreds).invoke('reject');
            rt.off('receive:' + selector);
            rt.off('offline', relayOfflineEvent);
            rt.off('online', relayOnlineEvent);
            rt.off('reset', relayResetEvent);
            rt.off('highLoad', relayHighLoadEvent);
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
