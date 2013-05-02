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

define('io.ox/core/api/group',
    ['io.ox/core/http', 'io.ox/core/api/factory'], function (http, apiFactory) {

    'use strict';

    // generate basic API
    var api = apiFactory({
        module: 'group',
        keyGenerator: function (obj) {
            return String(obj.id);
        },
        requests: {
            all: {
                columns: '1,20',
                extendColumns: 'io.ox/core/api/group/all',
                sort: '500', // display_name
                order: 'asc'
            },
            list: {
            },
            get: {
            },
            search: {
                action: 'search',
                columns: '1,20,500,524',
                extendColumns: 'io.ox/core/api/group/search',
                sort: '500',
                order: 'asc',
                getData: function (query) {
                    return { pattern: query };
                }
            }
        }
    });

    /**
     * @param  {string} id
     * @return {deferred} done handler returns name (string)
     */
    api.getName = function (id) {
        return api.get({ id: id }).pipe(function (data) {
            return _.noI18n(data.display_name || data.name || '');
        });
    };

    /**
     * TODO: @deprecated/unused?
     */
    api.getTextNode = function (id) {
        var node = document.createTextNode('');
        api.get({ id: id })
            .done(function (data) {
                node.nodeValue = data.display_name;
            })
            .always(function () {
                _.defer(function () { // use defer! otherwise we return null on cache hit
                    node = null; // don't leak
                });
            });
        return node;
    };

    return api;
});
