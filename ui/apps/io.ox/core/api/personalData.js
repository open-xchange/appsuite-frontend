/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/core/api/personalData', [
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
            });
        },

        requestDownload: function (data) {
            return http.POST({
                url: 'api/gdpr/dataexport',
                data: JSON.stringify(data),
                contentType: 'application/json'
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
            api.requestFinished = false;
            return http.DELETE({
                url: 'api/gdpr/dataexport/delete'
            });
        },
        requestFinished: false
    };
    Events.extend(api);

    return api;
});
