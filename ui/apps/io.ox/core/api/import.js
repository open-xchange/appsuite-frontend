/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

define('io.ox/core/api/import', ['io.ox/core/http'], function (http) {

    'use strict';

    var api = {};

    function importFileCall(data) {
        if ('FormData' in window) {
            var formData = new FormData();
            formData.append('file', data.file);
            return http.UPLOAD({
                module: 'import',
                params: { action: data.type, folder: data.folder, ignoreUIDs: data.ignoreUIDs, allow_enqueue: true },
                data: formData,
                fixPost: true
            });
        }
        return http.FORM({
            module: 'import',
            action: data.type,
            form: data.form,
            params: { folder: data.folder, ignoreUIDs: data.ignoreUIDs, allow_enqueue: true }
        });
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
