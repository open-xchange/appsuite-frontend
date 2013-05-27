/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/api/resource',
    ['io.ox/core/http', 'io.ox/core/api/factory'], function (http, apiFactory) {

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