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

define('io.ox/search/apiproxy',
    ['io.ox/search/api',
     'io.ox/core/notifications'   ], function (api, notifications) {

    'use strict';

    // use proxy as managing wrapper for the model matching autocompletes naming conventions
    var init = function (app) {

        var model = app.getModel(),
            proxy = {
                // alias for autocomplete tk
                search: function (query, options) {
                var standard = {
                    params: {
                        module: model.getModule()
                    },
                    data: {
                        prefix: query
                    }
                };

                return model.getFacets()
                        .then(function (facets) {
                            // extend standard options
                            standard.data.facets = facets;
                        })
                        .then(function () {
                            // call server
                            return api.autocomplete($.extend({}, standard, options));
                        })
                        .then(undefined, function (error) {
                            // fallback when app doesn't support search
                            if (error.code === 'SVL-0010') {
                                var app = model.getApp();
                                // add temporary mapping (default app)
                                model.defaults.options.mapping[app] = model.defaults.options.defaultApp;
                                return api.autocomplete($.extend(
                                                            standard, options, { params: {module: model.getModule()} }
                                                        ));
                            }
                            return error;
                        })
                        .then(function (obj) {
                            // TODO: remove when backend is ready
                            _.each(obj.facets.values, function (value) {
                                // multifilter facet
                                if (value.options)
                                    value.options = value.options[0];

                            });

                            // match convention in autocomplete tk
                            var data = {
                                list: obj.facets,
                                hits: 0
                            };
                            model.set({
                                query: query,
                                autocomplete: data.list
                            }, {
                                silent: true
                            });
                            return data;
                        }, notifications.yell);
                },
                query: (function () {

                    function filterFacets(opt, facets) {
                        // extend options
                        opt.data.facets = _.filter(facets, function (facet) {
                            // TODO: remove hack to ingore folder facet when empty
                            return !('value' in facet) || (facet.value !== 'custom');
                        });
                    }

                    function getResults(opt) {
                        // TODO: better solution needed
                        var folderOnly = !opt.data.facets.length || (opt.data.facets.length === 1 && opt.data.facets[0].facet === 'folder');
                        // call server
                        return folderOnly ? $.Deferred().resolve(undefined) : api.query(opt);
                    }

                    function drawResults(result) {
                        var start = Date.now();
                        if (result) {
                            model.setItems(result, start);
                            app.view.trigger('query:result', result);
                        }
                        app.view.trigger('query:stop');
                        return result;
                    }

                    function fail(result) {
                        notifications.yell(result);
                        app.view.trigger('query:stop');
                        app.view.trigger('query:fail');
                    }

                    return function (sync, params) {
                        var opt = {
                            params: _.extend({ module: model.getModule() }, params),

                            data: {
                                start: model.get('start'),
                                // workaround: more searchresults?
                                size: model.get('size') + model.get('extra')
                            }
                        };
                        app.view.trigger('query:start');
                        return model.getFacets()
                            .done(filterFacets.bind(this, opt))
                            .then(getResults.bind(this, opt))
                            .then(
                                // success
                                sync ? drawResults : _.lfo(drawResults),
                                // fail
                                sync ? fail : _.lfo(fail)
                            );
                    };
                }())
            };
        return proxy;
    };

    return {
        init: init
    };
});
