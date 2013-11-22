/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/api/resource',
    ['io.ox/core/http',
     'io.ox/core/api/factory'
    ], function (http, apiFactory) {

    'use strict';

    // generate basic API
    var api = apiFactory({
        module: 'resource',
        keyGenerator: function (obj) {
            return String(obj.id);
        },
        requests: {
            all: {
            },
            list: {
            },
            get: {
            },
            search: {
                action: 'search',
                getData: function (query) {
                    return { pattern: query };
                }
            }
        }
    });

    return api;
});
