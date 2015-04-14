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

define('io.ox/find/main', [
    'settings!io.ox/core',
    'gettext!io.ox/find'
], function (settings, gt) {

    'use strict';

    var INVALID = $.Deferred().reject('please launch app first'),
        cid = function (app) {
            var parts = [
                app.getName(),
                app.get('inplace') ? 'inplace' : 'standalone',
                app.getModule()
            ];
            //toString
            return _.compact(parts).join(':');
        };

    // multi instance pattern
    var createInstance = function (opt) {
        var app;

        opt = _.extend({}, {
            // use 'parent' window
            inplace: true
        }, opt);

        // application object
        app = ox.ui.createApp(
            _.extend({
                name: 'io.ox/find',
                title: gt('Search'),
                state: 'created'
            }, opt)
        );

        // mediator
        app.mediator({
            /*
             * Default application properties
             */
            'props': function (app) {
                app.props = new Backbone.Model();
            },
            'props-mandatory': function (app) {
                // folder facet is mandatory for the follwing apps/modules
                app.props.set('mandatory',
                    settings.get('search/mandatory/folder', []) || []
                );
            },
            'props-default': function (app) {
                app.props.set('default',
                    settings.get('search/default', 'io.ox/mail')
                );
            },
            'props-mapping': function (app) {
                var standard = app.props.get('default-app');
                app.props.set('mapping', {
                    // name mapping
                    'io.ox/mail/compose': 'io.ox/mail',
                    'com.voiceworks/ox-messenger': standard,
                    'io.ox/drive': 'io.ox/files',
                    'io.ox/office/text': 'io.ox/files',
                    'io.ox/office/portal': 'io.ox/files',
                    'io.ox/office/spreadsheet': 'io.ox/files',
                    'io.ox/office/portal/text': 'io.ox/files',
                    'io.ox/office/portal/spreadsheet': 'io.ox/files',
                    'io.ox/portal': standard,
                    'io.ox/settings': standard
                });
            },
            /**
             * general
             */
            'cid': function (app) {
                app.cid = cid(app);
            },

            /**
             * Mode: inplace
             */
            'window-inplace': function  (app) {
                if (!app.get('inplace')) return;

                // use 'parent' window
                app.set('window', app.get('parent').getWindow());
            },

            'reset': function (app) {
                if (!app.get('inplace')) return;
                // reset on folder click
                app.listenTo(app.get('parent'), 'folder:change', app.cancel);
            },

            'vgrid': function (app) {
                if (!app.get('inplace')) return;

                // check for vgrid
                var grid = app.get('parent').grid;
                if (!grid || !grid.addTemplate) return;

                // search: all request
                grid.setAllRequest('search', function () {
                    // result: contains a amount of data somewhere between the usual all and list responses
                    var params = { sort: grid.prop('sort'), order: grid.prop('order') };
                    return app.getSearchResult(params, true)
                        .then(function (response) {
                            var data = response && response.results ? response.results : [];
                            return data;
                        });
                });

                // search: list request
                // forward ids (no explicit all/list request in find/search api)
                grid.setListRequest('search', function (ids) {
                    var args = [ ids ];
                    return $.Deferred().resolveWith(app, args);
                });

                // events
                app.on({
                    'find:query': function () {
                        grid.setMode('search');
                    },
                    'find:idle': function () {
                        if (grid.getMode() !== 'all') grid.setMode('all');
                    }
                });
            },

            'listview': function (app) {

                if (!app.get('inplace')) return;

                app.on('change:state', function (e, state) {

                    if (state !== 'launched') return;
                    // check for listview
                    var parent = app.get('parent');
                    if (!app.get('parent').listView) return;

                    require(['io.ox/core/api/collection-loader'], function (CollectionLoader) {
                        var manager = app.view.model.manager,
                            searchcid = _.bind(manager.getResponseCid, manager),
                            defaultLoader = parent.listView.loader,
                            mode = 'default';
                        // define collection loader for search results
                        var collectionLoader = new CollectionLoader({
                                module: app.getModuleParam(),
                                mode: 'search',
                                fetch: function (params) {
                                    var self = this,
                                        limit = params.limit.split(','),
                                        start = parseInt(limit[0]),
                                        size = parseInt(limit[1]) - start;

                                    app.model.set({
                                        'start': start,
                                        'size': size,
                                        'extra': 1
                                    }, { silent: true });

                                    var params = { sort: app.props.get('sort'), order: app.props.get('order') };
                                    return app.getSearchResult(params, true).then(function (response) {
                                        response = response || {};
                                        var list = response.results || [],
                                            request = response.request || {};
                                        // add 'more results' info to collection (compare request limits and result)
                                        self.collection.search = {
                                            next: list.length !== 0 && list.length === request.data.size
                                        };
                                        return list;
                                    });
                                },
                                cid: searchcid
                            });
                        app.trigger('collectionLoader:created', collectionLoader);
                        var register = function () {
                                var view = app.view.model,
                                    // remember original setCollection
                                    setCollection = parent.listView.setCollection;
                                // hide sort options
                                parent.listControl.$el.find('.grid-options:first').hide();
                                parent.listView.connect(collectionLoader);
                                mode = 'search';
                                // wrap setCollection
                                parent.listView.setCollection = function (collection) {
                                    view.stopListening();
                                    view.listenTo(collection, 'add reset remove', app.trigger.bind(view, 'find:query:result', collection));
                                    return setCollection.apply(this, arguments);
                                };
                            };

                        // events
                        app.on({
                            'find:idle': function () {
                                if (mode === 'search') {
                                    // show sort options
                                    parent.listControl.$el.find('.grid-options:first').show();
                                    // reset collection loader
                                    parent.listView.connect(defaultLoader);
                                    parent.listView.load();
                                }
                                mode = 'default';
                            },
                            'find:query': _.debounce(function () {
                                // register/connect once
                                if (parent.listView.loader.mode !== 'search') register();
                                // load
                                parent.listView.load();
                            }, 10)
                        });

                    });
                });
            },

            'quit': function (app) {
                if (!app.get('inplace')) return;
                // also quit when parent app quits
                app.listenTo(app.get('parent'), 'quit', app.quit);
            },

            /**
             * Mode: standalone
             */
            'window-standalone': function  (app) {
                if (app.get('inplace')) return;

                var win;
                app.setWindow(win = ox.ui.createWindow({
                    name: 'io.ox/find',
                    chromeless: true
                }));
                win.show();
            }

        });

        // reset and collapse/hide
        app.cancel = function () {
            if (this.view) this.view.cancel();
        };

        // parent app id
        app.getModule = function () {
            return app.get('parent').get('name');
        };

        app.getModuleParam = function () {
            // find api parameter
            return app.getModule().split('/')[1];
        };

        app.isActive = function () {
            // return false unless view is initalised
            return app.view ? app.view.isActive() : false;
        };

        app.isMandatory = function (key) {
            var list = app.props.get('mandatory');
            return (list[key] || []).indexOf(app.getModuleParam()) >= 0;
        };

        // register event listeners
        function register () {
            var model = app.model,
                manager = model.manager;

            /**
             * find:query   list of active facets changed
             * find:idle    no active facets anymore
             */
            app.listenTo(manager, {
                'active': _.debounce(function (count) {
                        // ignore folder facet not combined with another facet
                        if (app.model.manager.isFolderOnly()) count = 0;
                        app.trigger(count ? 'find:query' : 'find:idle');
                    }, 10)
            });

            /**
             * find:cancel  reset, collapse search field and move focus
             */
            app.listenTo(app.view, {
                'cancel': function () {
                    app.trigger('find:cancel');
                }
            });

            /**
             * find:query:result  inform user about number of returned hits
             */
            app.on('find:query:result', function (response) {
                // screenreader
                var n = response.results.length,
                    //#. 'no results' message for screenreaders with additional hint to adjust active filters
                    empty = gt('No items were found. Please adjust currently used facets.'),
                    //#. result count for screenreaders
                    //#. %1$s number of items found by search feature
                    some = gt.format(gt.ngettext('One item was found.', '%1$s items were found.', n), n);
                //TODO: notifications
                //notifications.yell('screenreader', n ? some : empty);
                console.log(n ? some : empty);
            });
        }

        // DEBUG: states
        // app.on('change:state', function (e, state) {
        //     console.log('%c' + state, 'color: white; background-color: blue');
        // });

        /**
         * created: app created and accessible via parentapp.get('find')
         * prepared: app is mediated and placeholder view intantiated
         * launched: init views and models, search app is usable in full
         */
        app.prepare = function () {
            app.set('state', 'preparing');
            // setup
            app.mediate();
            require(['io.ox/find/view-placeholder'], function (PlaceholderView) {
                app.placeholder = new PlaceholderView({ app: app });
                // delay launch app (on focus)
                app.listenToOnce(app.placeholder, 'launch', app.launch);
                app.set('state', 'prepared');
            });
        };

        app.getProxy = (function () {
            var apiproxy;
            return function () {
                var def = $.Deferred();

                if (apiproxy) return apiproxy;
                // connect apiproxy first
                require(['io.ox/find/apiproxy'], function (ApiProxy) {
                    apiproxy = def.resolve(ApiProxy.init(app));
                });
                return def;
            };
        })();

        app.getConfig = function (query) {
            return app.getProxy().then(function (apiproxy) {
                return apiproxy.config(query);
            });
        };

        app.getSuggestions = function (query) {
            if (app.get('state') !== 'launched') return INVALID;
            return app.getProxy().then(function (apiproxy) {
                return apiproxy.search(query);
            });
        };

        app.getSearchResult = function (params, sync) {
            if (app.get('state') !== 'launched') return INVALID;
            return app.getProxy().then(function (apiproxy) {
                return apiproxy.query(params, sync);
            });
        };

        // overwrite defaults app.launch
        app.launch = function () {
            if (app.get('state') !== 'prepared') return;
            // get rid of placeholder view
            if (app.placeholder) {
                app.placeholder.destroy();
                delete app.placeholder;
            }
            // initialize views (tokenfield, typeahed, etc)
            app.set('state', 'launching');
            require(['io.ox/find/model', 'io.ox/find/view'], function (MainModel, MainView) {
                app.model = new MainModel({ app: app });
                app.view = new MainView({ app: app, model: app.model });
                // inplace: use parents view window
                app.view.render();
                register();
                app.getConfig().then(function (data) {
                    app.model.manager.update(data);
                    // TODO: or delay 'app.view.render()' until this point
                    app.view.ui.facets.render();
                });
                app.set('state', 'launched');
            });
        };

        return app;
    };

    return {
        getApp: createInstance,

        reuse: function (options) {
            return ox.ui.App.reuse(cid(options)) || createInstance(options);
        }
    };
});
