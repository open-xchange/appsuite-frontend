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
 * @author Tobias Prinz <tobias.prinz@open-xchange.com>
 *
 */

define('io.ox/rss/api', ['io.ox/core/http'], function (http) {

    'use strict';

    var api = {
        get: function (feedUrl) {
            return http.GET({
                module: 'rss',
                params: {
                    feedUrl: feedUrl
                }
            });
        },
        getMany: function (urls, params) {
            params = params || {};
            var defaults = {
                sort: 'date',
                order: 'desc',
                //not supported yet: manually spliced in plugins/portal/rss/register
                limit: 100
            };
            return http.PUT({
                module: 'rss',
                params: $.extend({}, defaults, params),
                data: {
                    feedUrl: urls
                }
            });
        }
    };

    return api;
});
