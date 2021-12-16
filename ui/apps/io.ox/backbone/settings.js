/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
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

define('io.ox/backbone/settings', ['io.ox/backbone/basicModel'], function (BasicModel) {

    'use strict';

    if (ox.debug) console.warn('io.ox/backbone/settings is deprecated with 7.8.1.');

    var cache = {};

    return {
        get: function (ref, options) {

            if (cache[ref]) return cache[ref];

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
                        return settings.load({ noCache: true }).then(function () {
                            return settings.all();
                        });
                    }
                }
            }, options));

            cache[ref] = settings.createModel(ModelClass);

            return cache[ref];
        }
    };
});
