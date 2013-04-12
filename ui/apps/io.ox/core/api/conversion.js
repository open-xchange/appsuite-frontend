/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
 *
 * @author Matthias Biggeleben <tobias.prinz@open-xchange.com>
 */

define('io.ox/core/api/conversion', ['io.ox/core/api/factory', 'io.ox/core/http', 'io.ox/core/cache'], function (apiFactory, http, cache) {

    'use strict';

    var api = apiFactory({
        module: 'convert',
        requests: {
            get: {
                action: 'get'
            }
        }
    });

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