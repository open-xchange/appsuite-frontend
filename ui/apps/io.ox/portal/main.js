/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/portal/main',
    ['io.ox/core/extensions',
     'io.ox/core/api/user',
     'io.ox/core/date',
     'io.ox/core/manifests',
     'io.ox/core/tk/dialogs',
     'gettext!io.ox/portal',
     'settings!io.ox/portal',
     'less!io.ox/portal/style.css',
     'apps/io.ox/core/tk/jquery-ui.min.js'
    ], function (ext, userAPI, date, manifests, dialogs, gt, settings) {

    'use strict';

    var READY = $.when(),
        DEV_PLUGINS = ['plugins/portal/contacts/register'];

    // time-based greeting phrase
    function getGreetingPhrase(name) {
        var hour = new date.Local().getHours();
        // find proper phrase
        if (hour >= 4 && hour <= 11) {
            return gt('Good morning, %s', name);
        } else if (hour >= 18 && hour <= 23) {
            return gt('Good evening, %s', name);
        } else {
            return gt('Hello %s', name);
        }
    }

    function openSettings() {
        require(['io.ox/settings/main'], function (m) {
            m.getApp().launch().done(function () {
                this.getGrid().selection.set({ id: 'io.ox/portal' });
            });
        });
    }

    // portal header
    ext.point('io.ox/portal/sections').extend({
        id: 'header',
        index: 100,
        draw: function (baton) {
            this.append(
                $('<div class="header">').append(
                    // button
                    $('<button class="btn btn-primary pull-right">')
                        .attr('data-action', 'customize')
                        .text(gt('Customize this page'))
                        .on('click', openSettings),
                    // greeting
                    $('<h1 class="greeting">').append(
                        baton.$.greeting = $('<span class="greeting-phrase">'),
                        $('<span class="signin">').append(
                            $('<i class="icon-user">'), $.txt(' '),
                            $.txt(
                                //#. Portal. Logged in as user
                                gt('Signed in as %1$s', ox.user)
                            )
                        )
                    )
                )
            );
        }
    });

    // widget container
    ext.point('io.ox/portal/sections').extend({
        id: 'widgets',
        index: 200,
        draw: function (baton) {
            this.append(
                baton.$.widgets = $('<ul class="widgets">')
            );
        }
    });

    // widget scaffold
    ext.point('io.ox/portal/widget-scaffold').extend({
        draw: function (baton) {
            var data = baton.model.toJSON();
            this.attr({
                'data-widget-cid': baton.model.cid,
                'data-widget-id': baton.model.get('id'),
                'data-widget-type': baton.model.get('type')
            })
            .addClass('widget widget-color-' + (data.color || 'black') + ' widget-' + data.type + ' pending')
            .append(
                $('<h2 class="title">').text('\u00A0')
            );
        }
    });

    // application object
    var app = ox.ui.createApp({ name: 'io.ox/portal', title: 'Portal' }),
        win,
        appBaton = ext.Baton({ app: app }),
        sidepopup = new dialogs.SidePopup(),
        availablePlugins = _(manifests.manager.pluginsFor('portal')).uniq().concat(DEV_PLUGINS),
        collection = new Backbone.Collection([]);

    collection.comparator = function (a, b) {
        return ext.indexSorter({ index: a.get('index') }, { index: b.get('index') });
    };

    app.settings = settings;

    app.getWidgetSettings = function () {
        return _(settings.get('widgets/user', {}))
            .chain()
            // map first since we need the object keys
            .map(function (obj, id) {
                obj.id = id;
                obj.type = id.split('_')[0];
                obj.props = obj.props || {};
                return obj;
            })
            .filter(function (obj) {
                return (obj.enabled === undefined || obj.enabled === true) && _(availablePlugins).contains(obj.plugin);
            })
            .value();
    };

    collection.reset(app.getWidgetSettings());

    collection.on('remove', function (model) {
        // remove DOM node
        appBaton.$.widgets.find('[data-widget-cid="' + model.cid + '"]').remove();
        // clean up
        if (model.baton) {
            delete model.baton.model;
            delete model.baton;
        }
    });

    collection.on('add', function (model) {
        app.drawScaffold(model);
        app.loadPlugins().done(function () {
            app.drawWidget(model);
        });
    });

    settings.on('change', function () {

        var ids = collection.pluck('id');

        _(app.getWidgetSettings()).each(function (obj) {
            // added?
            if (!_(ids).contains(obj.id)) {
                collection.add(obj);
            } else {
                // update model
                collection.find(function (model) {
                    if (model.get('id') === obj.id) {
                        model.set(obj);
                        return true;
                    }
                });
                // remove from list
                ids = _(ids).without(obj.id);
            }
        });

        // all remaining ids need to be removed
        collection.remove(
            collection.filter(function (model) {
                return _(ids).contains(model.id);
            })
        );

        collection.sort({ silent: true });

        // loop over collection for resorting DOM tree
        collection.each(function (model) {
            // just re-append all in proper order
            appBaton.$.widgets.append(app.getWidgetNode(model));
        });
    });

    app.getWidgetCollection = function () {
        return collection;
    };

    app.updateTitle = function () {
        userAPI.getGreeting(ox.user_id).done(function (name) {
            appBaton.$.greeting.text(getGreetingPhrase(name));
        });
    };

    function openSidePopup(popup, e, target) {
        // get widget node
        var node = target.closest('.widget'),
            // get widget cid
            cid = node.attr('data-widget-cid'),
            // get model
            model = collection.getByCid(cid), baton;
        if (model) {
            baton = model.get('baton');
            baton.item = target.data('item');
            // defer to get visual feedback first (e.g. script errors)
            _.defer(function () {
                ext.point('io.ox/portal/widget/' + model.get('type')).invoke('draw', popup.empty(), model.get('baton'));
            });
        }
    }

    app.drawScaffold = function (model) {
        var node = $('<li>'),
            baton = ext.Baton({ model: model, app: app });
        ext.point('io.ox/portal/widget-scaffold').invoke('draw', node, baton);
        appBaton.$.widgets.append(node);
    };

    app.getWidgetNode = function (model) {
        return appBaton.$.widgets.find('[data-widget-cid="' + model.cid + '"]');
    };

    app.loadPlugins = function () {
        var usedPlugins = collection.pluck('plugin'),
            dependencies = _(availablePlugins).intersection(usedPlugins);
        return require(dependencies).done(function () {
            app.removeDisabledWidgets();
        });
    };

    function setup(e) {
        var baton = e.data.baton;
        ext.point(baton.point).invoke('performSetUp');
    }

    app.drawDefaultSetup = function (baton) {
        this.getWidgetNode(baton.model)
            .addClass('requires-setup')
            .append(
                $('<div class="content">').text(gt('Click here to add your account'))
                .on('click', { baton: baton }, setup)
            );
    };

    function ensureDeferreds(ret) {
        return ret && ret.promise ? ret : READY;
    }

    function reduceBool(memo, bool) {
        return memo && bool;
    }

    function runAction(e) {
        ext.point(e.data.baton.point).invoke('action', $(this).closest('.widget'), e.data.baton);
    }

    function loadAndPreview(point, node, baton) {
        var defs = point.invoke('load', node, baton).map(ensureDeferreds).value();
        return $.when.apply($, defs).done(function () {
                node.find('.content').remove();
                point.invoke('preview', node, baton);
                node.removeClass('pending error-occurred');
            }).fail(function () {
                node.find('.content').remove();
                node.append(
                    $('<div class="content">').text(gt('An error occurred. Click to try again')).bind('click', function () {
                                node.addClass('pending');
                                loadAndPreview(point, node, baton);
                            })
                );
                node.addClass('error-occurred');
                node.removeClass('pending');
            });
    }

    app.removeDisabledWidgets = function () {
        collection.remove(
            collection.filter(function (model) {
                return ext.point('io.ox/portal/widget/' + model.get('type'))
                    .invoke('isEnabled').reduce(reduceBool, true).value() === false;
            })
        );
    };

    function getTitle(data, fallback) {
        return data.title || (data.props ? (data.props.description || data.props.title) : '') || fallback || '';
    }

    app.drawWidget = function (model, index) {

        index = index || 0;

        var type = model.get('type'),
            node = app.getWidgetNode(model),
            delay = (index / 2 >> 0) * 2000,
            baton = ext.Baton({ model: model, point: 'io.ox/portal/widget/' + type }),
            point = ext.point(baton.point),
            requiresSetUp = point.invoke('requiresSetUp').reduce(reduceBool, true).value(),
            title;

        // remember baton
        model.set('baton', baton);

        // set title
        title = node.find('h2.title').text(getTitle(model.toJSON(), point.prop('title')));

        // setup?
        if (requiresSetUp) {
            node.removeClass('pending');
            app.drawDefaultSetup(baton, node);
        } else {
            // add link?
            if (point.prop('action') !== undefined) {
                title.addClass('action-link').on('click', { baton: baton }, runAction);
            }
            // simple delay approach
            setTimeout(function () {
                // initialize first
                point.invoke('initialize', node, baton);
                // load & preview
                loadAndPreview(point, node, baton);
            }, delay);
        }
    };

    // can be called every 30 seconds
    app.refresh = _.throttle(function () {
        collection.each(function (model, index) {
            var type = model.get('type'),
                node = app.getWidgetNode(model),
                delay = Math.random() * (collection.length / 2) * 1000,
                baton = model.get('baton'),
                point = ext.point(baton.point);
            setTimeout(function () {
                node.addClass('pending');
                setTimeout(function () {
                    loadAndPreview(point, node, model.get('baton'));
                    node = baton = point = null;
                }, 300);
            }, delay);
        });
    }, 30000);

    ox.on('refresh^', function () {
        app.refresh();
    });

    // launcher
    app.setLauncher(function () {

        // get window
        app.setWindow(win = ox.ui.createWindow({
            name: 'io.ox/portal',
            chromeless: true
        }));

        ext.point('io.ox/portal/sections').invoke('draw', win.nodes.main.addClass('io-ox-portal'), appBaton);

        app.updateTitle();
        _.tick(1, 'hour', app.updateTitle);

        win.show(function () {

            // draw scaffolds now for responsiveness
            collection.each(app.drawScaffold);

            // add side popup
            sidepopup.delegate(appBaton.$.widgets, '.item, .content.pointer, .action.pointer', openSidePopup);

            // make sortable
            appBaton.$.widgets.sortable({
                containment: win.nodes.main,
                scroll: true,
                delay: 150,
                stop: function (e, ui) {
                    // update all indexes
                    var widgets = settings.get('widgets/user');
                    $(this).children('.widget').each(function (index) {
                        var node = $(this), id = node.attr('data-widget-id');
                        if (id in widgets) {
                            widgets[id].index = index;
                        }
                    });
                    // adopt current DOM order
                    collection.each(function (model) {
                        var node = app.getWidgetNode(model);
                        model.set('index', node.index());
                    });
                    // trigger save
                    settings.set('widgets/user', widgets).save();
                }
            });

            app.loadPlugins().done(function () {
                collection.each(app.drawWidget);
            });
        });
    });

    return {
        getApp: app.getInstance
    };
});
