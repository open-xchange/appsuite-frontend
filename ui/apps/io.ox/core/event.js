/**
 *
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
 *
 */

define("io.ox/core/event", function () {

    "use strict";

    var that = {

        Dispatcher: (function () {

            var guid = 1,

                trim = function (type) {
                    // events should be string and lower case
                    return (type + "").toLowerCase().replace(/(^\s+|\s+$)/g, "");
                },

                split = function (type) {
                    type = trim(type);
                    // split?
                    return type.search(/\s/) > -1 ? type.split(/\s+/) : [type];
                };

            /**
             * @name Dispatcher
             * @param {Object} target Target object
             * @class Event Dispatcher
             */
            var Dispatcher = function (target) {

                this.handlers = {};
                this.data = {};
                this.has = false;

                this.enabled = true;

                // make robust for lazy mixins
                var self = this;

                // never leak
                $(window).bind("unload", function () {
                    self.data = self.handlers = null;
                });

                /**
                 * Bind event
                 * @param {string} type Event name
                 * @param {Object} [data] Bound data
                 * @param {function (data, type)} fn Event handler
                 */
                this.bind = function (type, data, fn) {

                    // parameter shift?
                    if (_.isFunction(data)) {
                        fn = data;
                        data = undefined;
                    }

                    _(split(type)).each(function (t) {

                        // get/create queue
                        var h = self.handlers[t] || (self.handlers[t] = {});

                        fn.oxGuid = fn.oxGuid !== undefined ? fn.oxGuid : String(guid++);

                        // add event once
                        if (h[fn.oxGuid] === undefined) {
                            // add
                            h[fn.oxGuid] = { fn: fn, data: data };
                            // heuristic
                            self.has = true;
                        }
                    });
                };

                /**
                 * Unbind event
                 * @param {string} type Event name
                 * @param {function ()} fn Event handler
                 */
                this.unbind = function (type, fn) {

                    _(split(type)).each(function (t) {

                        var h = self.handlers[t] || {};

                        // prevent IE from throwing unnecessary errors
                        try {
                            // remove listener
                            delete h[fn.oxGuid];
                        } catch (e) { }
                    });
                };

                /**
                 * Trigger event
                 * @param {string} type Event name
                 * @param {Object} [data] Event data
                 */
                this.trigger = function (type, data) {

                    if (self.has === false || self.enabled === false) {
                        return;
                    }

                    // call handler
                    function call(handler, type) {
                        // merge data?
                        var d = handler.data ? $.extend({}, handler.data, data || {}) : data;
                        // execute function
                        try {
                            handler.fn.call(target, d, type);
                        } catch (ex_1) {
                            try {
                                console.error("Dispatcher.trigger(" + type + ") " + ex_1);
                            } catch (ex_2) {
                                // if u come around here, IE's console doesn't work
                                if (ox.debug) {
                                    alert("Dispatcher.trigger(" + type + ") " + ex_1);
                                }
                            }
                        }
                    }

                    _(split(type)).each(function (t) {

                        var h = self.handlers[t] || {}, id = "";

                        for (id in h) {
                            call(h[id], t);
                        }
                    });
                };

                /**
                 * List all event handlers
                 * @param {string} [type] List only events of given type
                 * @returns {Object} Bound handlers
                 */
                this.list = function (type) {
                    return type === undefined ? self.handlers : self.handlers[type];
                };

                /**
                 * Get the number of bound handlers
                 * @return {number} Number of bound handlers
                 */
                this.numHandlers = function () {
                    var i = 0, id = "";
                    for (id in self.handlers) {
                        i++;
                    }
                    return i;
                };

                /**
                 * Disable dispatcher
                 */
                this.disable = function () {
                    self.enabled = false;
                };

                /**
                 * Enable dispatcher
                 */
                this.enable = function () {
                    self.enabled = true;
                };

            };

            Dispatcher.extend = function (obj) {
                // create new dispatcher
                obj.dispatcher = new Dispatcher(obj);
                // add bind, unbind, and trigger
                obj.bind = obj.dispatcher.bind;
                obj.unbind = obj.dispatcher.unbind;
                obj.trigger = obj.dispatcher.trigger;
                return obj;
            };

            return Dispatcher;

        }())
    };

    // add global dispatcher
    that.Dispatcher.extend(ox);

    return that;
});