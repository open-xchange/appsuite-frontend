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
 *
 * A module with which you can register for events as transmitted via the RT system. It provides the customary
 * on(eventName, callback), off(eventName, callback), once(eventName, callback) methods. To see which
 * events are available, you can check in the console with events.protectedMethods.backend.events().done(function (supported) { console.log(supported);});
 * Use this only, if the 'rt' capability is present.
 */

define('io.ox/realtime/events',
    [
        'io.ox/realtime/rt',
        'io.ox/realtime/tab_id',
        'io.ox/core/http'
    ],
function (rt, tabId, http) {
    'use strict';

    var internal = {
        backend: {
            on: function (eventName, selector) {
                return http.GET({
                    module: 'events',
                    params: {
                        action: 'on',
                        event: eventName,
                        selector: selector,
                        resource: tabId,
                        protocol: rt.protocol
                    }
                });
            },
            off: function (eventName) {
                return http.GET({
                    module: 'events',
                    params: {
                        action: 'off',
                        event: eventName,
                        resource: tabId,
                        protocol: rt.protocol
                    }
                });
            },
            all: function () {
                return http.GET({ module: 'events', params: { action: 'all', resource: tabId, protocol: rt.protocol } });
            },
            events: function () {
                if (internal.backend.cachedEvents) {
                    return internal.backend.cachedEvents;
                }

                internal.backend.cachedEvents = http.GET({ module: 'events', params: { action: 'events' } });
                return internal.backend.cachedEvents;
            }
        }
    };

    var events = {};
    var selectors = {};
    var nextId = 0;

    var module = {
        on: function (eventName, cb) {
            internal.backend.events().done(function (eventNames) {
                if (!_(eventNames).contains(eventName)) {
                    console.warn('Backend doesn\'t support event ' + eventName);
                    return;
                }

                if (!events[eventName]) {

                    var selector = 'events' + nextId++;

                    rt.on('receive:' + selector, function (e, m) {
                        // Unpack Event
                        var data = m.get('event', 'data').data;
                        var eventName = m.get('event', 'name').data;
                        // Dispatch locally
                        _(events[eventName].callbacks).each(function (cb) {
                            cb(data, eventName);
                        });
                    });

                    internal.backend.on(eventName, selector);
                    events[eventName] = {
                        selector: selector,
                        callbacks: [cb]
                    };

                    selectors[selector] = eventName;
                } else {
                    events[eventName].callbacks.push(cb);
                }
            });
        },

        off: function (eventName, cb) {
            if (!events[eventName]) {
                return;
            }
            var registration = events[eventName];

            registration.callbacks = _(registration.callbacks).without(cb);
            if (_.isEmptry(registration.callbacks)) {
                delete events[eventName];
                delete selectors[registration.selector];
                internal.backend.off(eventName);
            }
        },

        once: function (event, cb) {
            function wrap() {
                cb.apply($.makeArray(arguments));
                module.off(event, wrap);
            }
            module.on(event, wrap);
        }
    };

    rt.on('reset', function () {
        _(events).chain().keys().each(function (eventName) {
            var entry = events[eventName];
            internal.backend.on(eventName, entry.selector);
        });
    });

    module.protectedMethods = internal;

    return module;

});
