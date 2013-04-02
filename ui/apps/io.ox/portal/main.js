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
     'io.ox/portal/widgets',
     'gettext!io.ox/portal',
     'settings!io.ox/portal',
     'less!io.ox/portal/style.css',
     'apps/io.ox/core/tk/jquery-ui.min.js'
    ], function (ext, userAPI, date, manifests, dialogs, widgets, gt, settings) {

    'use strict';

    var READY = $.when();

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

    function setColor(node, model) {
        var color = node.attr('data-color');
        node.removeClass('widget-color-' + color);
        color = model.get('color') || 'black';
        node.addClass('widget-color-' + color).attr('data-color', color);
    }

    // portal header
    ext.point('io.ox/portal/sections').extend({
        id: 'header',
        index: 100,
        draw: function (baton) {
            var $btn = $();
            if (_.device('!small')) {
                // please no button
                $btn = $('<button class="btn btn-primary pull-right">')
                    .attr('data-action', 'customize')
                    .on('click', openSettings);
            }
            this.append(
                $('<div class="header">').append(
                    // button
                    $btn,
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
                baton.$.widgets = $('<ol class="widgets">')
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
            .addClass('widget pending' + (baton.model.get('inverse') ? ' inverse' : ''))
            .append(
                $('<h2 class="title">').text('\u00A0')
            );
            setColor(this, baton.model);
        }
    });

    // application object
    var app = ox.ui.createApp({ name: 'io.ox/portal', title: 'Portal' }),
        win,
        appBaton = ext.Baton({ app: app }),
        sidepopup = new dialogs.SidePopup(),
        availablePlugins = widgets.getAvailablePlugins(),
        collection = widgets.getCollection();

    app.settings = settings;

    collection.on('remove', function (model, e) {
        // remove DOM node
        appBaton.$.widgets.find('[data-widget-cid="' + model.cid + '"]').remove();
        // clean up
        if (model.has('baton')) {
            delete model.get('baton').model;
            model.set('baton', null);
            model.isDeleted = true;
        }
    });

    collection.on('add', function (model) {
        app.drawScaffold(model);
        widgets.loadUsedPlugins().done(function () {
            app.drawWidget(model);
        });
    });

    collection.wasElementDeleted = function (model) {
        var needle = model.cid,
            haystack = this.models;
        return !_(haystack).some(function (suspiciousHay) {return suspiciousHay.cid === needle; });
    };

    collection.on('change', function (model, e) {
        if ('enabled' in e.changes) {
            if (model.get('enabled')) {
                app.getWidgetNode(model).show();
                app.drawWidget(model);
            } else {
                app.getWidgetNode(model).hide();
            }
        } else if ('color' in e.changes) {
            setColor(app.getWidgetNode(model), model);
        } else if (this.wasElementDeleted(model)) {
             //Element was removed, no need to refresh it.
        } else {
            app.drawWidget(model);
        }
    });

    collection.on('sort', function () {
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
        if (model.get('enabled') === false) node.hide();
        appBaton.$.widgets.append(node);
    };

    app.getWidgetNode = function (model) {
        return appBaton.$.widgets.find('[data-widget-cid="' + model.cid + '"]');
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
            })
            .fail(function (errorData) {
                node.find('.content').remove();
                node.append(
                    $('<div class="content error">').append(
                        $('<div>').text(gt('An error occurred. The message was:')),
                        $('<div class="italic">').text(errorData.error),
                        '<br />',
                        $('<a class="solution">').text(gt('Click to try again.')).on('click', function () {
                            node.addClass('pending');
                            loadAndPreview(point, node, baton);
                        })
                    )
                );
                point.invoke('error', node, errorData, baton);
                node.removeClass('pending');
            });
    }

    function getTitle(data, fallback) {
        return data.title || (data.props ? (data.props.description || data.props.title) : '') || fallback || '';
    }

    app.drawWidget = function (model, index) {

        var type = model.get('type'),
            node = app.getWidgetNode(model),
            delay = (index / 2 >> 0) * 1000,
            baton = ext.Baton({ model: model, point: 'io.ox/portal/widget/' + type }),
            point = ext.point(baton.point),
            requiresSetUp = point.invoke('requiresSetUp').reduce(reduceBool, true).value(),
            title;

        // set/update title
        title = node.find('h2.title').text(getTitle(model.toJSON(), point.prop('title')));

        if (!model.drawn) {

            model.drawn = true;
            index = index || 0;

            // remember
            model.set('baton', baton);

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
                _.delay(function () {
                    // initialize first
                    point.invoke('initialize', node, baton);
                    // load & preview
                    loadAndPreview(point, node, baton);
                }, delay);
            }
        }
    };

    app.refreshWidget = function (model, index) {
        if (model.drawn) {
            var type = model.get('type'),
                node = app.getWidgetNode(model),
                delay = (index / 2 >> 0) * 1000,
                baton = model.get('baton'),
                point = ext.point(baton.point);
            _.defer(function () {
                _.delay(function () {
                    node.addClass('pending');
                    _.delay(function () {
                        loadAndPreview(point, node, baton);
                        node = baton = point = null;
                    }, 300); // CSS Transition delay 0.3s
                }, delay);
            });
        }
    };

    // can be called every 30 seconds
    app.refresh = _.throttle(function () {
        widgets.getEnabled().each(app.refreshWidget);
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

            // add -webkit-overflow-scroll only for iOS to enable momentum scroll
            // (will cause errors on android chrome)
            // TODO: avoid device specific inline css fixes
            if (_.browser.iOS) {
                $('.io-ox-portal').css('-webkit-overflow-scrolling', 'touch');
            }

            // make sortable, but not for Touch devices
            if (!Modernizr.touch) {
                appBaton.$.widgets.sortable({
                    containment: win.nodes.main,
                    scroll: true,
                    delay: 150,
                    stop: function (e, ui) {
                        widgets.save(appBaton.$.widgets);
                    }
                });
            }

            widgets.loadUsedPlugins().done(function () {
                widgets.getEnabled().each(app.drawWidget);
            });
        });
    });

    return {
        getApp: app.getInstance
    };
});
