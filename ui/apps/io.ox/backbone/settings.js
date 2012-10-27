/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */
define("io.ox/backbone/settings", ["io.ox/backbone/basicModel"], function (BasicModel) {
    "use strict";
    
    
    var cache = {};
    
    return {
        get: function (ref, options) {
            if (cache[ref]) {
                return cache[ref];
            }
            
            var settings = require("settings!" + ref);
            
            var ModelClass = BasicModel.extend(_.extend({
                ref: ref,
                syncer: {
                    update: function () {
                        settings.save();
                        return $.when();
                    },
                    create: function () {
                        settings.save();
                        return $.when();
                    },
                    destroy: function () {
                        // Don't do anything
                    },
                    read: function () {
                        var def = $.Deferred();
                        settings.load({noCache: true})
                            .done(function () {
                                return def.resolve(settings.all());
                            });
                        return def;
                    }
                }
            }, options));
            
            return cache[ref] = settings.createModel(ModelClass);
        }
    };
});