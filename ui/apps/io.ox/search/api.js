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

define('io.ox/search/api',
    ['io.ox/core/http',
     'io.ox/core/cache',
     'io.ox/core/api/factory',
    ], function (http, cache, apiFactory) {

    'use strict';

    var api = apiFactory({
        id: 'search',
        module: 'find',
        requests: {
            autocomplete: {
                module: 'find',
                method: 'PUT',
                params: {
                    action: 'autocomplete',
                    module: ''
                },
                data: {
                    prefix: '',
                    facets: []
                }
            },
            query: {
                module: 'find',
                method: 'PUT',
                params: {
                    action: 'query',
                    module: ''
                },
                data: {
                    facets: [],
                    start: 0,
                    size: 10
                }
            }
        }
    });

    //get default options
    function getDefault(key) {
        return _.copy(api.options.requests[key], true);
    }

    /**
     * get available facets
     * @param  {object}     options
     * @return {deferred}   returns list of sorted facets/values
     */
    api.autocomplete = function (options) {
        var opt = $.extend(true, {}, getDefault('autocomplete'), options);
        return http[opt.method](opt);
    };

    /**
     * query search result
     * @param  {object}     options
     * @return {deferred}   returns results
     */
    api.query = function (options) {
        var opt = $.extend(true, {}, getDefault('query'), options);
        return http[opt.method](opt);
    };

    return api;
});
