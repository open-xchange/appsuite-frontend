/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/portal/main',
    ['io.ox/core/extensions',
     'io.ox/core/api/user',
     'io.ox/core/date',
     'io.ox/core/tk/dialogs',
     'io.ox/portal/widgets',
     'io.ox/portal/util',
     'io.ox/portal/settings/pane',
     'gettext!io.ox/portal',
     'settings!io.ox/portal',
     'less!io.ox/portal/style.less'
    ], function (ext, userAPI, date, dialogs, widgets, util, settingsPane, gt, settings) {

    'use strict';

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
            var $btn,
                $greeting;

            this.append($btn = $('<div class="header">'));
            // greeting
            $greeting = $('<h1 class="greeting">').append(
                baton.$.greeting = $('<span class="greeting-phrase">'),
                $('<span class="signin">').text(
                    //#. Portal. Logged in as user
                    gt('Signed in as %1$s', ox.user)
                )
            );

            if (_.device('!small')) {
                widgets.loadAllPlugins().done(function () {
                    // add widgets
                    ext.point('io.ox/portal/settings/detail/pane').map(function (point) {
                        if (point && point.id === 'add') {
                            point.invoke('draw', $btn);
                        }
                    });
                    // please no button
                    $btn.find('.controls')
                        .prepend($('<button type="button" class="btn btn-primary pull-right">')
                        .css({ marginLeft: '5px' })
                        .attr({
                            'data-action': 'customize',
                            tabindex: 1
                        })
                        .text(gt('Customize this page'))
                        .on('click', openSettings));
                    $btn.append($greeting);
                });
            } else {
                $btn.append($greeting);
            }
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
        id: 'attributes',
        index: 100,
        draw: function (baton) {
            this.attr({
                'data-widget-cid': baton.model.cid,
                'data-widget-id': baton.model.get('id'),
                'data-widget-type': baton.model.get('type')
            });
        }
    });

    ext.point('io.ox/portal/widget-scaffold').extend({
        id: 'classes',
        index: 200,
        draw: function (baton) {
            this.addClass('widget' + (baton.model.get('inverse') ? ' inverse' : ''))
                .addClass(baton.model.get('protectedWidget') || false ? ' protected' : ' draggable');
        }
    });

    ext.point('io.ox/portal/widget-scaffold').extend({
        id: 'default',
        index: 300,
        draw: function (baton) {
            this.append(
                // border decoration
                $('<div class="decoration pending">').append(
                    $('<h2>').append(
                        // add remove icon
                        baton.model.get('protectedWidget') ? [] :
                            $('<a class="disable-widget"><i class="icon-remove"/></a>')
                            .attr({
                                href: '#',
                                role: 'button',
                                'title': gt('Disable widget'),
                                'aria-label': gt('Disable widget'),
                                tabindex: 1
                            }),
                        // title span
                        $('<span class="title">').text('\u00A0')
                    )
                )
            );
        }
    });

    ext.point('io.ox/portal/widget-scaffold').extend({
        id: 'color',
        index: 400,
        draw: function (baton) {
            util.setColor(this, baton.model.get('color'));
        }
    });

    // application object
    var app = ox.ui.createApp({ name: 'io.ox/portal', title: 'Portal' }),
        win,
        scrollPos = window.innerHeight,
        appBaton = ext.Baton({ app: app }),
        sidepopup = new dialogs.SidePopup({tabTrap: true}),
        collection = widgets.getCollection();

    app.settings = settings;

    collection
        .on('remove', function (model) {
            // remove DOM node
            appBaton.$.widgets.find('[data-widget-cid="' + model.cid + '"]').remove();
            // clean up
            if (model.has('baton')) {
                delete model.get('baton').model;
                model.set('baton', null, {validate: true});
                model.isDeleted = true;
            }
            widgets.save(appBaton.$.widgets);
        })
        .on('add', function (model) {
            app.drawScaffold(model, true);
            widgets.loadUsedPlugins().done(function () {
                if (model.has('candidate') !== true) {
                    app.drawWidget(model);
                    widgets.save(appBaton.$.widgets);
                }
            });
        })
        .on('change', function (model, e) {
            if ('enabled' in model.changed) {
                if (model.get('enabled')) {
                    app.getWidgetNode(model).show();
                    app.drawWidget(model);
                } else {
                    app.getWidgetNode(model).hide();
                }
            } else if ('color' in model.changed) {
                util.setColor(app.getWidgetNode(model), model.get('color'));
            } else if (this.wasElementDeleted(model)) {
                // element was removed, no need to refresh it.
                return;
            } else if ('unset' in e && 'candidate' in model.changed) {
                // redraw fresh widget
                app.refreshWidget(model);
            } else if ('props' in model.changed && model.drawn) {
                // redraw existing widget due to config change
                app.refreshWidget(model);
            } else {
                app.drawWidget(model);
            }
        })
        .on('sort', function () {
            this.sort({ silent: true });
            // loop over collection for resorting DOM tree
            this.each(function (model) {
                // just re-append all in proper order
                appBaton.$.widgets.append(app.getWidgetNode(model));
            });
        });

    collection.wasElementDeleted = function (model) {
        var needle = model.cid,
            haystack = this.models;
        return !_(haystack).some(function (suspiciousHay) {return suspiciousHay.cid === needle; });
    };

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
            model = collection.get(cid), baton;
        if (model) {
            baton = model.get('baton');
            baton.item = target.data('item');
            // defer to get visual feedback first (e.g. script errors)
            _.defer(function () {
                ext.point('io.ox/portal/widget/' + model.get('type')).invoke('draw', popup.empty(), model.get('baton'));
            });
        }
    }

    app.drawScaffold = function (model, add) {
        add = add || false;
        var baton = ext.Baton({ model: model, app: app, add: add }),
            node = $('<li>').attr({
                tabindex: 1
            });

        if (_.device('small')) {
            node.css('minHeight', 300);
        }
        model.node = node;
        ext.point('io.ox/portal/widget-scaffold').invoke('draw', node, baton);

        if (model.get('enabled') === false) {
            node.hide();
        } else {
            if (!widgets.visible(model.get('type'))) {
                // hide due to missing capabilites
                node.hide();
                return;
            }
        }

        appBaton.$.widgets[add ? 'prepend' : 'append'](node);
    };

    app.getWidgetNode = function (model) {
        return appBaton.$.widgets.find('[data-widget-cid="' + model.cid + '"]');
    };

    function setup(e) {
        var baton = e.data.baton;
        ext.point(baton.point).invoke('performSetUp', null, baton);
    }

    app.drawDefaultSetup = function (baton) {
        baton.model.node
            .addClass('requires-setup')
            .append(
                $('<div class="content" tabindex="1" role="button">').text(gt('Click here to add your account'))
                .on('click', { baton: baton }, setup)
                .on('keypress', { baton: baton }, function (e) {
                    if (e.which === 13) {
                        setup(e);
                    }
                })
            );
    };

    function ensureDeferreds(ret) {
        return ret && ret.promise ? ret : $.when();
    }

    function reduceBool(memo, bool) {
        return memo && bool;
    }

    function runAction(e) {
        ext.point(e.data.baton.point).invoke('action', $(this).closest('.widget'), e.data.baton);
    }

    function loadAndPreview(point, node, baton) {
        var defs = point.invoke('load', node, baton).map(ensureDeferreds).value(),
            decoration = node.find('.decoration');
        return $.when.apply($, defs).done(function () {
                node.find('.content').remove();
                // draw summary only on small devices, i.e. smartphones
                if (_.device('smartphone') && settings.get('mobile/summaryView')) {
                    point.invoke('summary', node, baton);
                }
                point.invoke('preview', node, baton);
                node.removeClass('error-occurred');
                decoration.removeClass('pending error-occurred');
            })
            .fail(function (e) {
                // special return value?
                if (e === 'remove') {
                    widgets.remove(baton.model);
                    node.remove();
                    return;
                }
                // show error message
                node.find('.content').remove();
                node.append(
                    $('<div class="content error">').append(
                        $('<div>').text(gt('An error occurred.')),
                        $('<div class="italic">').text(_.isString(e.error) ? e.error : ''),
                        $('<br>'),
                        $('<a class="solution">').text(gt('Click to try again.')).on('click', function () {
                            node.find('.decoration').addClass('pending');
                            loadAndPreview(point, node, baton);
                        })
                    )
                );
                point.invoke('error', node, e, baton);
                decoration.removeClass('pending');
            });
    }

    app.drawWidget = function (model, index) {

        var node = model.node,
            load = _.device('small') ? (node.offset().top < scrollPos) : true;

        if (!model.drawn && load) {

            model.drawn = true;
            index = index || 0;

            if (model.get('enabled') === true && !widgets.visible(model.get('type'))) {
                // hide due to missing capabilites
                node.hide();
                return;
            }

            // set/update title
            var baton = ext.Baton({ model: model, point: 'io.ox/portal/widget/' + model.get('type') }),
                point = ext.point(baton.point),
                title = widgets.getTitle(model.toJSON(), point.prop('title')),
                $title = node.find('h2 .title').text(_.noI18n(title)),
                requiresSetUp = point.invoke('requiresSetUp').reduce(reduceBool, true).value();
            // remember
            model.set('baton', baton, { validate: true, silent: true });
            node.attr('aria-label', title);
            node.find('a.disable-widget').attr({
                'aria-label': title + ', ' + gt('Disable widget'),
            });
            // setup?
            if (requiresSetUp) {
                node.find('.decoration').removeClass('pending');
                app.drawDefaultSetup(baton);
            } else {
                // add link?
                if (point.prop('action') !== undefined) {
                    $title.addClass('action-link').css('cursor', 'pointer').on('click', { baton: baton }, runAction);
                }
                // simple delay approach
                _.delay(function () {
                    // initialize first
                    point.invoke('initialize', node, baton);
                    // load & preview
                    node.busy();
                    loadAndPreview(point, node, baton).done(function () {
                        node.removeAttr('style');
                    }).always(function () {
                        node.idle();
                    });
                }, (index / 2 >> 0) * 100);
            }
        }
    };

    app.refreshWidget = function (model, index) {

        if (model.drawn) {

            index = index || 0;

            var node = model.node,
                delay = (index / 2 >> 0) * 1000,
                baton = model.get('baton'),
                point = ext.point(baton.point);

            _.defer(function () {
                _.delay(function () {
                    node.find('.decoration').addClass('pending');
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
            chromeless: true,
            simple: _.device('smartphone')
        }));

        win.nodes.main.addClass('io-ox-portal f6-target').attr({
            'tabindex': '1',
            'role': 'main',
            'aria-label': gt('Portal Widgets')
        });

        ext.point('io.ox/portal/sections').invoke('draw', win.nodes.main, appBaton);

        app.updateTitle();
        _.tick(1, 'hour', app.updateTitle);

        win.show(function () {
            // draw scaffolds now for responsiveness
            collection.each(function (model) {
                app.drawScaffold(model, false);
            });

            widgets.loadUsedPlugins().done(function (cleanCollection) {
                cleanCollection.each(app.drawWidget);
            });

            // add side popup
            sidepopup.delegate(appBaton.$.widgets, '.item, .content.pointer, .action.pointer', openSidePopup);

            // react on 'remove'
            win.nodes.main.on('click', '.disable-widget', function (e) {
                e.preventDefault();
                var id = $(this).closest('.widget').attr('data-widget-id'),
                    model = widgets.getModel(id);
                if (model) {
                    // do we have custom data that might be lost?
                    if (!_.isEmpty(model.get('props'))) {
                        var dialog = new dialogs.ModalDialog()
                        .header($('<h4>').text(gt('Delete widget')))
                        .append($('<span>').text(gt('Do you really want to delete this widget?')))
                        .addPrimaryButton('delete',
                            //#. Really delete portal widget - in contrast to "just disable"
                            gt('Delete'), 'delete', {tabIndex: '1'}
                        )
                        .addButton('cancel', gt('Cancel'), 'cancel', {tabIndex: '1'});
                        if (model.get('enabled')) {
                            dialog.addAlternativeButton('disable',
                                //#. Just disable portal widget - in contrast to delete
                                gt('Just disable widget'), 'disable', {tabIndex: '1'}
                            );
                        }
                        dialog.show().done(function (action) {
                            if (action === 'delete') {
                                model.collection.remove(model);
                            } else if (action === 'disable') {
                                model.set('enabled', false, { validate: true });
                            }
                        });
                    } else {
                        model.collection.remove(model);
                    }
                }
            });

            // add -webkit-overflow-scroll only for iOS to enable momentum scroll
            // (will cause errors on android chrome)
            // TODO: avoid device specific inline css fixes
            if (_.browser.iOS) {
                win.nodes.main.css('-webkit-overflow-scrolling', 'touch');
            }

            // enable position fixed toolbar on mobile. This will keep the lazy loading for
            // portal apps with a fixed position toolbar
            if (_.device('smartphone')) {
                app.getWindow().on('hide', function () {
                    $('#io-ox-topbar').removeClass('toolbar-fixed-position');
                    app.getWindow().nodes.outer.removeClass('content-v-shift');
                }).on('show', function () {
                    $('#io-ox-topbar').addClass('toolbar-fixed-position');
                    app.getWindow().nodes.outer.addClass('content-v-shift');
                });
            }

            // make sortable, but not for Touch devices
            if (!Modernizr.touch) {
                require(['apps/io.ox/core/tk/jquery-ui.min.js']).done(function () {
                    appBaton.$.widgets.sortable({
                        items: '> li.draggable',
                        cancel: 'li.protected',
                        containment: win.nodes.main,
                        scroll: true,
                        delay: 150,
                        update: function () {
                            widgets.save(appBaton.$.widgets);
                        }
                    });
                });
            }
        });

        var lazyLayout = _.debounce(function () {
            scrollPos = $(this).scrollTop() + this.innerHeight;
            widgets.loadUsedPlugins().done(function (cleanCollection) {
                cleanCollection.each(app.drawWidget);
            });
        }, 300);

        $(window).on('scrollstop resize', lazyLayout);
    });

    return {
        getApp: app.getInstance
    };
});
