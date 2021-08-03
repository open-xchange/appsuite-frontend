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

define('io.ox/settings/personalData/api', [
    'io.ox/core/event',
    'io.ox/core/http'
], function (Events, http) {

    'use strict';

    // super simple cache to save available modules config, you really only need to get this data once. Not likely to ever change
    var cache = {};

    var api = {
        downloadFile: function (id, packageNumber) {
            return require(['io.ox/core/download']).then(function (download) {
                download[_.device('ios') ? 'window' : 'url'](
                    ox.apiRoot + '/gdpr/dataexport/' + id + '?' + $.param({ id: id, number: packageNumber, session: ox.session })
                );
            });
        },

        getAvailableDownloads: function () {
            return http.GET({
                url: 'api/gdpr/dataexport'
            });
        },

        cancelDownloadRequest: function () {
            return http.DELETE({
                url: 'api/gdpr/dataexport'
            }).then(function (result) {
                api.trigger('updateStatus');
                return result;
            }, function (error) {
                // no export there or already finished. Update views, accordingly
                if (error.code === 'GDPR-EXPORT-0009') api.trigger('updateStatus');
                return error;
            });
        },

        // deleteOldDataExport removes files from previously requested downloads. Careful here. Can cause data loss
        requestDownload: function (data, deleteOldDataExport) {
            return http.POST({
                url: 'api/gdpr/dataexport',
                data: JSON.stringify(data),
                contentType: 'application/json',
                params: {
                    deleteOldDataExport: deleteOldDataExport
                }
            }).then(function (result) {
                api.trigger('updateStatus');
                return result;
            });
        },

        getAvailableModules: function () {
            if (cache.availableModules) $.Deferred().resolve(cache.availableModules);
            return http.GET({
                url: 'api/gdpr/dataexport/availableModules'
            }).then(function (data) {
                cache.availableModules = data;
                return data;
            });
        },

        deleteAllFiles: function () {
            return http.DELETE({
                url: 'api/gdpr/dataexport/delete'
            }).then(function (result) {
                api.trigger('updateStatus');
                return result;
            });
        }
    };
    Events.extend(api);

    ox.on('refresh^', function () {
        // just trigger updatestatus on refresh, the views will update themselves then if needed
        api.trigger('updateStatus');
    });

    return api;
});
