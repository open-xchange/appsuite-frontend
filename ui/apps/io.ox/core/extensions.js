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
 *
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
    
    // disabled extension points
    var disabled = {};
    
    // point collection
    var Collection = function (list) {
        
        var points = list || [];
        
        var bypass = function (name) {
            return function () {
                var args = $.makeArray(arguments), tmp = [];
                _.each(points, function (point) {
                    tmp.concat(point[name].apply(point, args));
                });
                return tmp;
            };
        };
        
        this.extend = bypass("extend");
        this.all = bypass("all");
        this.each = bypass("each");
        this.map = bypass("map");
        
        this.create = function () {
            
            var list = [], tmp = $(), args = $.makeArray(arguments);
            
            // loop over points to gather all relevant extensions
            _.each(points, function (point) {
                if (!disabled[point.id]) {
                    point.each("create", function (extension) {
                        list.push(extension);
                    });
                }
            });
            
            list.sort(pointSorter);
            
            _(list).each(function (extension) {
                // call
                var result = extension.create.apply(extension, args);
                if (result !== null) {
                    tmp = tmp.add(result);
                }
            });
            
            return tmp;
        };
    };
    
    var Point = function (options) {
        
        this.id = options.id;
        this.description = options.description || "";
        
        var extensions = {
            create: [],
            extend: []
        };
        
        this.extend = function (type, extension) {
            
            if (typeof type !== "string") {
                extension = type;
                type = "extend";
            }
            
            var list = (extensions[type] || (extensions[type] = []));
            list.push(extension);
            list.sort(pointSorter);
            
            return this;
        };
        
        this.all = function (type) {
            return extensions[type || "extend"];
        };
        
        this.each = function (type, cb) {
            if (typeof type !== "string") {
                cb = type;
                type = "extend";
            }
            return _.each(disabled[this.id] ? [] : extensions[type || "extend"], cb);
        };
        
        this.map = function (type, cb) {
            if (typeof type !== "string") {
                cb = type;
                type = "extend";
            }
            return _.map(disabled[this.id] ? [] : extensions[type || "extend"], cb);
        };
    };
    
    // global registry
    var registry = {};
        
    return {
        
        // get point
        point: function (id) {
        
            if (registry[id] !== undefined) {
                return new Collection([registry[id]]);
            } else {
                return new Collection([(registry[id] = new Point({ id: id }))]);
            }
        },
        
        // get child points
        children: function (path) {
            
            // ends with slash?
            if (!(/\/$/).test(path)) {
                path += "/";
            }
            
            var len = path.length, list;
            
            // loop over all points that match
            list = _(registry)
                .select(function (obj) {
                    // matches path and has no further slashes?
                    var id = String(obj.id);
                    return id.substr(0, len) === path && id.substr(len).indexOf("/") === -1;
                });
            
            return new Collection(list);
        },
        
        disable: function (id) {
            disabled[id] = true;
        },
        
        enable: function (id) {
            delete disabled[id];
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
// require("io.ox/core/extensions").disable("io.ox/calendar/detail/participants");
// require("io.ox/core/extensions").disable("io.ox/calendar/detail/date");
