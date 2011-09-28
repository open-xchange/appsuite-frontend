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
    
    var pointSorter = function (a, b) {
            return (a.index || 1000000000) - (b.index || 1000000000);
        },
        // for debugging purposes
        randomSorter = function () {
            return Math.random() > 0.5 ? -1 : +1;
        };
    
    var Point = function (options) {
        
        this.id = options.id;
        this.description = options.description || "";
        
        var extensions = [],
            disabled = {};
        
        event.Dispatcher.extend(this);
        
        this.extend = function (extension) {
            
            extensions.push(extension);
            extensions.sort(pointSorter);
            
            this.trigger("extended", extension);
            
            return this;
        };
        
        this.all = function () {
            return _(extensions).map(function (obj) {
                    return obj.id;
                });
        };
        
        this.each = function (cb) {
            _(extensions)
                .chain()
                .select(function (obj) {
                    return !disabled[obj.id];
                })
                .each(cb);
        };
        
        this.map = function (cb) {
            return _(extensions)
                .chain()
                .select(function (obj) {
                    return !disabled[obj.id];
                })
                .map(cb)
                .value();
        };
        
        this.disable = function (id) {
            disabled[id] = true;
        };
        
        this.enable = function (id) {
            delete disabled[id];
        };
    };
    
    // global registry
    var registry = {};
        
    return {
        
        // get point
        point: function (id) {
        
            if (registry[id] !== undefined) {
                return registry[id];
            } else {
                return (registry[id] = new Point({ id: id }));
            }
        },
        
        // get all points
        all: function () {
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
        }
    };
});

// test examples:
// require("io.ox/core/extensions").point("io.ox/calendar/detail").disable("participants");
// require("io.ox/core/extensions").point("io.ox/calendar/detail").disable("date");
