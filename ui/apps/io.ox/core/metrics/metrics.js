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

define('io.ox/core/metrics/metrics', ['io.ox/files/api', 'io.ox/core/http'], function (api, http) {

    'use strict';

    var that = {

        // get time since t0
        getTime: function () {
            return _.now() - ox.t0;
        },

        toSeconds: function (ms) {
            return Number(ms / 1000).toFixed(2);
        },

        // format milliseconds, e.g. 0.75s
        formatTimestamp: function (ms) {
            return this.toSeconds(ms) + 's';
        },

        getBrowser: function () {
            var b = _.browser;
            if (b.Chrome) return 'Chrome ' + b.Chrome;
            if (b.Firefox) return 'Firefox ' + b.Firefox;
            if (b.Safari) return 'Safari ' + b.Safari;
            if (b.IE) return 'IE ' + b.IE;
            return 'Unknown';
        },

        // listen to some demo events and generate console output
        debug: function () {
            ox.on('login core:load core:ready app:start app:ready app:resume app:stop', function (data) {
                var t = that.formatTimestamp(that.getTime());
                console.log('Event', t, data);
            });
        },

        store: {

            toFile: (function () {

                // posix-style open
                function open(folder, filename) {

                    return api.getAll(folder).then(function (list) {
                        // look for a file with proper title
                        var match = _(list).find(function (item) {
                            return item.title === filename;
                        });
                        if (match) {
                            // just fetch if exists
                            return api.get({ id: match.id, folder: match.folder_id });
                        }
                        // create new file
                        return create(folder, filename).then(function (id) {
                            return api.get({ folder_id: folder, id: id });
                        });
                    });
                }

                function create(folder, filename) {
                    return http.PUT({
                        module: 'files',
                        params: { action: 'new' },
                        data: { folder_id: folder, title: filename },
                        appendColumns: false
                    });
                }

                return function (folder, prefix, line) {

                    if (!line) return $.when();

                    // fetch all files in a folder to find proper file
                    // if not existent, create new file
                    var d = new Date(),
                        year = d.getUTCFullYear(),
                        month = _.pad(d.getUTCMonth() + 1, 2),
                        filename = prefix + '_' + year + '_' + month;

                    return open(folder, filename).then(function (file) {
                        // append to description and save changes
                        return api.update(
                            { folder_id: file.folder_id, id: file.id },
                            { description: (file.description || '') + '\n' + line }
                        );
                    });
                };

            }())
        }
    };

    return that;

});
