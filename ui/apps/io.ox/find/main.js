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

define('io.ox/find/main', [
    'io.ox/find/view-placeholder',
    'io.ox/core/folder/api',
    'io.ox/core/extensions',
    'settings!io.ox/core',
    'gettext!io.ox/core',
    'io.ox/core/api/jobs'
], function (PlaceholderView, folderAPI, ext, settings, gt, jobsAPI) {

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

    // add generic listener for long running search querries
    jobsAPI.on('added:find', function () {
        require(['io.ox/core/yell'], function (yell) {
            yell('info', gt('Please wait, your search may take a while'));
        });
    });

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
                // a concrete facet is mandatory for the follwing apps/modules
                var data = settings.get('search/mandatory', {});
                // see bug Bug 58913
                data.account = (data.account || []);
                data.account.push('drive');

                app.props.set('mandatory', data);
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
                    'io.ox/office/presentation': 'io.ox/files',
                    'io.ox/office/portal/text': 'io.ox/files',
                    'io.ox/office/portal/spreadsheet': 'io.ox/files',
                    'io.ox/office/portal/presentation': 'io.ox/files',
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
            'window-inplace': function (app) {
                if (!app.get('inplace')) return;

                // use 'parent' window
                app.set('window', app.get('parent').getWindow());
            },

            'state': function (app) {
                if (!app.get('inplace')) return;

                var parent = app.get('parent');
                app.on({
                    'find:query:result': function () {
                        // handle delayed result
                        if (app.isActive() !== true) return;
                        parent.props.set('find-result', true);
                    },
                    'find:idle': function () {
                        parent.props.set('find-result', false);
                    }
                });
            },

            'reset': function (app) {
                if (!app.get('inplace')) return;
                // reset on folder click
                app.listenTo(app.get('parent'), 'folder:change folder-virtual:change', app.cancel);
                // reset on sidepanel close (lazy)
                app.listenTo(app.get('parent').props, 'change:folderview', app.cancel);
            },

            'enable-disable-toggle': function (app) {
                if (!app.get('inplace')) return;
                // disable search field for unsupported folders
                // hint: see bug #45449 why we have to use treeview events
                app.listenTo(app.get('parent').treeView, 'selection:action', function (list, index) {
                    var item = $(list[index]);
                    if (item.hasClass('selected')) return;
                    app.updateState(item.attr('data-id'));
                });
            },

            'vgrid': function (app) {
                if (!app.get('inplace')) return;

                // check for vgrid
                var grid = app.get('parent').grid, fnEmpty;
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
                    var args = [ids];
                    return $.Deferred().resolveWith(app, args);
                });

                // events
                app.on({
                    'find:query': function () {
                        grid.setMode('search');
                        fnEmpty = grid.getEmptyMessage();
                        grid.setEmptyMessage(function () {
                            //#. search feature returns an empty result
                            return gt('No matching items found.');
                        });
                    },
                    'find:idle': function () {
                        if (grid.getMode() === 'all') return;
                        grid.setMode('all');
                        grid.setEmptyMessage(fnEmpty);
                    }
                });
            },

            'listview-empty-message': function (app) {
                if (!app.get('parent').listView) return;
                var ref = app.get('parent').listView.ref;
                ext.point(ref + '/notification/empty').extend({
                    id: 'search',
                    index: 100,
                    draw: function (baton) {
                        if (!baton.app.props.get('find-result')) return;
                        //#. search feature returns an empty result
                        this.text(gt('No matching items found.'));
                    }
                });
            },

            'listview-empty-message-action': function (app) {
                // non-listview app OR no 'all folders' option
                if (!app.get('parent').listView || app.isMandatory('folder')) return;
                var ref = app.get('parent').listView.ref;
                ext.point(ref + '/notification/empty').extend({
                    id: 'search-action',
                    index: 200,
                    draw: function (baton) {
                        // is listview currently in 'search mode'?
                        if (!baton.app.props.get('find-result')) return;
                        var manager = baton.app.get('find').model.manager;
                        // already searched in all folders?
                        if (manager.get('folder') && manager.get('folder').get('values').get('custom').getOption().id === 'disabled') return;

                        this.append(
                            //#. text link action to run current search again wihout any folder limitations
                            $('<button type="button" class="btn btn-link" data-action="search-button">')
                                .text(gt('Search in all folders'))
                                .on('click', function () {
                                    manager.activate('folder', 'custom', 'disabled');
                                    require(['io.ox/metrics/main'], function (metrics) {
                                        var name = baton.app.get('name') || 'unknown',
                                            apptitle = _.last(name.split('/'));
                                        metrics.trackEvent({
                                            app: apptitle,
                                            target: 'list/empty/search/filter/folder',
                                            action: 'remove'
                                        });
                                    });
                                })
                        );
                    }
                });
            },

            'listview': function (app) {
                if (!app.get('inplace')) return;

                app.on('change:state', function (e, state) {

                    if (state !== 'launched') return;
                    // check for listview
                    var parent = app.get('parent');
                    if (!parent.listView) return;

                    require(['io.ox/core/api/collection-loader'], function (CollectionLoader) {
                        var manager = app.view.model.manager,
                            searchcid = _.bind(manager.getResponseCid, manager),
                            defaultLoader = parent.listView.loader,
                            mode = 'default';

                        // define collection loader for search results
                        var collectionLoader = new CollectionLoader({
                            module: app.getModuleParam() === 'calendar' ? 'chronos' : app.getModuleParam(),
                            mode: 'search',
                            PRIMARY_PAGE_SIZE: defaultLoader.PRIMARY_SEARCH_PAGE_SIZE || defaultLoader.PRIMARY_PAGE_SIZE,
                            SECONDARY_PAGE_SIZE: defaultLoader.SECONDARY_SEARCH_PAGE_SIZE || defaultLoader.SECONDARY_PAGE_SIZE,
                            isBad: $.noop,
                            fetch: function (p) {
                                var self = this,
                                    limit = p.limit.split(','),
                                    start = parseInt(limit[0], 10),
                                    size = parseInt(limit[1], 10) - start;

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

                                    if (!list.length) return list;

                                    var item = list[0];
                                    // irrelevant (not original folder property/value)
                                    if (!item.original_folder_id) return list;
                                    // already correct (folder id and original folder id matches)
                                    if (item.original_folder_id === item.folder_id) return list;

                                    // special: use original ids to allow proper propagation of changes (bug 41209)
                                    list.forEach(function (obj) {
                                        _.extend(obj, {
                                            id: obj.original_id || obj.id,
                                            folder_id: obj.original_folder_id || obj.folder_id
                                        });
                                    });

                                    return list;
                                });
                            },
                            cid: searchcid
                        });
                        // disable cache also for modules with collection loader
                        parent.listView.on('collection:load', function () {
                            if (this.loader.mode !== 'search') return;
                            // do not use expire() here
                            if (collectionLoader.collection) collectionLoader.collection.expired = true;
                        });
                        app.trigger('collectionLoader:created', collectionLoader);
                        var register = function () {
                            parent.listView.connect(collectionLoader);
                            mode = 'search';
                        };

                        // events
                        app.on({
                            'find:idle': function () {
                                if (mode === 'search') {
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
            'window-standalone': function (app) {
                if (app.get('inplace')) return;

                var win;
                app.setWindow(win = ox.ui.createWindow({
                    name: 'io.ox/find',
                    chromeless: true
                }));
                win.show();
            },

            'file-storages': function (app) {
                var isDrive = app.getModuleParam() === 'files';
                if (!isDrive) return app.set('storages', []);
                require(['io.ox/core/api/filestorage'], function (filesstorageAPI) {
                    // ensure rampup was executed
                    filesstorageAPI.rampup().then(function () {
                        app.set('storages', filesstorageAPI.getAccountsCache());
                        // currenty implementation: filestorages do not change during runtime
                        app.get('storages').on({
                            'change': $.noop,
                            'add': $.noop,
                            'remove': $.noop
                        });
                    });
                });
            }

        });

        // reset and collapse/hide
        app.cancel = function () {
            if (this.view) this.view.cancel();
        };

        app.updateState = function (folderid) {
            // is folder unsupported?
            app.trigger(folderAPI.isVirtual(folderid) ? 'view:disable' : 'view:enable');
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
            // return false unless view is initialised
            return app.view ? app.view.isActive() : false;
        };

        app.isMandatory = function (key) {
            var list = app.props.get('mandatory');
            // TODO: remove workaround when we use a unque identified for drive in frontend/backend
            var module = app.getModuleParam();
            if (module === 'files') module = 'drive';
            return (list[key] || []).indexOf(module) >= 0;
        };

        app.getFolderFacetValue = function () {
            if (!app.isActive()) return;
            var facet = _(app.model.manager.getRequest()).findWhere({ facet: 'folder' });
            return (facet || {}).value;
        };

        // register event listeners
        function register() {
            var model = app.model,
                manager = model.manager,
                isDrive = app.getModuleParam() === 'files';

            /**
             * find:query   list of active facets changed
             * find:idle    no active facets anymore
             */
            app.listenTo(manager, {
                'active': _.debounce(function (count) {
                    // ignore folder facet not combined with another facet
                    if (app.model.manager.isFolderOnly()) count = 0;
                    if (isDrive && app.model.manager.isAccountOnly()) count = 0;
                    app.trigger(count ? 'find:query' : 'find:idle');
                }, 10)
            });

            // TODO: move to ext point (>= 7.8.1)
            app.listenTo(manager, {
                'change:list-of-actives': _.debounce(function (state, value, model) {
                    require(['io.ox/metrics/main'], function (metrics) {
                        var name = app.get('parent').get('name') || 'unknown',
                            apptitle = _.last(name.split('/')),
                            facet = model.get('facet').get('id').split(':')[0],
                            isDisabled = state === 'deactivate' || model.get('facet') && model.get('facet').getValue().getOption().id === 'disabled';
                        // toolbar actions
                        metrics.trackEvent({
                            app: apptitle,
                            target: 'search/filter/' + facet,
                            action: isDisabled ? 'remove' : 'add'
                        });
                    });
                }, 10)
            });
            /**
             * find:cancel  reset, collapse search field and move focus
             */
            app.listenTo(app.view, {
                'cancel': function () {
                    app.trigger('find:cancel');
                },
                'show': function () {
                    app.updateConfig();
                }
            });

            /**
             * find:query:result  inform user about number of returned hits
             */
            // app.on('find:query:result', function (response) {
            //     // screenreader
            //     var n = response.results.length,
            //         //#. 'no results' message for screenreaders with additional hint to adjust active filters
            //         empty = gt('No items were found. Please adjust currently used facets.'),
            //         //#. result count for screenreaders
            //         //#. %1$s number of items found by search feature
            //         some = gt.ngettext('%1$d item was found.', '%1$s items were found.', n, n);
            //     notifications.yell('screenreader', n ? some : empty);
            // });
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
            app.placeholder = new PlaceholderView({ app: app });
            // disable when virtual folder selected
            var folder = app.get('parent').folder.get();
            app.updateState(folder);
            // delay launch app (on focus)
            app.listenToOnce(app.placeholder, 'launch', app.launch);
            app.set('state', 'prepared');
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

        app.getConfig = function (options) {
            return app.getProxy().then(function (apiproxy) {
                return apiproxy.config(options);
            });
        };

        app.getSuggestions = function (query) {
            if (app.get('state') !== 'launched') return INVALID;
            // add app.configReady as dependency (ensure mandatry facets are set)
            return $.when(app.getProxy(), app.configReady)
                .then(function (apiproxy) {
                    return apiproxy.search(query);
                });
        };

        app.getSearchResult = function (params, sync) {
            if (app.get('state') !== 'launched') return INVALID;
            return app.getProxy().then(function (apiproxy) {
                return apiproxy.query(params, sync);
            });
        };

        function configPreprocess() {
            var parent = app.get('parent');

            return $.when(parent.folder.getData(), parent.folder.isDefault())
                    .then(function (data, isDefault) {
                        var facets = [],
                            manager = app.model.manager;

                        // only add when non default folder
                        if (!isDefault || app.isMandatory('folder')) {
                            facets.push({
                                facet: 'folder',
                                filter: null,
                                value: data.id
                            });
                        }

                        // mandatory
                        if (app.isMandatory('account') && !(manager.findWhere({ id: 'account' }) && manager.findWhere({ id: 'account' }).getActive().length)) {
                            facets.push({
                                facet: 'account',
                                filter: null,
                                value: data.account_id
                            });
                        }
                        if (facets.length) {
                            return { data: { facets: facets } };
                        }
                    });
        }

        // global indicator of config was applied
        app.configReady = $.Deferred();

        app.updateConfig = function () {
            configPreprocess()
                .then(app.getConfig)
                .then(function (data) {
                    data = _.reject(data, function (facet) { return facet.id === 'contact'; });
                    app.model.manager.update(data);
                    app.trigger('find:config-updated');
                    // manager knows all mandatory facets now and will add them to all calls
                    app.configReady.resolve();
                }, function (error) {
                    require(['io.ox/core/yell'], function (yell) {
                        yell(error);
                    });
                    app.cancel();
                });
        };

        // overwrite defaults app.launch
        app.launch = function () {
            if (app.get('state') !== 'prepared') return;

            // initialize views (tokenfield, typeahed, etc)
            app.set('state', 'launching');
            // get rid of placeholder view
            if (app.placeholder) {
                app.placeholder.destroy();
                delete app.placeholder;
            }
            require(['io.ox/find/bundle'], function () {
                require(['io.ox/find/model', 'io.ox/find/view'], function (MainModel, MainView) {
                    app.model = new MainModel({ app: app });
                    app.view = new MainView({ app: app, model: app.model });
                    register();
                    // inplace: use parents view window
                    app.view.render();
                    app.set('state', 'launched');
                    // trigger global event
                    ox.trigger('search:load', app);
                });
                // reset cache on contact changes
                require(['io.ox/contacts/api'], function (contactsAPI) {
                    contactsAPI.on('refresh.all', function () {
                        app.getProxy().done(function (proxy) { proxy.resetCache(); });
                    });
                });
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
