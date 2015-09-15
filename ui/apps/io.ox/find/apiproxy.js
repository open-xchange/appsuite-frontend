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

define('io.ox/find/apiproxy',[
    'io.ox/core/extensions',
    'io.ox/find/api',
    'io.ox/core/notifications',
    'io.ox/find/extensions-api'
], function (ext, api, notifications, extensions) {

    'use strict';

    /**
     * allows adjusting facet data response returned by apis autocomplete action
     */
    var POINT = ext.point('io.ox/find/api/autocomplete');

    //TODO: repair datepicker
    POINT.extend({
        id: 'custom-facet-daterange',
        index: 200,
        customize: extensions.daterange
    });

    POINT.extend({
        id: 'flag',
        index: 300,
        customize: extensions.flag
    });

    POINT.extend({
        id: 'folder',
        index: 350,
        customize: extensions.folder
    });

    POINT.extend({
        id: 'account',
        index: 360,
        customize: extensions.account
    });

    POINT.extend({
        id: 'add-option-disabled',
        index: 400,
        customize: extensions.addOptionDisabled
    });

    var init = function (app) {
        /**
         * success handler to pass data through extension point
         * @param  {[type]} data [description]
         * @return {deferred} returns available facets
         */
        function extend (request, data) {
            var baton = ext.Baton.ensure({
                app: app,
                data: data.facets,
                request: request,
                waitsFor: []
            });
            // customze response
            POINT.invoke('customize', this, baton);
            // wait for possible async operations
            return $.when.apply($, baton.waitsFor)
                    .then(function () {
                        return baton.data;
                    });
        }

        /**
         * calls api and pass the response through an extension point
         * @param {object} any number of objects that will be
         * @return {deferred} returns available facets
         * extended into one new options object
         */
        function autocomplete (request) {
            // create request params
            request.data.facets = model.manager.getRequest();
            request.data.options = request.data.options || {};
            // unused
            // request.data.options.folder = app.get('parent').folder.get();

            // ignore virtual folders
            if (/^virtual/.test(request.data.options.folder) && !app.isMandatory('folder'))
                request.data.options.folder = undefined;

            // call api
            return api.autocomplete(request).then(extend.bind(this, request));
        }

        var model = app.model,
            // managing wrapper to keep model up2date and match tokenfields naming conventions
            proxy = {
                // static facets
                config: function (options) {
                    var standard = {
                            params: { module: app.getModuleParam() },
                            data: {
                                facets: model.manager.getRequest(),
                                prefix: ''
                            }
                        },
                        request = $.extend(true, standard, options || {});
                    return api.config(request).then(extend.bind(this, request));
                },
                // suggestions
                search: function (query) {
                    var standard = {
                            params: { module: app.getModuleParam() },
                            data: { prefix: query }
                        };

                    function updateModel (data) {
                        model.set({
                            query: query
                        });
                        return data;
                    }
                    app.trigger('find:autocomplete:start', query);
                    return autocomplete(standard)
                            .then(updateModel, notifications.yell);
                },
                // result
                query: (function () {

                    function getResults(request) {
                        // TODO: better solution needed
                        var folderOnly = !request.data.facets.length || (request.data.facets.length === 1 && request.data.facets[0].facet === 'folder');
                        // call server
                        return folderOnly ? $.Deferred().resolve(undefined) : api.query(request);
                    }

                    function enrich(request, result) {
                        // add requst params to result
                        if (result) result.request = request;
                        return result;
                    }

                    function drawResults(result) {
                        if (result) {
                            app.trigger('find:query:result', result);
                        }
                        app.trigger('find:query:stop');
                        return result;
                    }

                    function fail(result) {
                        notifications.yell(result);
                        app.trigger('find:query:stop');
                        app.trigger('find:query:fail');
                    }

                    return function (sync, params) {
                        var manager = model.manager,
                            request = {
                                params: _.extend({ module: app.getModuleParam() }, params),
                                data: {
                                    start: model.get('start'),
                                    // workaround: more searchresults?
                                    size: model.get('size') + model.get('extra'),
                                    facets: manager.getRequest()
                                }
                            };
                        app.trigger('find:query:start');
                        app.trigger('find:query:running');

                        return getResults(request)
                            .then(enrich.bind(this, request))
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
