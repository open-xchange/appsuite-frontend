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
 * 
 * A module with which you can register for events as transmitted via the RT system. It provides the customary
 * on(eventName, callback), off(eventName, callback), once(eventName, callback) methods. To see which
 * events are available, you can check in the console with events.protectedMethods.backend.events().done(function (supported) { console.log(supported);});
 * Use this only, if the 'rt' capability is present.
 */

define('io.ox/realtime/events', ['io.ox/realtime/rt', 'io.ox/core/http'], function (rt, http) {
	'use strict';


	var internal = {
		backend: {
			on: function (eventName, selector, resource) {
				return http.GET({
					module: 'events',
					params: {
						action: 'on',
						event: eventName,
						selector: selector,
						resource: resource
					}
				});
			},
			off: function (eventName, resource) {
				return http.GET({
					module: 'events',
					params: {
						action: 'off',
						event: eventName,
						resource: resource
					}
				});
			},
			all: function () {
				return http.GET({module: 'events', params: {action: 'all'}});
			},
			events: function () {
				if (internal.backend.cachedEvents) {
					return internal.backend.cachedEvents;
				}

				internal.backend.cachedEvents = http.GET({module: 'events', params: {action: 'events'}});
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
					console.warn("Backend doesn't support event " + eventName);
					return;
				}

				if (!events[eventName]) {

					var selector = "events" + nextId++;

					rt.on("receive:" + selector, function (e, m) {
						// Unpack Event
						var data = m.get("event", "data").data;
						var eventName = m.get("event", "name").data;
						// Dispatch locally
						_(events[eventName].callbacks).each(function (cb) {
							cb(data, eventName);
						});
					});

					internal.backend.on(eventName, selector, rt.resource);
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
				internal.backend.off(eventName, rt.resource);
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

	module.protectedMethods = internal;

	return module;

});