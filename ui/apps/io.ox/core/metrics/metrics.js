/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
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
            ox.on('login core:load core:ready app:start app:ready app:resume app:stop', function (e, data) {
                var t = that.formatTimestamp(that.getTime());
                console.log('Event', e.type, t, data);
            });
        },

        store: {

            toFile: (function () {

                // posix-style open
                function open(folder, filename) {

                    return api.getAll({ folder: folder }).then(function (list) {
                        // look for a file with proper title
                        var match = _(list).find(function (item) {
                            return item.title === filename;
                        });
                        if (match) {
                            // just fetch if exists
                            return api.get(api.reduce(match));
                        } else {
                            // create new file
                            return create(folder, filename).then(function (id) {
                                return api.get({ folder_id: folder, id: id });
                            });
                        }
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
                        return api.update({
                            folder_id: file.folder_id,
                            id: file.id,
                            description: (file.description || '') + '\n' + line
                        });
                    });
                };

            }())
        }
    };

    return that;

});
