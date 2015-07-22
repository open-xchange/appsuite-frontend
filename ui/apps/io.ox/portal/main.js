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

define('io.ox/portal/main', [
    'io.ox/core/extensions',
    'io.ox/core/api/user',
    'io.ox/contacts/api',
    'io.ox/core/tk/dialogs',
    'io.ox/portal/widgets',
    'io.ox/portal/util',
    'io.ox/portal/settings/pane',
    'gettext!io.ox/portal',
    'settings!io.ox/portal',
    'less!io.ox/portal/style'
], function (ext, userAPI, contactAPI, dialogs, widgets, util, settingsPane, gt, settings) {

    'use strict';

    var widgetsWithFirstVisit = ['mail', 'calendar', 'tasks', 'myfiles'],
        firstVisitGreeting = {
            //#. Default greeting for portal widget
            mail:     gt('Welcome to your inbox'),
            //#. Default greeting for portal widget
            calendar: gt('Welcome to your calendar'),
            //#. Default greeting for portal widget
            tasks:    gt('Welcome to your tasks'),
            //#. Default greeting for portal widget
            myfiles:  gt('Welcome to your files')
        },
        hadData = settings.get('settings/hadData') || [];

    function isFirstVisitWidget(type, baton) {

        function hasDataShown(type) {
            return _.contains(hadData, type) ? true : false;
        }

        function containsData(type) {
            var tasks;
            if (type === 'tasks') {
                tasks = _(baton.data).filter(function (task) {
                    return task.end_time !== null && task.status !== 3;
                });
                if (_.isEmpty(tasks)) return false;
            }
            if (!_.isEmpty(baton.data)) return true;
        }

        // URL is mandatory; return false if it's missing
        if (!settings.get('settings/getStartedLink')) return false;

        if (_.contains(widgetsWithFirstVisit, type)) {
            if (containsData(type)) {
                if (!hasDataShown(type)) hadData.push(type);
                settings.set('settings/hadData', hadData).save();
                return false;
            } else if (!containsData(type)) {
                if (hasDataShown(type)) {
                    // reset for debugging
                    // settings.set('settings/hadData', []).save();
                    return false;
                } else {
                    return true;
                }
            }
        } else {
            return false;
        }
    }

    // time-based greeting phrase
    function getGreetingPhrase(name) {
        var hour = moment().hour();
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
        var options = { id: app.get('name') };
        ox.launch('io.ox/settings/main', options).done(function () {
            this.setSettingsPane(options);
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

            if (_.device('!smartphone')) {
                widgets.loadAllPlugins().done(function () {
                    // add widgets
                    ext.point('io.ox/portal/settings/detail/pane').map(function (point) {
                        if (point && point.id === 'add') {
                            point.invoke('draw', $btn);
                        }
                    });
                    // please no button
                    $btn.find('.btn-group-portal').after($greeting);
                    $btn.find('.btn-group-portal')
                        .prepend($('<button type="button" class="btn btn-primary">')
                        .attr({
                            'data-action': 'customize',
                            tabindex: 1
                        })
                        .text(gt('Customize this page'))
                        .on('click', openSettings));
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

    // widget container
    ext.point('io.ox/portal/sections').extend({
        id: 'metrics',
        index: 300,
        draw: function () {
            var self = this;
            // TODO: check for metric capability
            require(['io.ox/metrics/main'], function (metrics) {
                // track click on concrete dropdown entry to add a widget
                self.delegate('.io-ox-portal-settings-dropdown', 'mousedown', function (e) {
                    metrics.trackEvent({
                        app: 'portal',
                        target: 'toolbar',
                        type: 'click',
                        action: 'add',
                        detail: $(e.target).attr('data-type')
                    });
                });
                // track click on concrete widget
                self.delegate('ol.widgets > .widget', 'mousedown', function (e) {
                    metrics.trackEvent({
                        app: 'portal',
                        target: 'widgets',
                        type: 'click',
                        action: 'show-detail',
                        detail: $(e.target).closest('.widget').attr('data-widget-type')
                    });
                });
                // track removing of concret widget
                self.delegate('ol.widgets .disable-widget', 'mousedown', function (e) {
                    metrics.trackEvent({
                        app: 'portal',
                        target: 'widget',
                        type: 'click',
                        action: 'disable',
                        detail: $(e.target).closest('.widget').attr('data-widget-type')
                    });
                });
                // track reordering of widgets
                widgets.getCollection().on('order-changed', function (type) {
                    metrics.trackEvent({
                        app: 'portal',
                        target: 'widget',
                        type: 'click',
                        action: 'change-order',
                        detail: type
                    });
                });

            });
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
            var draggable = baton.model.get('draggable');
            if (_.isUndefined(draggable) || _.isNull(draggable)) {
                draggable = true;
            }
            this.addClass('widget' + (baton.model.get('inverse') ? ' inverse' : ''))
                .addClass(draggable ? ' draggable' : ' protected');
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
                            $('<a class="disable-widget"><i class="fa fa-times icon-remove"/></a>')
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
        sidepopup = new dialogs.SidePopup({ tabTrap: true }),
        collection = widgets.getCollection();

    app.settings = settings;

    collection
        .on('remove', function (model) {
            // remove DOM node
            appBaton.$.widgets.find('[data-widget-cid="' + model.cid + '"]').remove();
            // clean up
            if (model.has('baton')) {
                delete model.get('baton').model;
                model.set('baton', null, { validate: true });
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
            } else if ('title' in model.changed) {
                //change name
                app.getWidgetNode(model).find('.title').text(model.get('title'));
            } else if (this.wasElementDeleted(model)) {
                // element was removed, no need to refresh it.
                return;
            } else if ('unset' in e && 'candidate' in model.changed && model.drawn) {
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
        if (add) {
            var lastProtected = appBaton.$.widgets.find('li.protected').last();
            if (lastProtected.length) {
                lastProtected.after(node);
            } else {
                appBaton.$.widgets.prepend(node);
            }
        } else {
            appBaton.$.widgets.append(node);
        }
    };

    app.getWidgetNode = function (model) {
        return appBaton.$.widgets.find('[data-widget-cid="' + model.cid + '"]');
    };

    function setup(e) {
        e.preventDefault();
        var baton = e.data.baton;
        ext.point(baton.point).invoke('performSetUp', null, baton);
    }

    app.drawFirstVisitPane = function (type, baton) {

        var greeting = firstVisitGreeting[type] || '',
            link = settings.get('settings/getStartedLink') || '#';

        baton.model.node.append(
            $('<div class="content">').append(
                // text
                $('<div>').append(
                    $('<span class="bold">').text(ox.serverConfig.productName + '. '),
                    $.txt(greeting + '.')
                ),
                // link
                $('<a href="#" tabindex="1" target="_blank" style="white-space: nowrap;" role="button">')
                .attr('href', link)
                .text(gt('Get started here') + '!')
            )
        );
    };

    app.drawDefaultSetup = function (baton) {

        var data = baton.model.toJSON(),
            point = ext.point(baton.point),
            title = widgets.getTitle(data, point.prop('title')),
            node = baton.model.node;

        node.append(
            $('<div class="content">').append(
                // text
                $('<div class="paragraph" style="min-height: 40px">').append(
                    $.txt(
                        //#. %1$s is social media name, e.g. Facebook
                        gt('Welcome to %1$s', title) + '!'
                    ),
                    $('<br>'),
                    $.txt(
                        gt('Get started here') + ':'
                    )
                ),
                // button
                $('<a href="#" class="action" tabindex="1" role="button">').text(
                    //#. %1$s is social media name, e.g. Facebook
                    gt('Add your %1$s account', title)
                )
                .on('click', { baton: baton }, setup)
            )
        );

        point.invoke('drawDefaultSetup', node, baton);
    };

    function ensureDeferreds(ret) {
        return ret && ret.promise ? ret : $.when();
    }

    function reduceBool(memo, bool) {
        return memo || bool;
    }

    function runAction(e) {
        ext.point(e.data.baton.point).invoke('action', $(this).closest('.widget'), e.data.baton);
    }

    function loadAndPreview(point, node, baton) {
        var defs = point.invoke('load', node, baton).map(ensureDeferreds).value(),
            decoration = node.find('.decoration');
        return $.when.apply($, defs).then(
            function success() {
                var widgetType = _.last(baton.point.split('/'));
                node.find('.content').remove();
                // draw summary only on smartphones (please adjust settings pane when adjusting this check)
                if (_.device('smartphone') && settings.get('mobile/summaryView')) {
                    if (point.all()[0].summary) {
                        //invoke special summary if there is one
                        point.invoke('summary', node, baton);
                    } else if (!node.hasClass('generic-summary')) {
                        //add generic open close if it's not added yet
                        node.addClass('with-summary show-summary generic-summary');
                        node.on('tap', 'h2', function (e) {
                            $(e.delegateTarget).toggleClass('show-summary generic-summary');
                        });
                    }
                }

                if (isFirstVisitWidget(widgetType, baton)) {
                    app.drawFirstVisitPane(widgetType, baton);
                } else {
                    point.invoke('preview', node, baton);
                }
                node.removeClass('error-occurred');
                decoration.removeClass('pending error-occurred');
            },
            function fail(e) {
                // special return value?
                if (e === 'remove') {
                    widgets.remove(baton.model);
                    node.remove();
                    return;
                }
                // clean up
                node.find('.content').remove();
                decoration.removeClass('pending');
                // show error message unless it's just missing oauth account
                if (e.code !== 'OAUTH-0006') {
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
                } else {
                    // missing oAuth account
                    app.drawDefaultSetup(baton);
                }
            }
        );
    }

    app.drawWidget = function (model, index) {

        var node = model.node,
            load = _.device('smartphone') ? (node.offset().top < scrollPos) : true;

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
                requiresSetUp = point.invoke('requiresSetUp').reduce(reduceBool, false).value();
            // remember
            model.set('baton', baton, { validate: true, silent: true });
            node.attr('aria-label', title);
            node.find('a.disable-widget').attr({
                'aria-label': title + ', ' + gt('Disable widget')
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

        if (!model.drawn) return;

        index = index || 0;

        var node = model.node,
            delay = (index / 2 >> 0) * 1000,
            baton = model.get('baton'),
            point = ext.point(baton.point);

        _.defer(function () {
            _.delay(function () {
                node.find('.decoration').addClass('pending');
                // CSS Transition delay 0.3s
                _.delay(function () {
                    loadAndPreview(point, node, baton);
                    node = baton = point = null;
                }, 300);
            }, delay);
        });
    };

    // can be called every 30 seconds
    app.refresh = _.throttle(function () {
        widgets.getEnabled().each(app.refreshWidget);
    }, 30000);

    ox.on('refresh^', function () {
        app.refresh();
    });

    app.getContextualHelp = function () {
        return 'ox.appsuite.user.sect.portal.gui.html#ox.appsuite.user.sect.portal.gui';
    };

    // launcher
    app.setLauncher(function () {

        // get window
        app.setWindow(win = ox.ui.createWindow({
            name: 'io.ox/portal',
            chromeless: true,
            simple: _.device('smartphone')
        }));

        win.nodes.main.addClass('io-ox-portal f6-target').attr({
            'tabindex': '1'
        });

        win.setTitle(gt('Portal'));

        ext.point('io.ox/portal/sections').invoke('draw', win.nodes.main, appBaton);

        app.updateTitle();
        _.tick(1, 'hour', app.updateTitle);
        //change name if username changes
        userAPI.get(ox.user_id).done(function (userData) {
            contactAPI.on('update:' + _.ecid({ folder_id: userData.folder_id, id: userData.contact_id }), app.updateTitle);
        });

        win.show(function () {
            // draw scaffolds now for responsiveness
            collection.each(function (model) {
                app.drawScaffold(model, false);
            });

            widgets.loadUsedPlugins().done(function (cleanCollection) {
                cleanCollection.each(app.drawWidget);
                ox.trigger('portal:items:render');
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
                            gt('Delete'), 'delete', { tabIndex: 1 }
                        )
                        .addButton('cancel', gt('Cancel'), 'cancel', { tabIndex: 1 });
                        if (model.get('enabled')) {
                            dialog.addAlternativeButton('disable',
                                //#. Just disable portal widget - in contrast to delete
                                gt('Just disable widget'), 'disable', { tabIndex: 1 }
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
                require(['static/3rd.party/jquery-ui.min.js']).done(function () {
                    appBaton.$.widgets.sortable({
                        cancel: 'li.protected',
                        containment: win.nodes.main,
                        delay: 150,
                        items: '> li.draggable:visible',
                        scroll: true,
                        // default 'intersect' by 50%
                        tolerance: 'pointer',
                        update: function () {
                            widgets.getCollection().trigger('order-changed', 'portal');
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
