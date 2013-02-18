/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2013
 * Mail: info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

define('io.ox/core/api/import',
    ['io.ox/core/http'], function (http) {

    'use strict';

    var api = {};

    function import_file_call(data) {
        if ('FormData' in window) {
            var formData = new FormData();
            formData.append('file', data.file);

            return http.UPLOAD({
                module: 'import',
                params: { action: data.type, folder: data.folder },
                data: formData,
                fixPost: true
            });
        } else {
            return http.FORM({form: data.form, data: data, url: 'import?action=' + data.type});
        }
    }

    /**
     * import data from file
     *
     * @param data {Object} -
     * {type: "ICAL",
     *  folder: "32",
     *  file: [file object],
     *  form: jQuery object containing the form
     * }
     *
     * @return - a deferred object, containing the response of the import call
     */
    api.import_file = function (data) {
        var def = $.Deferred();

        import_file_call(data).done(function (res) {
            if (res.data[0].error) {
                def.reject(res.data[0]);
            } else {
                def.resolve(res.data[0]);
            }
        }).fail(function (res) {
            def.reject(res);
        });
        return def;
    };

    return api;
});
