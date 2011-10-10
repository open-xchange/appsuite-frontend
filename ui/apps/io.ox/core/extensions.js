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
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define("io.ox/core/extensions", ["io.ox/core/event"], function (event) {

    // A naive extension registry.
    
    // global registry
    var registry = {},
    
        // module
        that,
        
        // sort by index
        pointSorter = function (a, b) {
            return (a.index || 1000000000) - (b.index || 1000000000);
        },
        
        // for debugging purposes
        randomSorter = function () {
            return Math.random() > 0.5 ? -1 : +1;
        },
        
        // function wrappers
        wrappers = {};
    
    var Point = function (options) {
        
        this.id = String(options.id);
        this.description = options.description || "";
        
        var extensions = [],
            replacements = {},
            disabled = {},
            // get enabled extensions
            list = function () {
                return _(extensions)
                    .chain()
                    .select(function (obj) {
                        return !disabled[obj.id];
                    });
            },
            self = this;
            
        event.Dispatcher.extend(this);
        
        function createInvoke(point, ext) {
            return function (name, context, args) {
                if (!_.isArray(args)) {
                    args = [args];
                }
                var fn = ext[name];
                if (fn) {
                    // wrap?
                    if (wrappers[name]) {
                        return wrappers[name].call(context, {
                            args: args,
                            extension: ext,
                            original: function () {
                                return fn.apply(context, args);
                            },
                            id: point.id + "/" + ext.id,
                            module: that,
                            point: point
                        });
                    } else {
                        return fn.apply(context, args);
                    }
                }
            };
        }
        
        this.extend = function (extension) {
            if (extension.invoke) {
                throw "Extensions must not have their own invoke method";
            }
            if (!extension.id) {
                throw "Extensions must have an id!";
            }
            
            extension.invoke = createInvoke(this, extension);
            
            if (replacements[extension.id]) {
                _.extend(extension, replacements[extension.id]);
                delete replacements[extension.id];
            }
            
            extensions.push(extension);
            extensions.sort(pointSorter);
            
            this.trigger("extended", extension);
            
            return this;
        };
        
        this.replace = function (extension) {
            
            if (!extension.id) {
                throw "Replacements must have an id!";
            }
            
            var replaced = false;
            
            _(extensions).map(function (e) {
                if (e.id === extension.id) {
                    _.extend(e, extension);
                    replaced = true;
                }
            });
            
            if (replaced) {
                extensions.sort(pointSorter);
            } else {
                replacements[extension.id] = extension;
            }
            
            return this;
        };
        
        this.all = function () {
            return extensions;
        };
        
        this.keys = function () {
            return _(extensions).map(function (obj) {
                    return obj.id;
                });
        };
        
        // public for testing purposes
        this.sort = function () {
            extensions.sort(pointSorter);
            return this;
        };
        
        this.each = function (cb) {
            list().each(cb);
            return this;
        };
        
        this.map = function (cb) {
            list().map(cb);
            return this;
        };
        
        this.invoke = function (name, context, args) {
            if (!_.isArray(args)) {
                args = [args];
            }
            return list().invoke("invoke", name, context, args);
        };
        
        this.disable = function (id) {
            disabled[id] = true;
            return this;
        };
        
        this.enable = function (id) {
            delete disabled[id];
            return this;
        };
    };
        
    that = {
        
        // get point
        point: function (id) {
        
            if (registry[id] !== undefined) {
                return registry[id];
            } else {
                return (registry[id] = new Point({ id: id }));
            }
        },
        
        // get all ids
        keys: function () {
            return _.keys(registry);
        },
        
        // extension loader
        load: function () {
            // get proper list
            var ext = ox.serverConfig.extensions || {},
                list = (ox.signin ? ext.signin : ext.core) || [];
            // transform to proper urls
            list = _(list).map(function (i) {
                return "extensions/" + i + "/register";
            });
            // load extensions
            return require(list);
        },
        
        // add wrapper
        addWrapper: function (name, fn) {
            wrappers[name] = fn;
        }
    };
    
    return that;
});

/*

Examples
--------

// Disable participants
var ext = require("io.ox/core/extensions");
ext.point("io.ox/calendar/detail").disable("participants");

// Disable date
var ext = require("io.ox/core/extensions");
ext.point("io.ox/calendar/detail").disable("date");

// Extend "draw" function (to introduce "customize")
var ext = require("io.ox/core/extensions");
ext.addWrapper("draw", function (e) {
    e.original();
    ext.point(e.id).invoke("customize", this, e.args);
});

// use new "customize" function
var ext = require("io.ox/core/extensions");
ext.point("io.ox/calendar/detail/date/time").extend({
    customize: function () {
        this.css("background", "#fc0");
    }
});

// Replace existing extension
var ext = require("io.ox/core/extensions");
ext.point("io.ox/calendar/detail").replace({
    id: "title",
    draw: function () {
        this.append(
            $("<div>").addClass("title").text("Hello World!")
        );
    }
});

// Shuffle extension order
var ext = require("io.ox/core/extensions");
ext.point("io.ox/calendar/detail").each(function (e) {
    e.index = Math.random() * 1000 >> 0;
}).sort();

*/
