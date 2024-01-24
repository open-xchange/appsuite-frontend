/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
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

define('io.ox/core/event', function () {

    'use strict';

    // for internal parameter shifting
    var shift = function (data, fn, context) {
        var o = !fn ? { data: {}, fn: data } : { data: data, fn: fn };
        o.fn = context ? $.proxy(o.fn, context) : o.fn;
        return o;
    };

    /**
     * Event Hub. Based on jQuery's on, off, one, and trigger.
     * Differences: 1. trigger allows multiple types separated by spaces.
     * 2. trigger actually calls triggerHandler since we are not in the DOM.
     * 3. Hub provides explicit destroy to clean up.
     */
    var Events = function (context) {

        var hub = $({});

        // attach listener
        this.on = function (type, data, fn) {
            var o = shift(data, fn, context);
            hub.on(type, o.data, o.fn);
            return this;
        };

        // detach listener
        this.off = function (type, fn) {
            hub.off(type, fn);
            return this;
        };

        // attach listener for a single execution
        this.one = function (type, data, fn) {
            var o = shift(data, fn, context);
            hub.one(type, o.data, o.fn);
            return this;
        };

        // trigger event
        this.trigger = function () {

            var args = $.makeArray(arguments),
                types = args.shift(),
                // Keep reference in case a handler cleans up the event dispatcher
                myHub = hub;

            function trigger(type) {

                // trigger single event
                myHub.triggerHandler(type, args);

                // trigger generic 'triggered' event (convert event object to event name before)
                if (_.isObject(type)) { type = type.type; }
                // Allow stringing event hubs together
                myHub.triggerHandler('triggered', _([type, args]).flatten(true));
            }

            if (_.isString(types)) {
                // "types" may contain multiple space-separated event types
                _(types.split(/\s+/)).each(trigger);
            } else if (_.isObject(types) && _.isString(types.type)) {
                // support to trigger with an explicit Event or $.Event object
                trigger(types);
            }
            return this;
        };

        // destroy event hub
        this.destroy = function () {
            if (!hub) {
                // Called twice?
                return;
            }
            hub.off();
            if (context) {
                try {
                    // remove shortcuts
                    delete context.events;
                    delete context.on;
                    delete context.off;
                    delete context.one;
                    delete context.trigger;
                } catch (e) {
                    if (ox.debug) console.error(e);
                }
            }
            hub = context = null;
            this.on = this.off = this.one = this.trigger = null;
        };

        this.list = function () {
            return $._data(hub.get(0), 'events');
        };
    };

    /**
     * Static method: extend. Allows integrating the event hub in any object
     */
    Events.extend = function (obj) {
        // create new event hub
        obj = obj || {};
        obj.events = new Events(obj);
        // add on, off, and trigger
        obj.on = obj.events.on;
        obj.off = obj.events.off;
        obj.one = obj.events.one;
        obj.trigger = obj.events.trigger;
        return obj;
    };

    return Events;
});
