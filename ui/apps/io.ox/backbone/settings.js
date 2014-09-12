/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */
define('io.ox/backbone/settings', ['io.ox/backbone/basicModel'], function (BasicModel) {

    'use strict';

    var cache = {};

    return {
        get: function (ref, options) {
            if (cache[ref]) {
                return cache[ref];
            }

            var settings = require('settings!' + ref);

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
                        settings.load({ noCache: true })
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
