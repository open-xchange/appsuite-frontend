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
        return (a.index || 1000000000 ) - (b.index || 1000000000);
    };
    
    var Point = function (options) {
        
        this.id = options.id;
        this.description = options.description;
        
        var extensions = [];
        
        this.extend = function (extension) {
            extensions.push(extension);
            extensions.sort(pointSorter);
            return this;
        };
        
        this.all = function () {
            return extensions;
        };
        
        this.each = function (cb) {
            return _.each(extensions, cb);
        };
        
        this.map = function(cb) {
            return _.map(extensions, cb);
        };
    };
    
    // global registry
    var registry = {},
        
        // get point
        point = function (id) {
        
            if (registry[id] !== undefined) {
                return registry[id];
            } else {
                return (registry[id] = new Point({ id: id }));
            }
        },
        
        // extension loader
        load = function () {
            // get proper list
            var ext = ox.serverConfig.extensions || {},
                list = (ox.signin ? ext.signin : ext.core) || [];
            // transform to proper urls
            list = _(list).map(function (i) { return "extensions/" + i + "/register"; });
            // load extensions
            return require(list);
        };
    
    return {
        point: point,
        load: load
    };
});