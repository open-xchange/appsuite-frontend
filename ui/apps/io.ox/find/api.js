/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define('io.ox/find/api', [
    'io.ox/core/http',
    'io.ox/core/cache',
    'io.ox/core/api/factory',
    'settings!io.ox/contacts',
    'io.ox/core/api/jobs'
], function (http, cache, apiFactory, settings, jobsAPI) {

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
                        module: '',
                        allow_enqueue: 'true'
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
                columns: http.defaultColumns.mail.search,
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
                fields: 'color,createdBy,endDate,flags,folder,id,location,recurrenceId,seriesId,startDate,summary,timestamp',
                extendFields: 'io.ox/calendar/api/fields'
            }
        },
        simpleCache = new cache.SimpleCache('find/autocomplete');

    function getColumns(options) {
        var module = options.params.module,
            data = columns[module],
            params = {};
        if (data.extendColumns && data.columns) params.columns = apiFactory.extendColumns(data.extendColumns, module, data.columns);
        if (data.extendFields && data.fields) params.fields = apiFactory.extendColumns(data.extendFields, module, data.fields);
        return { params: params };
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

    api.config = function (options) {
        var opt = $.extend(true, {}, getDefault('autocomplete'), options);
        opt.data.options.check = false;
        // console.log('config');
        // console.log(JSON.stringify(opt.data.facets));
        return api.autocomplete(opt);
    };

    /**
     * get available facets
     * @param  {object}     options
     * @return { deferred}   returns list of sorted facets/values
     */
    api.autocomplete = function (options) {
        var opt = $.extend(true, {}, getDefault('autocomplete'), options),
            key = api.cid(opt);

        // addStaticFacets(opt);

        return simpleCache.get(key).then(function (data) {
            // use cache
            if (data !== null) return data;
            // console.log('autocomplete');
            // console.log(JSON.stringify(opt.data.facets));
            // call server
            return http[opt.method](opt)
                    .then(simpleCache.add.bind(this, key));
        });
    };

    api.resetCache = function () {
        simpleCache.clear();
    };

    /**
     * query search result
     * @param  {object}     options
     * @return { deferred}   returns results
     */
    api.query = function (options) {
        var opt = $.extend(true, {}, getDefault('query'), getColumns(options), options),
            def = $.Deferred();
        // console.log('query');
        // console.log(JSON.stringify(opt.data.facets));

        // uncomment this when you need to test long running jobs
        // opt.data.size = 100000;

        http[opt.method](opt).then(function (data) {
            if (data && data.job) {
                // long running job. Add to jobs list and return here
                //#. %1$s: Folder name
                jobsAPI.addJob({
                    id: data.job,
                    showIn: 'find',
                    successCallback: def.resolve,
                    failCallback: def.reject
                });
                return;
            }
            def.resolve(data);
        }, function (error) {
            def.reject(error);
        });

        return def;
    };

    return api;
});
