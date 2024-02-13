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

define('io.ox/search/apiproxy', [
    'io.ox/core/extensions',
    'gettext!io.ox/core',
    'io.ox/search/api',
    'io.ox/core/notifications'
], function (ext, gt, api, notifications) {

    'use strict';

    // use proxy as managing wrapper for the model matching autocompletes naming conventions
    var init = function (app) {

        /**
         * allows manipulating facet data returned by apis autocomplete action
         */
        var POINT = ext.point('io.ox/search/api/autocomplete');

        POINT.extend({
            id: 'filter',
            index: 100,
            customize: function (baton) {
                baton.data = _.filter(baton.data, function (facet) {
                    return facet.style === 'simple' || ['contacts', 'contact', 'participant', 'task_participants'].indexOf(facet.id) > -1;
                });
            }
        });

        POINT.extend({
            id: 'contact-all-option',
            index: 100,
            customize: function (baton) {
                baton.data = _.each(baton.data, function (facet) {
                    if (['contacts', 'contact', 'participant', 'task_participants'].indexOf(facet.id) < 0) return;
                    // use 'all' option als default (in contrast to 'from' or 'to')
                    _.each(facet.values, function (value) {
                        (value.options || []).reverse();
                    });
                });
            }
        });

        POINT.extend({
            id: 'folder',
            index: 350,
            customize: function (baton) {
                baton.data = baton.data.concat(
                    _.copy(baton.app.view.model.getOptions().sticky, true)
                );
            }
        });

        /**
         * success handler to pass data through extension point
         * @param  {[type]} data [description]
         * @return {deferred} returns available facets
         */
        function extend(args, data) {
            var baton = ext.Baton.ensure({ app: app, data: data.facets, args: args });
            POINT.invoke('customize', this, baton);
            return baton.data;
        }

        /**
         * calls api and pass the response through an extension point
         * @param {object} any number of objects that will be
         * @return {deferred} returns available facets
         * extended into one new options object
         */
        function autocomplete() {
            var args = [{}].concat(Array.prototype.slice.call(arguments)),
                opt = $.extend.apply(undefined, [true].concat(args));
            // call api
            return api.autocomplete(opt).then(extend.bind(this, args));
        }

        /**
         * add static account facet
         * @param {object} request data
         */
        function addAccountFacet(request) {
            var folder = _.findWhere(request.data.facets, { facet: 'folder' }),
                def = $.Deferred();

            if (!folder || !folder.value || !model.isMandatory('account')) return def.resolve();

            // get account_id of current folder for account facet
            require(['io.ox/core/folder/api'], function (folderAPI) {
                folderAPI.get(folder.value)
                    .then(function (data) {
                        request.data.facets.push({
                            facet: 'account',
                            filter: null,
                            value: data.account_id
                        });
                        def.resolve();
                    });
            });
            return def;
        }

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
                        },
                        addAccount = _.partial(addAccountFacet, standard);

                    return model.getFacets()
                            .then(function (facets) {
                                // extend standard options
                                standard.data.facets = facets;
                            })
                            .then(addAccount)
                            .then(function () {
                                // call server
                                return autocomplete(standard, options);
                            })
                            .then(undefined, function (error) {
                                // fallback when app doesn't support search
                                if (error && error.code === 'SVL-0010') {
                                    var app = model.getApp();
                                    // add temporary mapping (default app)
                                    model.defaults.options.mapping[app] = model.defaults.options.defaultApp;
                                    return autocomplete(standard, options, { params: { module: model.getModule() } });
                                }
                                throw error;
                            })
                            .then(function (data) {
                                // match convention in autocomplete tk
                                model.set({ query: query, autocomplete: data }, { silent: true });
                                return { list: data, hits: 0 };

                            }, function (error) {
                                notifications.yell(error);
                                throw error;
                            });
                },
                query: (function () {

                    function filterFacets(opt, view, facets) {
                        // extend options
                        view.trigger('query:running');
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

                    function enrich(opt, result) {
                        // add requst params to result
                        if (result) result.request = opt;
                        return result;
                    }

                    function drawResults(result) {
                        var start = Date.now();
                        if (result) {
                            model.setItems(result, start);
                            app.view.trigger('query:result', result);
                            app.view.model.trigger('query:result', result);
                        }
                        app.view.trigger('query:stop');
                        app.view.model.trigger('query:stop');
                        return result;
                    }

                    function fail(error) {
                        notifications.yell(error);
                        app.view.model.trigger('query:fail');
                        app.view.model.trigger('query:stop');
                        app.view.trigger('query:stop');
                        app.view.trigger('query:fail');
                        throw error;
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
                        app.view.model.trigger('query:start');
                        return model.getFacets()
                            .done(filterFacets.bind(this, opt, app.view))
                            .then(addAccountFacet.bind(this, opt, app.view))
                            .then(getResults.bind(this, opt))
                            .then(enrich.bind(this, opt))
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
