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

define('io.ox/realtime/groups', [
    'io.ox/realtime/rt',
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

        rt.on('error:' + selector, function (e, m) {
            var error = m.get('', 'error');
            if (error.data && error.data.code === 1008) {
                self.trigger('error:notMember');
                clearInterval(heartbeat);
                heartbeat = null;
            } else if (error.data && error.data.code === 1010) {
                self.trigger("error:disposed");
                clearInterval(heartbeat);
                heartbeat = null;
                destroyed = true;
            } else if (error.data && error.data.code === 1012) {
                self.trigger("error:joinFailed", error);
                clearInterval(heartbeat);
                heartbeat = null;
            } else if (error.data && error.data.code === 1013) {
                self.trigger("error:leaveFailed", error);
            } else if (error.data && error.data.code === 1011) {
                self.trigger("error:stanzaProcessingFailed", error);
            }
            self.trigger('error', error);
        });

        function relayEvent(name) {
            return function (event, data) {
                self.trigger(name, data);
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
                                element: 'command',
                                namespace: 'group',
                                data: 'ping'
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
                payloads: _([
                    {
                        element: 'command',
                        namespace: 'group',
                        data: 'join'
                    }
                ]).concat(options.additionalPayloads || [])
            };
            if (rt.debug) {
                console.log('JOIN: ', stanza);
            }
            if (options.expectWelcomeMessage) {
                return this.query(stanza);
            } else {
                this.send(stanza);
            }
        };

        this.leave = function (options) {
            checkState();
            if (!heartbeat) {
                // Already left
                return $.when();
            }
            options = options || {};
            clearInterval(heartbeat);
            heartbeat = null;
            var stanza = {
                element: 'message',
                trace: options.trace,
                payloads: _([
                    {
                        element: 'command',
                        namespace: 'group',
                        data: 'leave'
                    }
                ]).concat(options.additionalPayloads || [])
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
            message.selector = selector;
            return capture(rt.sendWithoutSequence(message));
        };

        this.send = function (message) {
            checkState();
            message.to = id;
            message.selector = selector;
            return capture(rt.send(message));
        };

        this.query = function (message) {
            checkState();
            message.to = id;
            message.selector = selector;
            return capture(rt.query(message));
        };

        this.destroy = function () {
            checkState();
            if (heartbeat) {
                this.leave();
            }
            _(pendingDeferreds).invoke('reject');
            rt.off('receive:' + selector);
            rt.off('error:' + selector);
            rt.off('offline', relayOfflineEvent);
            rt.off('online', relayOnlineEvent);
            rt.off('reset', relayResetEvent);
            rt.off('highLoad', relayHighLoadEvent);
            delete groups[id];
            this.events.destroy();
            destroyed = true;
        };

        this.isRTWorking = function () {
            return (rt.send !== $.noop);
        };

        this.getUuid = function () {
            return rt.resource;
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
