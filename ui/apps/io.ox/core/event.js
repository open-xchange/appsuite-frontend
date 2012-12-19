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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
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

            var args = $.makeArray(arguments), types = args.shift();
            var myHub = hub; // Keep reference in case a handler cleans up the event dispatcher
            _(types.split(/\s+/)).each(function (type) {
                myHub.triggerHandler.call(hub, type, args);
                myHub.triggerHandler.call(hub, "triggered", _([type, args]).flatten()); // Allow stringing event hubs together
            });
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
                    delete context.trigger;
                } catch (e) { }
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

    // add global event hub
    Events.extend(ox);

    return Events;
});
