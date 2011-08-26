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

define("io.ox/core/event", ["io.ox/core/util"], function () {

    return {

        Dispatcher: (function () {
            
            var guid = 1;
            
            var trim = function (type) {
                // events should be string and lower case
                return (type + "").toLowerCase().replace(/(^\s+|\s+$)/g, "");
            };
            
            var trimSplit = function (type) {
                type = trim(type);
                // split?
                return type.search(/\s/) > -1 ? type.split(/\s+/) : type;
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
                
                /**
                 * Bind event
                 * @param {string} type Event name
                 * @param {Object} [data] Bound data
                 * @param {function (data, type)} fn Event handler
                 */
                this.bind = function (type, data, fn) {
                    
                    // trim
                    type = trimSplit(type);
                    
                    // multiple types?
                    if ($.isArray(type)) {
                        $.each(type, function (i, type) {
                            self.bind(type, data, fn);
                        });
                        return;
                    }
                    
                    // param shift?
                    if (ox.util.isFunction(data)) {
                        fn = data;
                        data = undefined;
                    }
                    
                    // new queue?
                    if (self.handlers[type] === undefined) {
                        self.handlers[type] = {};
                    }
                    
                    var h = self.handlers[type];
                    
                    // add guid
                    if (fn.oxGuid === undefined) {
                        fn.oxGuid = guid++;
                    }
                    
                    // add event once
                    if (h[fn.oxGuid] === undefined) {
                        // add
                        h[fn.oxGuid] = {
                            fn: fn,
                            data: data
                        };
                        // heuristic
                        self.has = true;
                    }
                };
                
                /**
                 * Unbind event
                 * @param {string} type Event name
                 * @param {function ()} fn Event handler
                 */
                this.unbind = function (type, fn) {
                    
                    // trim
                    type = trimSplit(type);
                    
                    // multiple types?
                    if ($.isArray(trim)) {
                        $.each(type, function (i, type) {
                            self.unbind(type, fn);
                        });
                        return;
                    }
                    
                    // get handlers
                    var h = self.handlers[type] || {};
                    
                    // prevent IE from throwing unnecessary errors
                    try {
                        // remove listener
                        delete h[fn.oxGuid];
                    } catch (e) {
                        // nothing
                    }
                };
                
                /**
                 * Trigger event
                 * @param {string} type Event name
                 * @param {Object} [data] Event data
                 */
                this.trigger = function (type, data) {
                    
                    var id = "", h = null;
                    
                    if (self.has === false || self.enabled === false) {
                        return;
                    }
                    
                    // trim
                    type = trimSplit(type);
                    
                    // multiple types?
                    if ($.isArray(type)) {
                        $.each(type, function (i, type) {
                            self.trigger(type, data);
                        });
                        return;
                    }
                    
                    // call handler
                    function call(handler) {
                        // merge data?
                        var d = handler.data ? $.extend({}, handler.data, data || {}) : data;
                        // execute function
                        try {
                            handler.fn.call(target, d, type);
                        } catch (e) {
                            try {
                                // and IE might even fail here
                                if (window.debug) {
                                    // catching exceptions here
                                    // might be tricky for debugging, but
                                    // IE tends to get stuck with sub windows
                                    // which is even harder to find out
                                    console.error("Dispatcher.call() " + e);
                                }
                            } catch (e) {
                                // pssst - if u come around here, IE's console doesn't work
                                console.error("Event.Dispatcher", e);
                            }
                        }
                    }
                    
                    // get handlers
                    h = self.handlers[trim(type)] || {};
                    // loop
                    for (id in h) {
                        call(h[id]);
                    }
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
});