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

define('io.ox/search/main',
    ['gettext!io.ox/search',
     'io.ox/core/extensions',
     'io.ox/search/model',
     'io.ox/search/view',
     'io.ox/search/api',
     'io.ox/core/notifications',
     'less!io.ox/search/style'
    ], function (gt, ext, Model, View, api, notifications) {

    'use strict';

    ext.point('io.ox/search/main').extend({
        index: 100,
        row: '0',
        config: function (data) {
            data.mapping = {
                'io.ox/files' : 'io.ox/inforstore',
                'io.ox/portal' : 'io.ox/mail',
                'io.ox/search' : 'io.ox/mail',
                'io.ox/settings' : 'io.ox/mail'
            };
        }
    });

    //TODO: use custom node for autocomplete (autocomplete items appended here)
    //TODO: facete options (e.g. all, recipient, sender)
    var app = ox.ui.createApp({
            name: 'io.ox/search',
            title: 'Search'
            //TODO: destroys app
            //closable: true
        }),
        show = function (win) {
            var def = $.Deferred();
            win.show(def.resolve);
            return def;
        },
        yell = function (error) {
            notifications.yell('error', error.error_desc);
        },
        win, model;

    //define launcher callback
    app.setLauncher(function (options) {
        var opt = $.extend({}, options || {});

        app.launched = true;

        //init window
        win = ox.ui.createWindow({
                name: 'io.ox/search',
                title: 'Search',
                toolbar: true,
                search: false
            });
        win.addClass('io-ox-search-main');
        app.setWindow(win);

        //use application view
        app.view = View.factory
                    .create(app, model, win.nodes.main);

        //update model
        model.set({
            mode: 'window',
            query: opt.query
        });

        //TODO: gt
        app.setTitle(model.getTitle());

        // return deferred
        return show(win).done(function () {
            //TODO:
            //$(input.app).focus();
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
                        prefix: query,
                        activeFacets: model.getActive()
                    }
                };

                return api.autocomplete($.extend(standard, options))
                    .then(function (data) {
                        //remove already active static filters
                        var hash = {};

                        //build hash
                        _.each(model.get('active'), function (item) {
                            if (item.type === 'static')
                                hash[item.facet] = true;
                        });

                        //remove
                        data.list = _.filter(data.list, function (facet) {
                            return !hash[facet.id];
                        });
                        model.set({
                            query: query,
                            autocomplete: data

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
                            filters: model.getFilter(),
                            start: model.get('start'),
                            size: model.get('size')
                        }
                    };

                return api.query(opt)
                        .then(function (result) {
                            model.set('data', result);
                            if (!app.launched)
                                app.launch.call(app);
                            else
                                app.view.redraw();
                        }, yell);
            }
        }
    });

    //init model and listeners
    model = Model.factory.create({mode: 'widget'})
            .on('query change:start change:size', app.apiproxy.query)
            // .on('all', function (name, model, value) {
            //     console.log('event: ', name, value);
            // })
            .on('reset change', function () {
                //console.log('-> redraw: ', arguments);
                app.view.redraw();
            });

    //TODO: remove hack; timeout -> via ext point
    setTimeout(function () {
        var test = $('<div>');

        app.view = View.factory
                    .create(app, model, test)
                    .render();

        $('#io-ox-topbar .launchers-secondary').append(
            $('<li>').addClass('launcher').append(test)
        );
    }, 500);

    return {
        getApp: app.getInstance,
        reuse: function () {
            return ox.ui.App.reuse('io.ox/search');
        }
    };
});
