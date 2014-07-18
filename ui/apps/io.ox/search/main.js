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

define('io.ox/search/main',
    ['gettext!io.ox/search',
     'settings!io.ox/core',
     'io.ox/core/extensions',
     'io.ox/search/model',
     'io.ox/search/view',
     'io.ox/search/api',
     'io.ox/mail/api',
     'io.ox/core/notifications',
     'less!io.ox/search/style'
    ], function (gt, settings, ext, SearchModel, SearchView, api, mailAPI, notifications) {

    'use strict';

    ext.point('io.ox/search/main').extend({
        index: 100,
        id: 'default',
        config: function (data) {
            data.defaultApp =  settings.get('search/default', 'io.ox/mail');
        }
    });

    ext.point('io.ox/search/main').extend({
        index: 300,
        id: 'mandatory',
        config: function (data) {
            data.mandatory = data.mandatory || {};
            data.mandatory.folder = settings.get('search/mandatory/folder', ['mail', 'files']);
        }
    });

    ext.point('io.ox/search/main').extend({
        index: 400,
        id: 'mapping',
        config: function (data) {
            //active app : app searched in
            data.mapping = {
                //name mapping
                'io.ox/mail/write' : 'io.ox/mail',
                'com.voiceworks/ox-messenger' : data.defaultApp,
                'io.ox/drive' : 'io.ox/files',
                'io.ox/office/text' : 'io.ox/files',
                'io.ox/office/portal' : 'io.ox/files',
                'io.ox/office/spreadsheet' : 'io.ox/files',
                'io.ox/office/portal/text' : 'io.ox/files',
                'io.ox/office/portal/spreadsheet' : 'io.ox/files',
                'io.ox/portal' : data.defaultApp,
                'io.ox/search' : data.defaultApp,
                'io.ox/settings' : data.defaultApp
            };
        }
    });

    function openSidePopup(popup, e, target) {
        var id = target.attr('data-id'),
            item = model.get('items').get(id),
            baton = {};

        baton.data = item.get('data');

        // defer to get visual feedback first (e.g. script errors)
        _.defer(function () {
            ext.point('io.ox/search/items/' + model.getModule()).invoke('draw', popup, baton);
        });
    }

    //TODO: use custom node for autocomplete (autocomplete items appended here)
        //init window
    var win = ox.ui.createWindow({
            name: 'io.ox/search',
            title: 'Search',
            toolbar: true,
            search: false
        }),
        app = ox.ui.createApp({
            name: 'io.ox/search',
            title: 'Search',
            closable: true,
            window: win
        }),
        yell = function (error) {
            //add custom exception handling here
            notifications.yell(error);
        },
        sidepopup,
        win, model, run;


    //hide/show topbar search field
    win.on('show', function () {
        $('#io-ox-search-topbar')
            .addClass('hidden')
            .find('.search-field.widget').val('');
    });
    win.on('hide', function () {
        $('#io-ox-search-topbar')
            .removeClass('hidden');
    });
    //ensure launchbar entry
    win.on('show', function () {
        if (!ox.ui.apps.get(app))
            ox.ui.apps.add(app);
    });

    app.busy = function () {
        app.view.busy();
    };

    app.idle = function () {
        app.view.idle();
    };

    app.is = function (state) {
        return app.get('state') === state;
    };

    app.getModel = function () {
        return model;
    };

    // reduced version of app.quit to ensure app/window is reusable
    app.quit = function () {
        // update hash but don't delete information of other apps that might already be open at this point (async close when sending a mail for exsample);
        if ((app.getWindow() && app.getWindow().state.visible) && (!_.url.hash('app') || app.getName() === _.url.hash('app').split(':', 1)[0])) {
            //we are still in the app to close so we can clear the URL
            _.url.hash({ app: null, folder: null, perspective: null, id: null });
        }

        // destroy stuff
        app.folder.destroy();
        if (app.has('window')) {
            win.trigger('quit');
            ox.ui.windowManager.trigger('window.quit', win);
        }
        // remove from list
        ox.ui.apps.remove(app);

        // mark as not running
        app.trigger('quit');
        //reset
        model.reset({silent: true});
    };

    // define launcher callback
    app.setLauncher(function (options) {
        var opt = $.extend({}, options || {});

        win.nodes.main.addClass('io-ox-search f6-target').attr({
            'tabindex': '1',
            'role': 'main',
            'aria-label': gt('Search')
        });

        app.setWindow(win);

        //use application view
        app.view = SearchView.factory
                    .create(app, model, win.nodes.main);

        app.view.on({
            'query:start': function () {
                run();
                app.busy();
            },
            'query:stop': function () {
                app.idle();
            },
            'query:result': function () {
                run();
            }
        });

        //model-based events
        model.on('query change:start change:size', app.apiproxy.query);
        model.on('reset change', function () {
                app.view.redraw()
                         .focus();
                app.view.trigger('redraw');
        });

        //register model item
        model.get('items').on('needs-redraw', function () {
            this.render(app.view.getBaton());
        });

        //update model
        model.set({
            mode: 'window',
            query: opt.query
        });

        app.setTitle(gt('Search'));

        // return deferred
        win.show(function () {
            //detail view sidepopo
            require(['io.ox/core/tk/dialogs'], function (dialogs) {
                sidepopup = new dialogs.SidePopup({tabTrap: true})
                            .delegate(app.view.$el, '.item', openSidePopup);
            });
        });
    });

    //extend app
    app = $.extend(true, app, {

        //use proxy for managing model (called via autocomplete)
        apiproxy: {
            //alias for autocomplete tk
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
                            //extend standard options
                            standard.data.facets = facets;
                        })
                        .then(function () {
                            //call server
                            return api.autocomplete($.extend({}, standard, options));
                        })
                        .then(undefined, function (error) {
                            //fallback when app doesn't support search
                            if (error.code === 'SVL-0010') {
                                var app = model.getApp();
                                //add temporary mapping (default app)
                                model.defaults.options.mapping[app] = model.defaults.options.defaultApp;
                                return api.autocomplete($.extend(
                                                            standard, options, { params: {module: model.getModule()} }
                                                        ));
                            }
                            return error;
                        })
                        .then(function (obj) {
                            //TODO: remove when backend is ready
                            _.each(obj.facets.values, function (value) {
                                //multifilter facet
                                if (value.options)
                                    value.options = value.options[0];

                            });

                            //match convention in autocomplete tk
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
                        }, yell);
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
                    //call server
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
                    yell(result);
                    app.view.trigger('query:stop');
                    app.view.trigger('query:fail');
                }

                return function (sync, params) {
                    var opt = {
                        params: _.extend({ module: model.getModule() }, params),

                        data: {
                            start: model.get('start'),
                            //workaround: more searchresults?
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
        }
    });

    //init model and listeners
    model = SearchModel.factory.create({ mode: 'widget' });

    //run app
    run = function (options) {
        var current;

        //ensure
        options = options || {};

        if (app.is('ready')) {
            //not started yet use app callback for inital stuff
            app.launch.call(app);
        } else if (options.reset) {
            //reset model and update current app
            model.reset({silent: true});
            current = ox.ui.App.getCurrentApp().get('name');
            if (current !== 'io.ox/search')
                model.set('app', current, {silent: true});
            //update state
            app.set('state', 'running');
            //reset view
            app.launch();
            app.view.redraw({closeSidepanel: true});
        } else if (app.is('running')) {
            app.view.redraw();
        }
        app.view.focus();
        app.idle();
        return app;
    };

    return {

        getApp: app.getInstance,

        run: run,

        getView: function () {
            model.set({ mode: 'window' });
            return app.view = SearchView.factory.create(app, model);
        },

        model: model,

        apiproxy: app.apiproxy
    };
});
