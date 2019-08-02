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

    var mockRequestData = {
        calendar: {
            enabled: true,
            includePublic: false,
            includeShared: false,
            subscribedOnly: true
        },
        infostore: {
            enabled: true,
            includePublic: false,
            includeShared: false,
            includeTrash: false,
            includeAllVersions: false
        },
        mail: {
            enabled: true,
            includeTrash: false,
            subscribedOnly: true
        },
        contacts: {
            enabled: true,
            includePublic: false,
            includeShared: false,
            includeDistributionLists: false
        },
        tasks: {
            enabled: true,
            includePublic: false,
            includeShared: false
        },
        maxFileSize: 1073741824
    };

    var api = {
        downloadFile: function (id, packageNumber) {
            return http.GET({
                url: 'api/gdpr/dataexport/' + id,
                params: {
                    id: id,
                    number: packageNumber
                }
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
            data.started = _.now();
            data.status = 'running';
            mockRequestData = data;
            console.log('download requested', data, mockRequestData);
            return http.POST({
                url: 'api/gdpr/dataexport',
                data: data
            });
        },

        getAvailableModules: function () {
            return $.Deferred().resolve(mockRequestData);
            /*return http.get({
                url: 'api/gdpr/dataexport/availableModules,
            });*/
        },

        deleteAllFiles: function () {
            return http.DELETE({
                url: 'api/gdpr/dataexport/delete'
            });
        }
    };

    Events.extend(api);

    return api;
});
