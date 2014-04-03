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
     'io.ox/core/tk/dialogs',
     'io.ox/search/model',
     'io.ox/search/view',
     'io.ox/search/api',
     'io.ox/core/notifications',
     'less!io.ox/search/style'
    ], function (gt, settings, ext, dialogs, SearchModel, SearchView, api, notifications) {

    'use strict';

    ext.point('io.ox/search/main').extend({
        index: 100,
        id: 'default',
        config: function (data) {
            data.defaultApp =  settings.get('search/default', 'io.ox/mail');
        }
    });

    ext.point('io.ox/search/main').extend({
        index: 200,
        id: 'custom',
        config: function (data) {
            data.custom =  settings.get('search/custom/time', ['mail']);
        }
    });

    ext.point('io.ox/search/main').extend({
        index: 300,
        id: 'mandatory',
        config: function (data) {
            data.mandatory = data.mandatory || {};
            data.mandatory.folder = settings.get('search/mandatory/folder', ['mail', 'infostore']);
        }
    });

    ext.point('io.ox/search/main').extend({
        index: 400,
        id: 'mapping',
        config: function (data) {
            //active app : app searched in
            data.mapping = {
                //name mapping
                'io.ox/files' : 'io.ox/drive',
                //fallback/default mapping
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
            notifications.yell('error', error.error_desc);
        },
        sidepopup = new dialogs.SidePopup({tabTrap: true}),
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
        var container = app.view.$el.find('.query');
        container.find('.search-field')
                 .prop('disabled', true);
        container.find('.btn-search>.fa')
            .prop('disabled', true)
            .removeClass('fa-search')
            .addClass('fa-refresh fa-spin');
    };

    app.idle = function () {
        var container = app.view.$el.find('.query');
        container.find('.search-field')
                 .prop('disabled', false);
        container.find('.btn-search>.fa')
            .prop('disabled', false)
            .removeClass('fa-refresh fa-spin')
            .addClass('fa-search');
    };

    //reduced version of app.quit to ensure app/window is reusable
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
        model.setModule('');
    };
    //define launcher callback
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

        //update model
        model.set({
            mode: 'window',
            query: opt.query
        });

        app.setTitle(gt('Search'));

        // return deferred
        win.show(function () {
            sidepopup.delegate(app.view.$el, '.item', openSidePopup);
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
                            return api.autocomplete($.extend(standard, options));
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
            query: function () {
                var opt = {
                        params: {
                            //translate app to module param
                            module: model.getModule()
                        },
                        data: {
                            start: model.get('start'),
                            size: model.get('size')
                        }
                    },
                    start = Date.now();
                run();
                app.busy();
                return model.getFacets()
                        .then(function (facets) {
                            //extend options
                            opt.data.facets = facets;
                        })
                        .then(function () {
                            //TODO: better solution needed
                            var dummy = {
                                    num_found: -1,
                                    results: [],
                                    size: 0,
                                    start: 0
                                },
                                folderOnly = opt.data.facets.length === 1 && opt.data.facets[0].facet === 'folder';

                            //call server
                            return folderOnly ? $.Deferred().resolve(dummy) : api.query(opt);
                        })
                        .then(function (result) {
                            //update model
                            model.setItems(result, start);
                            run();
                        }, function (result) {
                            yell(result);
                            app.idle();
                        });
            }
        }
    });

    //init model and listeners
    model = SearchModel.factory.create({mode: 'widget'})
            .on('query change:start change:size', app.apiproxy.query)
            .on('reset change', function () {
                app.view.redraw();
            });

    //run app
    run = function () {
        if (app.get('state') === 'running') {
            //reuse
            app.launch();
            app.view.redraw();
        } else {
            app.launch.call(app);
        }
        app.idle();
    };

    return {
        getApp: app.getInstance,
        run: run,
        init: function () {
            app.view = SearchView.factory
                        .create(app, model)
                        .render();
            return model.get('mode') === 'widget' ? app.view.$el.find('.launcher-container') : app.view.$el;
        }
    };
});
