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

/**
 * @namespace
 * @name ox.api.event
 */

define("io.ox/core/event", function () {

    return ox.api.event = {

        /**
         * Register for global event
         * @param {string} name Event name
         * @param {function ()} fn Event handler
         * @example
         * ox.api.event.register(ox.api.event.common.ViewChanged, ox.util.inspect);
         */
        register: function (name, fn) {
            register(name, fn);
        },

        /**
         * Unregister for global event
         * @param {string} name Event name
         * @param {function ()} fn Event handler
         * @example
         * ox.api.event.unregister(ox.api.event.common.ViewChanged, ox.util.inspect);
         */
        unregister: function (name, fn) {
            unregister(name, fn);
        },
        
        /**
         * Trigger an event. First parameter is the event name.
         * Any further parameter is passed to the corresponding event handlers.
         * @param {string} name Event name
         */
        trigger: function (name) {
            triggerEvent.apply(window, arguments);
        },
        
        /**
         * A list of common events used throughout the UI
         * @name ox.api.event.common
         * @namespace
         */
        common: {
            /** @type string */
            ViewChanged: "OX_View_Changed",
            /** @type string */
            Refresh: "OX_Refresh",
            /** @type string */
            ConfigurationLoadedComplete: "OX_Configuration_Loaded_Complete",
            /** @type string */
            ConfigurationChanged: "OX_Configuration_Changed",
            /** @type string */
            LanguageChanged: "LanguageChanged",
            /** @type string */
            Logout: "Logout",
            /** @type string */
            SaveObject: "OX_SAVE_OBJECT",
            /** @type string */
            CancelObject: "OX_Cancel_Object",
            /** @type string */
            NewUnreadMail: "OX_New_Unread_Mail",
            /** @type string */
            Ready: "Ready"
        },
        
        dispatcherRegistry: (function () {
            
            /**
             * @name ox.api.event.DispatcherRegistry
             */
            var DispatcherRegistry = function () {
                
                var dispatchers = [];
                
                this.add = function (dispatcher) {
                    // add?
                    if ($.inArray(dispatcher, dispatchers) === -1) {
                        dispatchers.push(dispatcher);
                    }
                };
                
                this.list = function () {
                    return dispatchers;
                };
            };
            
            // remove ALL handlers on window unload
            var fnUnload = function () {
                // vars
                var i = 0, list, $l, dispatcher, type, h, guid;
                // loop over all dispatchers
                list = ox.api.event.dispatcherRegistry.list();
                // add core window dispatchers as well
                if (isNested()) {
                    // concat
                    list.concat(getCore().ox.api.event.dispatcherRegistry.list());
                }
                for ($l = list.length; i < $l; i++) {
                    dispatcher = list[i];
                    // loop over all handlers
                    for (type in dispatcher.handlers) {
                        h = dispatcher.handlers[type];
                        for (guid in h) {
                            if (h[guid].window === window) {
                                try {
                                    // remove handler
                                    delete h[guid];
                                } catch (e) {
                                }
                            }
                        }
                    }
                }
            };
            
            jQuery(window).unload(fnUnload);
            
            // need this before ox.api is ready, so set local var as well
            return (dispatcherRegistry = new DispatcherRegistry());
            
        }()),
        
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
             * @name ox.api.event.Dispatcher
             * @param {Object} target Target object
             * @class Event Dispatcher
             */
            var Dispatcher = function (target) {
                
                this.handlers = {};
                this.data = {};
                this.has = false;
                
                this.enabled = true;
                this.paused = false;
                this.queue = {};
                
                this.queueTimer = null;
                
                // target is private (to prevent recursion)
                this.getTarget = function () {
                    return target || window;
                };
                
                // add to registry
                dispatcherRegistry.add(this);
            };
            
            // extend
            Dispatcher.prototype = {
                /** @lends ox.api.event.Dispatcher.prototype */
                    
                /**
                 * Bind event
                 * @param {string} type Event name
                 * @param {Object} [data] Bound data
                 * @param {function (data, type)} fn Event handler
                 * @param {window} [win] Current DOM window
                 * @param {boolean} [atomic] React on single events or the last one
                 */
                bind: function (type, data, fn, win, atomic) {
                    
                    // trim
                    type = trimSplit(type);
                    
                    var self = this;
                    
                    // multiple types?
                    if ($.isArray(type)) {
                        $.each(type, function (i, type) {
                            self.bind(type, data, fn);
                        });
                        return;
                    }
                    
                    if (isFunction(data)) {
                        atomic = win;
                        win = fn;
                        fn = data;
                        data = undefined;
                    }
                    
                    // new queue?
                    if (this.handlers[type] === undefined) {
                        this.handlers[type] = {};
                    }
                    
                    var h = this.handlers[type];
                    
                    // add guid
                    if (fn.oxGuid === undefined) {
                        fn.oxGuid = guid++;
                    }
                    
                    // add event once
                    if (h[fn.oxGuid] === undefined) {
                        // add
                        h[fn.oxGuid] = {
                            fn: fn,
                            data: data || {},
                            atomic: atomic !== undefined ? atomic : true,
                            window: win || window 
                        };
                        // heuristic
                        this.has = true;
                    }
                },
                
                /**
                 * Unbind event
                 * @param {string} type Event name
                 * @param {function ()} fn Event handler
                 */
                unbind: function (type, fn) {
                    
                    // trim
                    type = trimSplit(type);
                    
                    // multiple types?
                    if ($.isArray(trim)) {
                        var self = this;
                        $.each(type, function (i, type) {
                            self.unbind(type, fn);
                        });
                        return;
                    }
                    
                    // get handlers
                    var h = this.handlers[type] || {};
                    
                    
                    // prevent IE from throwing unnecessary errors
                    try {
                        // remove listener
                        delete h[fn.oxGuid];
                    } catch (e) {
                    }
                },
                
                /**
                 * Trigger event
                 * @param {string} type Event name
                 * @param {Object} [data] Event data
                 */
                trigger: function (type, data) {
                    
                    if (this.has === false || this.enabled === false) {
                        return;
                    }
                    
                    var self = this, id;
                    
                    // trim
                    type = trimSplit(type);
                    
                    // multiple types?
                    if ($.isArray(type)) {
                        $.each(type, function (i, type) {
                            self.trigger(type, data);
                        });
                        return;
                    }
                    
                    // get handlers
                    var h = this.handlers[trim(type)] || {};
                    // call handler
                    var call = function (handler) {
                        // not defined in closed window?
                        if (handler.window.closed === false) {
                            // get data
                            var d = $.extend({}, handler.data, data || {});
                            // execute function
                            try {
                                handler.fn.call(self.getTarget(), d, type);
                            } catch (e) {
                                try {
                                    // and IE might even fail here
                                    if (window.debug) {
                                        // catching execeptions here
                                        // might be tricky for debugging, but
                                        // IE tends to get stuck with sub windows
                                        // which is even harder to find out
                                        console.error("Dispatcher.call() " + e);
                                    }
                                } catch (e) {
                                    // pssst - if u come around here, IE's console doesn't work
                                }
                            }
                        } else {
                            // remove handler
                            self.unbind(type, handler.fn);
                        }
                    };
                    
                    // process handler
                    var process = function (handler) {
                        if (self.paused === false && handler.atomic === true) {
                            // call
                            call(handler);
                        } else {
                            // enqueue (latest call per type)
                            var guid = handler.fn.oxGuid;
                            // clear?
                            if (self.queue[guid]) {
                                clearTimeout(self.queue[guid]);
                            }
                            // add new timeout
                            self.queue[guid] = setTimeout(function () {
                                // call
                                call(handler);
                            }, 10);
                        }
                    };
                    
                    // loop
                    for (id in h) {
                        process(h[id]);
                    }
                },
                
                /**
                 * List all event handlers
                 * @param {string} [type] List only events of given type
                 * @returns {Object} Bound handlers
                 */
                list: function (type) {
                    return type === undefined ? this.handlers : this.handlers[type];
                },
                
                /**
                 * Get the number of bound handlers
                 * @return {number} Number of bound handlers
                 */
                numHandlers: function () {
                    var i = 0, id;
                    for (id in this.handlers) {
                        i++;
                    }
                    return i;
                },
                
                /**
                 * Disable dispatcher
                 */
                disable: function () {
                    this.enabled = false;
                },

                /**
                 * Enable dispatcher
                 */
                enable: function () {
                    this.enabled = true;
                }
            };
            
            return Dispatcher;
            
        }())
    };
});