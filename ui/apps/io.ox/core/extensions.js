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

/**
 * @namespace
 * @name ox.api.extensions
 */
define("io.ox/core/extensions", function () {

    // A naive extension registry. 
    
    var ExtensionPoint = function (options) {
        this.id = options.id;
        this.description = options.description;
        var extensions = [];
        ox.api.event.Dispatcher.extend(this);
        
        this.register = function (extension) {
            extensions.push(extension);
            this.trigger("register", this);
            return this;
        };
        
        this.all = function () {
            return extensions;
        };
        
        this.each = function(cb) {
            return $.each(extensions, cb);
        };

        this.map = function(cb) {
            return $.map(extensions, cb);
        };
        
        this.execute = function(name, context) {
            var args = Array.prototype.slice.call(arguments, 2)
            return this.map(function (extension) {
                var toExecute = name ? extension[name] : extension;
                if (!context) {
                    context = extension;
                }
                return toExecute.call(context, extension);
            });
        };
        
        this.dump = function () {
            console.log(this, extensions);
        }
    }
    
    var Registry = function () {
        var extensionPoints = {};
        
        this.point = function (id) {
            if (id instanceof ExtensionPoint) {
                return id;
            }
            var point = extensionPoints[id];
            if (point) {
                return point;
            }
            return extensionPoints[id] = new ExtensionPoint({id: id});
        };
        
        this.dump = function () {
            console.log(extensionPoints);
        };
    };
    
    return ox.api.extensions = {
        registry: new Registry()
    };
});