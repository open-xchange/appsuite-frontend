/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/core/updates/updater', [
    'io.ox/core/extensions',
    'settings!io.ox/core/updates'
], function (ext, settings) {

    'use strict';

    return {
        runUpdates: function () {
            var def = $.Deferred();
            var updateTasks = ext.point('io.ox/core/updates').list();
            var states = settings.get('states');

            if (_.isUndefined(states)) {
                // Skip this round
                return $.when();
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
