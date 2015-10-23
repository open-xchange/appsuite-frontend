/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
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
                params: { action: data.type, folder: data.folder, ignoreUIDs: data.ignoreUIDs },
                data: formData,
                fixPost: true
            });
        }
        return http.FORM({
            module: 'import',
            action: data.type,
            form: data.form,
            params: { folder: data.folder, ignoreUIDs: data.ignoreUIDs }
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
        var def = $.Deferred();
        importFileCall(data).then(function (res) {
            //hint: undefined is usually a filtered warning message
            var data = res.data || [res],
                failcount =  _.reduce(res.data, function (count, item) {
                    return count + item && item.error ? 1 : 0;
                }, 0);

            //import of all entries failed
            if (failcount === data.length) {
                def.reject(data);
            } else {
                def.resolve(data);
            }
        }).fail(function (res) {
            //ensure array
            data = res.data || [res];
            def.reject(data);
        });
        return def;
    };

    return api;
});
