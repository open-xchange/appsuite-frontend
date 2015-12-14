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

define('io.ox/search/main', [
    'gettext!io.ox/search',
    'settings!io.ox/core',
    'io.ox/core/extensions',
    'io.ox/search/model',
    'io.ox/search/view',
    'io.ox/search/apiproxy',
    'less!io.ox/search/style'
], function (gt, settings, ext, SearchModel, SearchView, apiproxy) {

    'use strict';

    ext.point('io.ox/search/main').extend({
        index: 100,
        id: 'default',
        config: function (data) {
            // used only for search app
            data.defaultApp =  settings.get('search/default', 'io.ox/mail');
        }
    });

    ext.point('io.ox/search/main').extend({
        index: 300,
        id: 'mandatory',
        config: function (data) {
            data.mandatory = data.mandatory || settings.get('search/mandatory', {});
        }
    });

    ext.point('io.ox/search/main').extend({
        index: 400,
        id: 'mapping',
        config: function (data) {
            // active app : app searched in
            data.mapping = {
                // name mapping
                'io.ox/mail/compose': 'io.ox/mail',
                'com.voiceworks/ox-messenger': data.defaultApp,
                'io.ox/drive': 'io.ox/files',
                'io.ox/office/text': 'io.ox/files',
                'io.ox/office/portal': 'io.ox/files',
                'io.ox/office/spreadsheet': 'io.ox/files',
                'io.ox/office/presentation': 'io.ox/files',
                'io.ox/office/portal/text': 'io.ox/files',
                'io.ox/office/portal/spreadsheet': 'io.ox/files',
                'io.ox/office/portal/presentation': 'io.ox/files',
                'io.ox/portal': data.defaultApp,
                'io.ox/search': data.defaultApp,
                'io.ox/settings': data.defaultApp
            };
        }
    });

    ext.point('io.ox/search/main').extend({
        index: 400,
        id: 'folderfacet',
        config: function (data) {
            data.sticky = data.sticky || [];
            data.sticky.push({
                id: 'folder',
                name: gt('Folder'),
                style: 'custom',
                custom: true,
                hidden: true,
                flags: [
                    'conflicts:folder_type'
                ],
                values: [{
                    facet: 'folder',
                    id: 'custom',
                    custom: '',
                    filter: {}
                }]
            });
        }
    });

    // ext.point('io.ox/search/main').extend({
    //     index: 500,
    //     id: 'flags',
    //     config: function (data) {
    //         // limit active facets to 1
    //         data.flags = (data.flags || []).concat('singleton');
    //         // keep input value after selecting facet from dropdown
    //         data.switches = (data.switches || {});
    //         data.switches.keepinput = true;
    //     }
    // });

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

    // TODO: use custom node for autocomplete (autocomplete items appended here)
    // init window
    var win = ox.ui.createWindow({
            name: 'io.ox/search',
            title: 'Search',
            toolbar: true,
            chromeless: true,
            search: false,
            // important
            facetedsearch: false
        }),
        app = ox.ui.createApp({
            name: 'io.ox/search',
            title: 'Search',
            closable: true,
            window: win
        }),
        model, run;

    // hide/show topbar search field
    win.on('show', function () {
        $('#io-ox-search-topbar')
            .addClass('hidden')
            .find('.search-field.widget').val('');
    });
    win.on('hide', function () {
        $('#io-ox-search-topbar')
            .removeClass('hidden');
    });
    // ensure launchbar entry
    win.on('show', function () {
        if (!ox.ui.apps.get(app)) {
            ox.ui.apps.add(app);
        }
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
            // we are still in the app to close so we can clear the URL
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
        // reset
        model.reset({ silent: true });
    };

    // define launcher callback
    app.setLauncher(function (options) {
        var opt = $.extend({}, options || {}),
            current = ox.ui.App.getCurrentApp();

        win.nodes.main.addClass('container io-ox-search f6-target empty').attr({
            'tabindex': '1',
            'role': 'main',
            'aria-label': gt('Search')
        });

        app.setWindow(win);

        // use application view
        app.view = SearchView.factory
                    .create(app, model, win.nodes.main);

        // mediator: view
        app.view.on({
            'query:start': function () {
                app.view.repaint('apps');
                app.busy();
            },
            'query:stop': function () {
                app.view.repaint('info');
                app.idle();
            },
            'query:result': function () {
                app.view.repaint('items');
                app.idle();
            },
            'button:app': function () {
                app.view.repaint('apps');
                app.idle();
            }//,
            // 'button:clear': function () {
            //     app.view.$('.search-field').val('');
            // }
        });

        // mediator: model
        model.on({
            'query': function () {
                app.apiproxy.query();
            },
            'change:start': function () {
                app.apiproxy.query();
            },
            'change:size': function () {
                app.apiproxy.query();
            },
            'reset': function () {
                app.view.repaint('info items apps');
            }
        });

        // mediator: submodel
        model.get('items').on({
            'needs-redraw': function () {
                this.render(app.view.getBaton());
            }
        });

        // init model
        model.set({
            query: opt.query,
            app: current ? current.get('name') : model.defaults.options.defaultApp
        });

        app.setTitle(gt('Search'));

        // returns deferred
        win.show(function () {
            // detail view sidepopo
            require(['io.ox/core/tk/dialogs'], function (dialogs) {
                new dialogs.SidePopup({ tabTrap: true })
                            .delegate(app.view.$el, '.item', openSidePopup);
            });
        });

        //draw
        app.view.redraw().focus();
    });

    // init model and listeners
    model = SearchModel.factory.create();

    // extend app
    app.apiproxy = apiproxy.init(app);

    ext.point('io.ox/search').invoke('config', model, app);

    // run app
    run = function () {
        var current;

        if (app.is('ready')) {
            // not started yet use app callback for inital stuff
            app.launch();
        } else {
            // reset model and update current app
            model.reset({ silent: true });
            current = ox.ui.App.getCurrentApp().get('name');
            if (current !== 'io.ox/search') {
                model.set('app', current, { silent: true });
            }
            // update state
            app.set('state', 'running');
            // reset view
            app.launch();
            app.view.redraw({ closeSidepanel: true });
        }
        app.view.focus();
        app.idle();
        return app;
    };

    return {

        getApp: app.getInstance,

        run: run,

        getView: function () {
            return (app.view = SearchView.factory.create(app, model));
        },

        model: model,

        apiproxy: app.apiproxy
    };
});
