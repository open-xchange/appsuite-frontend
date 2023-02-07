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

define('io.ox/core/api/import', [
    'io.ox/core/http',
    'io.ox/core/api/jobs'
], function (http, jobsAPI) {

    'use strict';

    var api = {};

    function importFileCall(data) {
        if ('FormData' in window) {
            var formData = new FormData();
            formData.append('file', data.file);
            return jobsAPI.enqueue(http.UPLOAD({
                module: 'import',
                params: { action: data.type, folder: data.folder, ignoreUIDs: data.ignoreUIDs, allow_enqueue: true },
                data: formData,
                fixPost: true
            }), data.longRunningJobCallback);
        }
        return jobsAPI.enqueue(http.FORM({
            module: 'import',
            action: data.type,
            form: data.form,
            params: { folder: data.folder, ignoreUIDs: data.ignoreUIDs, allow_enqueue: true }
        }), data.longRunningJobCallback);
    }

    /**
     * import data from file
     *
     * @param data {Object} -
     * {type: 'ICAL',
     *  folder: '32',
     *  file: [file object],
     *  form: jQuery object containing the form
     * }
     *
     * @return - a deferred object, containing the response of the import call
     */
    api.importFile = function (data) {
        return importFileCall(data).then(
            function success(result) {
                // hint: undefined is usually a filtered warning message
                var job, data = result.data || [result],
                    failcount = _.reduce(result.data, function (count, item) {
                        return count + (item && item.error ? 1 : 0);
                    }, 0);

                // extract jobId it if it's a long running job
                if (result && (result.code === 'JOB-0003' || result.job)) {
                    job = result.job || result.data.job;
                }

                // import of all entries failed
                return failcount === data.length ?
                    $.Deferred().reject(data) :
                    $.Deferred().resolve(data, job);
            }
        );
    };

    return api;
});
