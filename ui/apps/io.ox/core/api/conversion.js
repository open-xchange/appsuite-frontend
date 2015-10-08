/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <tobias.prinz@open-xchange.com>
 */

define('io.ox/core/api/conversion', [
    'io.ox/core/api/factory',
    'io.ox/core/http'
], function (apiFactory, http) {

    'use strict';

    var api = apiFactory({
        module: 'convert',
        requests: {
            get: {
                action: 'get'
            }
        }
    });

    /**
     * @param  {object} dataSource
     * @param  {object} dataHandler
     * @return { deferred} done returns data object
     */
    api.convert = function (dataSource, dataHandler) {
        return http.PUT({
            module: 'conversion',
            params: {
                action: 'convert'
            },
            data: {
                'datasource': dataSource,
                'datahandler': dataHandler
            }
        });
    };

    return api;
});
