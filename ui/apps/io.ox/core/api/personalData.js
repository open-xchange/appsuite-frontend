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

    // mock data to test UI
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
        },
        mockDownloadData = {
            id: 'EvilMasterPlan1',
            status: 'running',
            creationTime: moment('2019-10-22').valueOf(),
            startTime: moment('2019-10-17').valueOf(),
            duration: moment.duration(5, 'days').valueOf(),
            availableUntil: moment('2020-12-24').valueOf(),
            results: [
                {
                    fileInfo: 'BluePrintsOfSecretVolcanoLair',
                    number: 1,
                    contentType: 'zip',
                    taskId: '1337'
                }
            ],
            workItems: [
                {
                    id: 'TopSecretPlans',
                    module: 'mail',
                    status: 'ready'
                }
            ]
        },
        downloadRequested = false;
    /*eslint-disable no-unreachable */
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
            return downloadRequested ? $.Deferred().resolve(mockDownloadData) : $.Deferred().resolve({ status: 'idle', results: [] });
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
            console.log('download requested', data);
            downloadRequested = true;
            return http.POST({
                url: 'api/gdpr/dataexport',
                data: data
            });
        },

        getAvailableModules: function () {
            return $.Deferred().resolve(mockRequestData);
            return http.get({
                url: 'api/gdpr/dataexport/availableModules'
            });
        },

        deleteAllFiles: function () {
            return http.DELETE({
                url: 'api/gdpr/dataexport/delete'
            });
        }
    };
    /*eslint-enable no-unreachable */
    Events.extend(api);

    return api;
});
