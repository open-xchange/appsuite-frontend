/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/search/api',
    ['io.ox/core/http',
     'io.ox/core/cache',
     'io.ox/core/api/factory',
     'settings!io.ox/contacts'
    ], function (http, cache, apiFactory, settings) {

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
                    module: '',
                    //max. number of values for each facet
                    limit: 3
                },
                data: {
                    prefix: '',
                    options: {},
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
                    options: {},
                    start: 0,
                    size: 100
                }
            }
        }
    });

    //get default options
    function getDefault(key) {
        var  obj = _.copy(api.options.requests[key], true);
        //filter admin contacts
        _.extend(obj.data.options, {admin: settings.get('showAdmin', false)});
        return obj;
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
