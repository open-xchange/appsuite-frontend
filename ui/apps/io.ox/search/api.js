/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/search/api', [
    'io.ox/core/http',
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
                        // max. number of values for each facet;
                        // serverside default/fallback is 10
                        limit: 6
                    },
                    data: {
                        prefix: '',
                        options: {
                            timezone: 'UTC'
                        },
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
                        options: {
                            timezone: 'UTC'
                        },
                        start: 0,
                        size: 100
                    }
                }
            }
        }),
        columns = {
            mail: {
                columns: '102,600,601,602,603,604,605,606,607,608,610,611,614,652,654,655,661',
                extendColumns: 'io.ox/mail/api/list'
            },
            files: {
                columns: '20,23,1,5,700,702,703,704,705,707,3',
                extendColumns: 'io.ox/files/api/list'
            },
            tasks: {
                columns: '1,20,101,200,202,203,220,300,301,309',
                extendColumns: 'io.ox/tasks/api/list'
            },
            contacts: {
                columns: '20,1,101,500,501,502,505,520,524,555,556,557,569,592,602,606,607,5',
                extendColumns: 'io.ox/contacts/api/list'
            },
            calendar: {
                columns: '1,20,101,206,207,201,200,202,400,401,402,221,224,227,2,209,212,213,214,215,222,216,220',
                extendColumns: 'io.ox/calendar/api/list'
            }
        },
        simpleCache = new cache.SimpleCache('search-find');

    function getColumns(options) {
        var module = options.params.module,
            data = _.extend(columns[module]);
        // merge columnlist strings (see bug #38853)
        if (options.params.loadercolumns) {
            var standard = data.columns.split(','),
                custom = options.params.loadercolumns.split(',');
            delete options.params.loadercolumns;
            data.columns = _.union(standard, custom).join(',');
        }
        return {
            params: {
                columns: apiFactory.extendColumns(data.extendColumns, module, data.columns)
            }
        };
    }

    // get default options
    function getDefault(key) {
        var obj = _.copy(api.options.requests[key], true);
        // filter admin contacts
        _.extend(obj.data.options, { admin: settings.get('showAdmin', false) });
        return obj;
    }

    api.cid = function (request) {
        return JSON.stringify(request);
    };

    /**
     * get available facets
     * @param  {object}     options
     * @return { deferred}   returns list of sorted facets/values
     */
    api.autocomplete = function (options) {
        var opt = $.extend(true, {}, getDefault('autocomplete'), options),
            key = api.cid(opt);

        return simpleCache.get(key).then(function (data) {

            // use cache
            if (data !== null) {
                return data;
            }

            // debug
            // if (debug) {
            //     console.log('%c' + 'autocomplete', 'color: white; background-color: green');
            //     _.each(opt.data.facets, function (facet) {
            //         console.log(facet.facet, facet.value);
            //     });
            // }
            // call server
            return http[opt.method](opt)
                .then(simpleCache.add.bind(this, key));
        });
    };

    /**
     * query search result
     * @param  {object}     options
     * @return { deferred}   returns results
     */
    api.query = function (options) {
        // in case options.params.loadercolumns is defined it will be used by getColumns() and removeed from params object
        var opt = $.extend(true, {}, getDefault('query'), getColumns(options), options);
        // debug
        // if (debug) {
        //     console.log('%c' + 'query', 'color: white; background-color: blue');
        //     _.each(opt.data.facets, function (facet) {
        //         console.log(facet.facet, facet.value);
        //     });
        // }
        return http[opt.method](opt);
    };

    return api;
});
