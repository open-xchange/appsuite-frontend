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
                    //query
                    prefix: '',
                    activeFacets: []
                }
            },
            config: {
                module: 'find',
                method: 'GET',
                params: {
                    action: 'config'
                }
            },
            query: {
                module: 'find',
                method: 'PUT',
                params: {
                    module: 'mail',
                    action: 'query'
                },
                data: {
                    queries: [],
                    filters: [],
                    start: 0,
                    size: 10
                }
            }
        },
    });

    //TODO: real caching please
    var stat;

    //get default options
    function getDefault(key) {
        return api.options.requests[key];
    }

    /**
     * request dynamic facets
     * @param  {object}     options
     * @param  {array}      options.facets
     * @return {deferred}   returns data
     */
    function dynamicfacets(options) {
        var opt = $.extend(true, {}, getDefault('autocomplete'), options);

        return http[opt.method](opt).then(function (data) {
                return data.data || data;
            });
    }

    /**
     * get static facets
     * @param  {object} options
     * @return {object}
     */
    function staticfacets(options) {
        var opt = $.extend(true, {}, getDefault('config'), options || {});
        //remove module param that is only be used for dynamic facets request
        delete opt.params.module;

        //TODO: use real caching
        if (!!stat)
            return $.Deferred().resolve(stat[options.params.module]);

        //TODO: handle changed facets (e.g. target folder is removed)
        return http[opt.method](opt).then(function (data) {
                stat = stat || {};
                _.each(data, function (item) {
                    stat[item.module] = item;
                });
                return stat[options.params.module];
            });
    }

    /**
     * reduce/join/order static and facet results
     * @param  {object} dyn
     * @param  {object} stat
     * @return {object}
     */
    function reduce(dyn, stat) {
        var data = {
                list: []
            },
            hash = {},
            tmp = $.extend({}, dyn, stat);

        data.module = tmp.module;

        /**
         * compact values array
         * @param  {[type]} list [description]
         * @return {[type]}      [description]
         */
        function compact(list, facetid) {
            var data = [];
            _.each(list, function (val) {
                data.push({
                    id: val.id,
                    facet: facetid,
                    label: val.displayItem.defaultValue,
                    account: val.displayItem.isDefaultAccount || false,
                    filter: val.filter,
                    mandatorydefault: !!hash[val.id]
                });
            });
            return data;
        }

        //reference to default value for mandatory facets
        _.each(tmp.mandatoryFilters, function (group) {
            hash[group.facet] = group.defaultValue.id;
        });

        //normalise 'dynamic'
        _.each(tmp.facets, function (group) {
            data.list.push({
                id: group.type,
                name: group.displayName,
                type: 'dynamic',
                values: compact(group.values, group.type)
            });
        });

        //normalise 'static' and 'query'
        _.each(tmp.staticFacets, function (group) {
            var values = group.values || [],
                type = (values[0] || {}).filter.queries[0] === 'override' ? 'query' : 'static',
                position = type === 'query' ? 0 : data.list.length,
                item = {
                    id: group.type,
                    name: group.displayName,
                    type: type,
                    values: compact(group.values, group.type)
                };
            //reference default value for mandatory facets
            if (!!hash[item.id])
                item.mandatorydefault = hash[item.id];

            //query added to head, static to tail
            data.list.splice(position, 0, item);
        });

        return data;
    }

    /**
     * get available facets
     * @param  {object}     options
     * @return {deferred}   returns list of sorted facets/values
     */
    api.autocomplete = function (options) {
        return $.when.apply($, [
            dynamicfacets(options),
            staticfacets(options)
        ])
        .then(function (dyn, stat) {
            // join/sort/reduce
            return reduce(dyn, stat);
        });
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
