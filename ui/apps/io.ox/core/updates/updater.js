/**
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
 */

define('io.ox/core/updates/updater', ['io.ox/core/extensions', 'settings!io.ox/core/updates'], function (ext, settings) {
    'use strict';
    return {
        runUpdates: function () {
            var def = $.Deferred();
            var updateTasks = ext.point('io.ox/core/updates').list();
            var states = settings.get('states');
            
            if (_.isUndefined(states)) {
                return $.when(); // Skip this round
            }

            function next() {
                if (updateTasks.length) {
                    try {
                        var ut = updateTasks.shift();

                        // Has this UT already run?
                        var lastState = states[ut.id];
                        if (lastState && lastState === 'success') {
                            next();
                            return;
                        }
                        ((ut.run || $.noop)() || $.when()).done(function () {
                            states[ut.id] = 'success';
                        }).fail(function () {
                            states[ut.id] = 'failure';
                        }).always(next);
                    } catch (e) {
                        console.error(e, e.stack);
                        def.reject();
                    }
                    
                } else {
                    def.resolve();
                }
            }

            next();
            return def.always(function () {
                settings.set('states', states);
                settings.save();
            });
        }
    };
    
});