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

    var columns = {
        mail: {
            columns: '102,600,601,602,603,604,605,607,608,610,611,614,652',
            extendColumns: 'io.ox/mail/api/list'
        },
        files: {
            columns: '20,23,1,5,700,702,703,704,707,3',
            extendColumns: 'io.ox/files/api/list'
        },
        tasks: {
            columns: '1,20,101,200,202,203,220,300,301,309',
            extendColumns: 'io.ox/tasks/api/list',
        },
        contacts: {
            columns: '20,1,101,500,501,502,505,520,524,555,556,557,569,592,602,606,607,5',
            extendColumns: 'io.ox/contacts/api/list'
        },
        calendar: {
            columns: '1,20,101,206,207,201,200,202,400,401,402,221,224,227,2,209,212,213,214,215,222,216,220',
            extendColumns: 'io.ox/calendar/api/list'
        }
    };

    function getColumns (options) {
        var module = options.params.module,
            data = columns[module],
            obj = {
                params: {
                    columns: apiFactory.extendColumns(data.extendColumns, module, data.columns)
                }
            };
        //filter admin contacts
        return obj;
    }

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
        return http[opt.method](opt)
                .then(function (data) {
                    _.each(data.facets, function (facet) {
                        //TODO: remove when backend is ready
                        if (['time', 'folder_type', 'type', 'date', 'status', 'file_type', 'file_size', 'contact_type', 'task_status', 'task_type'].indexOf(facet.id) > -1 ) {
                            facet.options = facet.values;
                            delete facet.values;
                        }

                        //preparation to handle type3 facets
                        if (!facet.values && facet.options) {
                            facet.values = [];
                            facet.flags = (facet.flags || []).concat('type3');
                            _.each(facet.options, function (option) {
                                var value = _.extend({}, option, {options: facet.options});
                                delete value.filter;
                                facet.values.push(value);
                            });
                        }
                    });
                    return data;
                });
    };

    /**
     * query search result
     * @param  {object}     options
     * @return {deferred}   returns results
     */
    api.query = function (options) {
        var opt = $.extend(true, {}, getDefault('query'), getColumns(options), options);
        return http[opt.method](opt);
    };

    return api;
});
