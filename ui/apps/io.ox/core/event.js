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

    var shift = function (data, fn, context) {
        var o = !fn ? { data: {}, fn: data } : { data: data, fn: fn };
        o.fn = context ? $.proxy(o.fn, context) : o.fn;
        return o;
    };

    var Events = function (context) {

        var hub = $({});

        this.on = function (type, data, fn) {
            var o = shift(data, fn, context);
            hub.on(type, o.data, o.fn);
        };

        this.off = function (type, fn) {
            hub.off(type, fn);
        };

        this.one = function (type, data, fn) {
            var o = shift(data, fn, context);
            hub.one(type, o.data, o.fn);
        };

        this.trigger = function () {
            var args = $.makeArray(arguments), types = args.shift();
            _(types.split(/\s+/)).each(function (type) {
                hub.triggerHandler.call(hub, type, args);
            });
        };

        this.destroy = function () {
            hub.off();
            hub = context = null;
            this.on = this.off = this.one = this.trigger = $.noop;
        };
    };

    Events.extend = function (obj) {
        // create new event hub
        obj = obj || {};
        obj.events = new Events(obj);
        // add on, off, and trigger
        obj.on = obj.events.on;
        obj.off = obj.events.off;
        obj.trigger = obj.events.trigger;
        return obj;
    };

    // add global dispatcher
    Events.extend(ox);

    return Events;
});