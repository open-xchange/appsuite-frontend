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
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/core/api/export',
    ['io.ox/core/http',
     'io.ox/core/api/factory'
    ], function (http, apiFactory) {

    'use strict';

    // generate basic API
    var api = apiFactory({
        module: 'export',
        requests: {
            get: {
                action: 'get'
            }
        }
    });

    /**
     * requesting server data and generalizes server response
     * @private
     * @param  {string} type (target format)
     * @param  {string} id of folder whose contents should be exported
     * @param  {boolean} simulate return only request url (optional)
     * @param  {string} columns as comma separated list (optional, only if type is 'csv')
     * @return {deferred}
     */
    var get = function (type, folder, simulate, columns) {
        var def = $.Deferred(),
            params = {
                action: type,
                folder: _.isString(folder) ? folder : folder.id || ''
            };
        if (columns) {
            params.columns = columns;
        }
        http.GET({
            simulate: !!simulate,
            module: 'export',
            params: params,
            dataType: 'text'
        })
        .done(function (data) {
            // only error messages will be returned as json
            try {
                //qualified server error
                data = $.parseJSON(data);
                def.reject(data);
            } catch (e) {
                // [csv|ical|vcard] string
                def.resolve(data);
            }
        })
        .fail(function (data) {
            //http error
            def.reject(data);
        });
        return def;
    };

    /**
     * done: returns csv string; fail: returns error object
     * @param  {string} id of folder (contacts) whose contents should be exported
     * @param  {boolean} simulate return only request url (optional)
     * @param  {string} columns as comma separated list (optional)
     * @return {deferred}
     */
    api.getCSV = function (folder, simulate, columns) {
        return get('CSV', folder, simulate, columns);
    };

    /**
     * done: returns ical string; fail: returns error object
     * @param  {string} id of folder (calendar or tasks) whose contents should be exported
     * @param  {boolean} simulate return only request url (optional)
     * @return {deferred}
     */
    api.getICAL = function (folder, simulate) {
        return get('ICAL', folder, simulate);
    };

    /**
     * done: returns vcard string; fail: returns error object
     * @param  {string} id of folder (contacts) whose contents should be exported
     * @param  {boolean} simulate return only request url (optional)
     * @return {deferred}
     */
    api.getVCARD = function (folder, simulate) {
        return get('VCARD', folder, simulate);
    };

    return api;
});
