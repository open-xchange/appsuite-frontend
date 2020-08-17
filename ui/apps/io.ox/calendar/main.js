/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/calendar/main', [
    'io.ox/core/commons',
    'io.ox/core/extensions',
    'io.ox/core/capabilities',
    'io.ox/core/folder/api',
    'io.ox/core/folder/tree',
    'io.ox/core/folder/view',
    'io.ox/backbone/views/datepicker',
    'settings!io.ox/calendar',
    'gettext!io.ox/calendar',
    'io.ox/core/tk/list-control',
    'io.ox/calendar/list/listview',
    'io.ox/core/toolbars-mobile',
    'io.ox/core/page-controller',
    'io.ox/calendar/api',
    'io.ox/calendar/folder-select-support',
    'io.ox/calendar/mobile-navbar-extensions',
    'io.ox/calendar/mobile-toolbar-actions',
    'io.ox/calendar/toolbar',
    'io.ox/calendar/actions',
    'less!io.ox/calendar/style',
    'io.ox/calendar/week/view'
], function (commons, ext, capabilities, folderAPI, TreeView, FolderView, DatePicker, settings, gt, ListViewControl, CalendarListView, Bars, PageController, api, addFolderSelectSupport) {

    'use strict';

    // application object
    var app = ox.ui.createApp({
            name: 'io.ox/calendar',
            id: 'io.ox/calendar',
            title: 'Calendar'
        }), win;

    app.mediator({

        /*
         * Init pages for mobile use
         * Each View will get a single page with own
         * toolbars and navbars. A PageController instance
         * will handle the page changes and also maintain
         * the state of the toolbars and navbars
         */
        'pages-mobile': function (app) {
            if (_.device('!smartphone')) return;
            var win = app.getWindow(),
                navbar = $('<div class="mobile-navbar">'),
                toolbar = $('<div class="mobile-toolbar">')
                    .on('hide', function () { win.nodes.body.removeClass('mobile-toolbar-visible'); })
                    .on('show', function () { win.nodes.body.addClass('mobile-toolbar-visible'); }),
                baton = ext.Baton({ app: app });

            app.navbar = navbar;
            app.toolbar = toolbar;
            app.pages = new PageController({ appname: app.options.name, toolbar: toolbar, navbar: navbar, container: win.nodes.main });

            win.nodes.body.addClass('classic-toolbar-visible').append(navbar, toolbar);

            // create empty startup page
            // such that the first change:page will always trigger a real page change with view initialization
            app.pages.addPage({
                name: 'start',
                startPage: true
            });

            app.pages.addPage({
                name: 'folderTree',
                navbar: new Bars.NavbarView({
                    baton: baton,
                    extension: 'io.ox/calendar/mobile/navbarFoldertree'
                })
            });

            // create 3 pages with toolbars and navbars
            app.pages.addPage({
                name: 'month',
                navbar: new Bars.NavbarView({
                    baton: baton,
                    extension: 'io.ox/calendar/mobile/navbar'
                }),
                toolbar: new Bars.ToolbarView({
                    baton: baton,
                    page: 'month',
                    extension: 'io.ox/calendar/mobile/toolbar'
                })
            });

            app.pages.addPage({
                name: 'week:day',
                navbar: new Bars.NavbarView({
                    baton: baton,
                    extension: 'io.ox/calendar/mobile/navbar'
                }),
                toolbar: new Bars.ToolbarView({
                    baton: baton,
                    page: 'week',
                    extension: 'io.ox/calendar/mobile/toolbar'
                })
            });

            app.pages.addPage({
                name: 'list',
                navbar: new Bars.NavbarView({
                    baton: baton,
                    extension: 'io.ox/calendar/mobile/navbar'
                }),
                toolbar: new Bars.ToolbarView({
                    baton: baton,
                    page: 'list',
                    extension: 'io.ox/calendar/mobile/toolbar'
                }),
                secondaryToolbar: new Bars.ToolbarView({
                    baton: baton,
                    page: 'list/multiselect',
                    extension: 'io.ox/calendar/mobile/toolbar'
                })
            });

            app.pages.addPage({
                name: 'detailView',
                navbar: new Bars.NavbarView({
                    baton: baton,
                    extension: 'io.ox/calendar/mobile/navbar'
                }),
                toolbar: new Bars.ToolbarView({
                    baton: baton,
                    page: 'detailView',
                    extension: 'io.ox/calendar/mobile/toolbar'

                })
            });

            // important
            // tell page controller about special navigation rules
            app.pages.setBackbuttonRules({
                'month': 'folderTree',
                'week:day': 'month',
                'list': 'folderTree'
            });
        },
        /*
         * Pagecontroller
         */
        'pages-desktop': function (app) {
            if (_.device('smartphone')) return;
            var c = app.getWindow().nodes.main;

            app.pages = new PageController({ appname: app.options.name });

            // create empty startup page
            // such that the first change:page will always trigger a real page change with view initialization
            app.pages.addPage({
                name: 'start',
                container: c,
                startPage: true
            });

            app.pages.addPage({
                name: 'month',
                container: c
            });

            app.pages.addPage({
                name: 'week:day',
                container: c
            });

            app.pages.addPage({
                name: 'week:workweek',
                container: c
            });

            app.pages.addPage({
                name: 'week:week',
                container: c
            });

            app.pages.addPage({
                name: 'list',
                container: c
            });

            app.pages.addPage({
                name: 'listView',
                classes: 'leftside'
            });

            app.pages.addPage({
                name: 'detailView',
                classes: 'rightside'
            });

            app.pages.addPage({
                name: 'year',
                container: c
            });

        },

        'subscription': function (app) {
            app.subscription = {
                wantedOAuthScopes: ['calendar_ro']
            };
        },

        'list-vsplit': function (app) {
            if (_.device('smartphone')) return;
            app.left = app.pages.getPage('listView');
            app.right = app.pages.getPage('detailView');
        },

        'list-vsplit-mobile': function (app) {
            if (_.device('!smartphone')) return;
            app.left = app.pages.getPage('list');
            app.right = app.pages.getPage('detailView');
        },

        /*
         * Init all nav- and toolbar labels for mobile
         */
        'navbars-mobile': function (app) {

            if (_.device('!smartphone')) return;

            app.pages.getNavbar('month')
                .on('leftAction', function () {
                    app.pages.goBack();
                })
                .setLeft(gt('Calendars'));

            app.pages.getNavbar('week:day')
                .on('leftAction', function () {
                    app.pages.changePage('month', { animation: 'slideright' });
                })
                .setLeft(gt('Back'));

            app.pages.getNavbar('list')
                .on('leftAction', function () {
                    app.pages.goBack();
                })
                .setLeft(gt('Folders'))
                .setRight(
                    //#. Used as a button label to enter the "edit mode"
                    gt('Edit')
                );

            app.pages.getNavbar('folderTree')
                .setTitle(gt('Folders'))
                .setLeft(gt('Edit'))
                .setRight(gt('Back'));

            app.pages.getNavbar('detailView')
                .setTitle('')
                .setLeft(
                    //#. Used as button label for a navigation action, like the browser back button
                    gt('Back')
                );

            app.pages.getNavbar('detailView').on('leftAction', function () {
                app.pages.goBack();
            });

            // checkbox toggle
            app.pages.getNavbar('list').on('rightAction', function () {
                if (app.props.get('checkboxes') === true) {
                    // leave multiselect? -> clear selection
                    app.listView.selection.clear();
                    app.pages.getNavbar('list').setRight(gt('Edit')).show('.left');
                } else {
                    app.pages.getNavbar('list').setRight(gt('Cancel')).hide('.left');
                }
                app.props.set('checkboxes', !app.props.get('checkboxes'));
                app.listView.toggleCheckboxes(app.props.get('checkboxes'));
                app.listControl.$el.toggleClass('toolbar-top-visible', app.props.get('checkboxes'));
            });
        },

        //
        // Mini calendar
        //
        'mini-calendar': function (app) {

            ext.point('io.ox/calendar/sidepanel').extend({
                id: 'mini-calendar',
                index: 50,
                draw: function () {

                    if (_.device('smartphone')) return;
                    var layoutRanges = { 'week:workweek': 'week', 'week:week': 'week', 'month': 'month', 'year': 'year' };

                    new DatePicker({ parent: this.closest('#io-ox-core'), showTodayButton: false })
                        .on('select', function (date) {
                            app.setDate(date, { propagate: false });
                            this.setDate(date, true);
                        })
                        .listenTo(app.props, 'change:date', function (model, value) {
                            // check if the layout supports ranges (week, month year). If the new date is still within that range, we don't need to change the mini calendar
                            // those layous set it always to the first day within their specific range and would overwrite the selection of the user, see(bug 57223)
                            var unit = layoutRanges[app.props.get('layout')];
                            if (unit && moment(value).startOf(unit).valueOf() === moment(this.getDate()).startOf(unit).valueOf()) return;

                            this.setDate(value, true);
                        })
                        .listenTo(app.props, 'change:showMiniCalendar', function (model, value) {
                            this.$el.toggle(!!value);
                        })
                        .render().$el
                        .toggle(app.props.get('showMiniCalendar'))
                        .appendTo(this);
                }
            });
        },

        /*
         * Folder view support
         */
        'folder-view': function (app) {
            if (_.device('smartphone')) return;

            app.treeView = new TreeView({ app: app, contextmenu: true, flat: true, indent: false, module: 'calendar', dblclick: true });
            FolderView.initialize({ app: app, tree: app.treeView });
            app.folderView.resize.enable();
            app.folderView.tree.$el.attr('aria-label', gt('Calendars'));
        },

        'folder-view-mobile': function (app) {
            if (_.device('!smartphone')) return;

            var nav = app.pages.getNavbar('folderTree'),
                page = app.pages.getPage('folderTree');

            nav.on('leftAction', function () {
                app.toggleFolders();
            });

            nav.on('rightAction', function () {
                app.pages.changePage('month', { animation: 'slideleft' });

            });

            var tree = new TreeView({
                app: app,
                contextmenu: true,
                flat: true,
                indent: false,
                module: 'calendar'
            });
            // initialize folder view
            FolderView.initialize({ app: app, tree: tree, firstResponder: false });
            page.append(tree.render().$el);
            app.treeView = tree;
        },

        'folder-create': function (app) {
            folderAPI.on('create', function (folder) {
                if (folder.module !== 'calendar') return;
                app.folders.add(folder.id);
                app.folder.set(folder.id);
            });
        },

        'folder-remove': function (app) {
            folderAPI.on('hide remove', function (id) {
                app.folders.remove(id);
            });
            api.on('all:fail', function (id) {
                app.folders.remove(id, { silent: true });
                folderAPI.refresh();
            });
        },

        'multi-folder-selection': function (app) {
            addFolderSelectSupport(app);
            app.on('folder:change', function () {
                app.folders.reset();
            });
            app.folderView.tree.on('dblclick', function (e, folder) {
                if (!folder) return;
                if ($(e.target).hasClass('color-label')) return;
                if (folderAPI.isVirtual(folder)) return;
                app.folder.set(folder);
                if (app.folders.isSingleSelection()) app.folders.reset();
                else app.folders.setOnly(folder);
            });
        },

        'toggle-folder-view': function (app) {
            commons.addFolderViewToggle(app);
        },

        'account-errors': function (app) {
            var accountError;
            app.treeView.on('click:account-error', function (folder) {
                accountError = folder['com.openexchange.calendar.accountError'];
                if (!accountError) return;

                require(['io.ox/backbone/views/modal', 'io.ox/core/notifications'], function (ModalDialog, notifications) {
                    var requiresAccountUpdate = /(OAUTH-0013)/.test(accountError.code);
                    new ModalDialog({
                        point: 'io.ox/calendar/account-errors',
                        title: gt('Calendar account error')
                    })
                    .extend({
                        default: function () {
                            this.$body.append(
                                $('<div class="info-text">')
                                    .css('word-break', 'break-word')
                                    .text(accountError.error)
                            );
                        }
                    })
                    .addCancelButton()
                    .addButton(requiresAccountUpdate ?
                        { label: gt('Edit accounts'), action: 'accounts', className: 'btn-primary' } :
                        { label: gt('Try again'), action: 'retry', className: 'btn-primary' }
                    )
                    .on('retry', function () {
                        notifications.yell('warning', gt('Refreshing calendar might take some time...'));
                        api.refreshCalendar(folder.id).then(function () {
                            notifications.yell('success', gt('Successfully refreshed calendar'));
                        }, notifications.yell).always(function () {
                            folderAPI.pool.unfetch(folder.id);
                            folderAPI.refresh();
                        });
                    })
                    .on('accounts', function () {
                        var options = { id: 'io.ox/settings/accounts' };
                        ox.launch('io.ox/settings/main', options).done(function () {
                            this.setSettingsPane(options);
                        });
                    })
                    .open();
                });
            });
        },

        'views': function (app) {
            var list = ['week:day', 'month', 'list'],
                defaultPage = _.device('smartphone') ? 'week:day' : 'week:workweek',
                views = {},
                deepLink = _.url.hash('id');
            if (_.device('!smartphone')) list.push('week:workweek', 'week:week', 'year');
            list.forEach(function (item) {
                var node = app.pages.getPage(item);
                node.one('pagebeforeshow', function () {
                    var split = item.split(':'),
                        view = split[0] || 'week',
                        mode = split[1] || (_.device('smartphone') ? 'day' : 'workweek');

                    require(['io.ox/calendar/' + view + '/view']).then(function success(View) {
                        var view = new View({ mode: mode, app: app, deepLink: deepLink });
                        // reset, because we only want a deepLink to happen once opening the app
                        deepLink = null;
                        node.append(view.$el);
                        view.render();
                        app.getWindow().trigger('change:perspective', view);
                        app.perspective = views[item] = view;
                        // finally store the layout. will not change anything if already selected
                        app.props.set('layout', item);
                    }, function fail() {
                        if (item !== defaultPage) return app.pages.changePage(defaultPage);
                    });
                });
                node.on('pagebeforeshow', function () {
                    _.url.hash('perspective', item);
                    if (!views[item]) return;
                    views[item].trigger('show');
                    app.perspective = views[item];
                    // trigger change perspective so toolbar is redrawn (no more lost today button)
                    app.getWindow().trigger('change:perspective', views[item]);
                    if (_.device('!smartphone')) settings.set('viewView', item);
                });
                node.on('pageshow', function () {
                    // update the indicator arrows after the page is visible, otherwise we get wrong calculations
                    if (!app || !app.perspective || !app.perspective.appointmentView || !app.perspective.appointmentView.updateHiddenIndicators) return;
                    app.perspective.appointmentView.updateHiddenIndicators();
                });
            });
        },

        'listview': function (app) {
            app.listView = new CalendarListView({ app: app, draggable: false, pagination: false, labels: true, ignoreFocus: true, noPullToRefresh: true });
            app.listView.model.set({ view: 'list' }, { silent: true });
            // for debugging
            if (!window.list) window.list = app.listView;
        },

        'list-view-control': function (app) {
            app.listControl = new ListViewControl({ id: 'io.ox/chronos', listView: app.listView, app: app });
            app.left.append(
                app.listControl.render().$el
                    .attr('aria-label', gt('Appointments'))
                    .find('.toolbar')
                    //#. toolbar with 'select all' and 'sort by'
                    .attr('aria-label', gt('Appointment options'))
                    .end()
            );
            // make resizable
            app.listControl.resizable();
        },

        'premium-area': function (app) {

            ext.point('io.ox/calendar/sidepanel').extend({
                id: 'premium-area',
                index: 10000,
                draw: function () {
                    this.append(
                        commons.addPremiumFeatures(app, {
                            append: false,
                            upsellId: 'folderview/calendar/bottom',
                            upsellRequires: 'caldav'
                        })
                    );
                }
            });
        },

        'toggle-folder-editmode': function (app) {

            if (_.device('!smartphone')) return;

            var toggle =  function () {
                var page = app.pages.getPage('folderTree'),
                    state = app.props.get('mobileFolderSelectMode'),
                    left = state ? gt('Edit') : gt('Cancel');
                app.props.set('mobileFolderSelectMode', !state);
                app.pages.getNavbar('folderTree').setLeft(left);
                app.pages.getNavbar('folderTree').$el.find('.right').toggle(!!state);
                page.toggleClass('mobile-edit-mode', !state);
            };

            app.toggleFolders = toggle;
        },

        /*
         * Default application properties
         */
        'props': function (app) {

            var view = _.device('!smartphone') ? settings.get('viewView') : undefined;
            if (!view) view = 'week:week';

            // introduce shared properties
            app.props = new Backbone.Model({
                'date': moment().valueOf(),
                'layout': view,
                'checkboxes': _.device('smartphone') ? false : app.settings.get('showCheckboxes', false),
                'mobileFolderSelectMode': false,
                'showMiniCalendar': app.settings.get('showMiniCalendar', true),
                'showMonthviewWeekend': app.settings.get('showMonthviewWeekend', true)
            });

            // convenience functions
            app.getDate = function () {
                return moment(app.props.get('date'));
            };

            app.setDate = function (newDate, opt) {
                // try to keep month and year if possible
                if (!_.isArray(newDate._i)) return app.props.set('date', moment(newDate).valueOf(), opt);
                var oldDate = this.getDate(),
                    initArgs = newDate._i,
                    year = initArgs.length > 0 ? initArgs[0] : oldDate.year(),
                    month = initArgs.length > 1 ? initArgs[1] : oldDate.month(),
                    day = initArgs.length > 2 ? initArgs[2] : oldDate.date();
                // don't try to select dates that don't exist
                if (_.isNaN(moment([year, month, day]).valueOf())) day = 1;
                app.props.set('date', moment([year, month, day]).valueOf(), opt);
            };
        },

        'listview-checkboxes': function (app) {
            if (_.device('smartphone')) app.listControl.$el.toggleClass('toolbar-top-visible', app.props.get('checkboxes'));
            else app.listControl.$('.select-all').toggle(app.props.get('checkboxes'));
            app.listView.toggleCheckboxes(app.props.get('checkboxes'));
        },

        /*
         * Set folderview property
         */
        'prop-folderview': function (app) {
            if (_.device('smartphone')) return;
            app.props.set('folderview', app.settings.get('folderview/visible/' + _.display(), true));
        },

        /*
         * Set folderview property
         */
        'prop-folderview-mobile': function (app) {
            if (_.device('!smartphone')) return;
            app.props.set('folderview', false);
        },

        /*
         * Store view options
         */
        'store-view-options': function (app) {
            if (_.device('smartphone')) return;
            app.props.on('change', _.debounce(function (model, options) {
                if (!options || options.fluent || app.props.get('find-result')) return;
                var data = app.props.toJSON();
                app.settings
                    .set('viewView', _.device('smartphone') ? app.settings.get('viewView') : data.layout)
                    .set('showCheckboxes', data.checkboxes)
                    .set('showMiniCalendar', data.showMiniCalendar)
                    .set('showMonthviewWeekend', data.showMonthviewWeekend)
                    .save();
            }, 500));
        },

        /*
         * Respond to folder view changes
         */
        'change:folderview': function (app) {
            if (_.device('smartphone')) return;
            app.props.on('change:folderview', function (model, value) {
                app.folderView.toggle(value);
            });
            app.on('folderview:close', function () {
                app.props.set('folderview', false);
            });
            app.on('folderview:open', function () {
                app.props.set('folderview', true);
            });
        },

        /*
         * Respond to change:checkboxes
         */
        'change:checkboxes': function (app) {
            if (_.device('smartphone')) return;
            function toggleTopbar(value) {
                app.listControl.$el.toggleClass('toolbar-top-visible', value);
            }
            app.props.on('change:checkboxes', function (model, value) {
                app.listView.toggleCheckboxes(value);
                if (value) toggleTopbar(true);
                app.listControl.$('.select-all').toggle('value', function () {
                    if (!value) toggleTopbar(false);
                });
            });
        },

        /*
         * Respond to layout change
         */
        'change:layout': function (app) {
            app.props.on('change:layout', function (model, value) {
                // no animations on desktop
                app.pages.changePage(value, { disableAnimations: true });
            });
        },

        /*
         * change to default folder on no permission or folder not found errors
         */
        'folder-error': function (app) {
            app.folder.handleErrors();
        },

        'create': function (app) {
            api.on('create move', function (event) {
                var folder = folderAPI.pool.getModel(event.folder);
                // do not select public folder if allPublic is selected
                if (app.folders.isSelected('cal://0/allPublic') && folder && folder.is('public')) return;
                if (app.folders.isSingleSelection()) return;
                app.folders.add(event.folder);
                var model = folderAPI.pool.getModel(event.folder);
                model.trigger('change', model);
            });
        },

        /*
         * Handle page change on delete on mobiles
         */
        'delete-mobile': function (app) {
            if (_.device('!smartphone')) return;
            api.on('delete', function () {
                if (app.pages.getCurrentPage().name === 'detailView') {
                    app.pages.goBack();
                }
            });
        },

        // to update the context menu in the foldertree
        'api-events': function (app) {
            api.on('create update delete refresh.all', function () {
                folderAPI.reload(app.folder.get());
            });
        },

        'inplace-find': function (app) {
            if (_.device('smartphone') || !capabilities.has('search')) return;
            if (!app.isFindSupported()) return;
            app.initFind();

            var lastPerspective,
                SEARCH_PERSPECTIVE = 'list';

            ext.point('io.ox/chronos/listview/notification/empty').extend({
                id: 'no-resulsts',
                index: 200,
                draw: function () {
                    if (!lastPerspective) return;
                    this.text(gt('No matching items found.'));
                }
            });

            function registerHandler(model, find) {
                // additional handler: switch to list perspective (and back)
                find.on({
                    'find:query': function () {
                        // switch to supported perspective
                        lastPerspective = lastPerspective || app.props.get('layout') || _.sanitize.option(_.url.hash('perspective'));
                        if (lastPerspective !== SEARCH_PERSPECTIVE) {
                            // fluent option: do not write to user settings
                            app.props.set('layout', SEARCH_PERSPECTIVE, { fluent: true });
                            // cancel search when user changes view
                            app.props.on('change', find.cancel);
                        }
                    },
                    'find:cancel': function () {
                        // switch back to perspective used before
                        var currentPerspective = _.sanitize.option(_.url.hash('perspective')) || app.props.get('layout');
                        if (lastPerspective && lastPerspective !== currentPerspective) {
                            app.props.set('layout', lastPerspective);
                        }
                        // disable
                        app.props.off('change', find.cancel);
                        // reset
                        lastPerspective = undefined;
                    }
                });
            }

            return app.get('find') ? registerHandler(app, app.get('find')) : app.once('change:find', registerHandler);
        },

        /*
         * mobile only
         *
         */
        'show-weekview-mobile': function (app) {
            if (_.device('!smartphone')) return;
            app.pages.getPage('week:day').on('pageshow', function () {
                app.pages.getNavbar('week:day').setLeft(app.getDate().format('MMMM'));
                //app.pages.getPageObject('week').perspective.view.setScrollPos();
            });
        },

        /*
         * Add support for selection:
         */
        'selection-doubleclick': function (app) {
            // detail app does not make sense on small devices
            // they already see appointments in full screen
            if (_.device('smartphone')) return;
            app.listView.on('selection:doubleclick', function (list) {
                if (list.length < 1) return;
                ox.launch('io.ox/calendar/detail/main', { cid: list[0] });
            });
        },

        /*
         * Add support for virtual folder "All my public appointments"
         */
        'virtual-folders': function (app) {
            if (capabilities.has('guest')) return;
            app.folderView.tree.selection.addSelectableVirtualFolder('cal://0/allPublic');
        },


        'contextual-help': function (app) {
            app.getContextualHelp = function () {
                return 'ox.appsuite.user.sect.calendar.gui.html';
            };
        },

        'primary-action': function (app) {

            app.addPrimaryAction({
                point: 'io.ox/calendar/sidepanel',
                label: gt('New appointment'),
                action: 'io.ox/calendar/detail/actions/create',
                toolbar: 'create'
            });
        },

        'top-search': function () {
            if (!$('#io-ox-topsearch').is(':empty')) return;
            $('#io-ox-topsearch').append(
                $('<div class="search-container">').append(
                    $('<input type="search" class="form-control" placeholder="Search calendar">'),
                    $('<i class="fa fa-search">')
                )
            );
        },

        'sidepanel': function (app) {

            ext.point('io.ox/calendar/sidepanel').extend({
                id: 'tree',
                index: 100,
                draw: function (baton) {
                    if (_.device('smartphone')) return;
                    // render tree and add to DOM
                    this.append(baton.app.treeView.$el);
                }
            });

            var node = app.getWindow().nodes.sidepanel;
            ext.point('io.ox/calendar/sidepanel').invoke('draw', node, ext.Baton({ app: app }));
        },

        'metrics': function (app) {

            require(['io.ox/metrics/main'], function (metrics) {
                if (!metrics.isEnabled()) return;

                var nodes = app.getWindow().nodes,
                    sidepanel = nodes.sidepanel;
                // listview toolbar toolbar
                nodes.main.on('mousedown', '.calendar-list-view .toolbar.top a a[data-name], .calendar-list-view .toolbar.top a a[data-action]', function (e) {
                    var node = $(e.currentTarget);
                    var action = node.attr('data-name') || node.attr('data-action');
                    if (!action) return;
                    metrics.trackEvent({
                        app: 'calendar',
                        target: 'list/toolbar',
                        type: 'click',
                        action: action
                    });
                });

                function track(target, node) {
                    node = $(node);
                    var isSelect = !!node.attr('data-name'),
                        action = (node.attr('data-action') || '').replace(/^io\.ox\/calendar\/(detail\/)?/, '');
                    metrics.trackEvent({
                        app: 'calendar',
                        target: target,
                        type: 'click',
                        action: isSelect ? node.attr('data-name') : action,
                        detail: isSelect ? node.attr('data-value') : ''
                    });
                }

                // main toolbar: actions, view dropdown
                nodes.body.on('track', '.classic-toolbar-container', function (e, node) {
                    track('toolbar', node);
                });
                // detail view as sidepopup
                nodes.outer.on('track', '.io-ox-sidepopup', function (e, node) {
                    track('detail/toolbar', node);
                });

                // folder tree action
                _.defer(function () {
                    sidepanel.find('.context-dropdown').on('mousedown', 'a', function (e) {
                        metrics.trackEvent({
                            app: 'calendar',
                            target: 'folder/context-menu',
                            type: 'click',
                            action: $(e.currentTarget).attr('data-action')
                        });
                    });
                });
                sidepanel.find('.bottom').on('mousedown', 'a[data-action]', function (e) {
                    var node = $(e.currentTarget);
                    if (!node.attr('data-action')) return;
                    metrics.trackEvent({
                        app: 'calendar',
                        target: 'folder/toolbar',
                        type: 'click',
                        action: $(e.currentTarget).attr('data-action')
                    });
                });
                // folder permissions action
                sidepanel.find('.folder-tree').on('mousedown', '.folder-shared, .fa.folder-sub', function () {
                    metrics.trackEvent({
                        app: 'calendar',
                        target: 'folder',
                        type: 'click',
                        action: 'permissions'
                    });
                });
                // check for clicks in folder trew
                app.on('folder:change folder-virtual:change', function (folder) {
                    metrics.getFolderFlags(folder)
                        .then(function (list) {
                            metrics.trackEvent({
                                app: 'calendar',
                                target: 'folder',
                                type: 'click',
                                action: 'select',
                                detail: list.join('/')
                            });
                        });
                });
                // selection in listview
                app.listView.on({
                    'selection:change': function (list) {
                        if (!list.length) return;
                        metrics.trackEvent({
                            app: 'calendar',
                            target: 'list',
                            type: 'click',
                            action: 'select',
                            detail: list.length > 1 ? 'multiple' : 'one'
                        });
                    }
                });
                // selection in other perspectives
                app.on('showAppointment', function (e, data, layout) {
                    var target = layout || 'list';
                    metrics.trackEvent({
                        app: 'calendar',
                        target: target,
                        type: 'click',
                        action: 'select',
                        detail: 'one'
                    });
                });
                // double click or mousedown -> mark-time-slot -> mouseup
                app.on('createAppointment openCreateAppointment', function (e, data, layout) {
                    var target = layout || 'list';
                    metrics.trackEvent({
                        app: 'calendar',
                        target: target,
                        type: 'click',
                        action: 'create'
                    });
                });
            });
        }

    });

    function getPerspective(perspective) {
        // check at first, if this is a known perspective
        if (['week:day', 'month', 'list', 'week:workweek', 'week:week', 'year'].indexOf(perspective) < 0) {
            perspective = _.device('smartphone') ? 'week:day' : 'week:workweek';
        }

        if (_.device('smartphone') && _.indexOf(['week:workweek', 'week:week', 'calendar'], perspective) >= 0) {
            perspective = 'week:day';
        } else if (_.device('smartphone') && _.indexOf(['week:day', 'list', 'month'], perspective) < 0) {
            perspective = 'week:day';
        }

        return perspective;
    }

    // launcher
    app.setLauncher(function (options) {

        // get window
        app.setWindow(win = ox.ui.createWindow({
            name: 'io.ox/calendar',
            find: capabilities.has('search'),
            chromeless: true
        }));

        app.settings = settings;

        win.addClass('io-ox-calendar-main');

        // go!
        if (!options.folder && capabilities.has('guest')) {
            // try to select the first shared folder available
            if (folderAPI.getFlatCollection('calendar', 'shared').fetched) {
                addFolderSupport(folderAPI.getFlatCollection('calendar', 'shared').models[0].get('id'));
            } else {
                // shared section wasn't fetched yet. Do it now.
                folderAPI.flat({ module: 'calendar' }).done(function (sections) {
                    addFolderSupport(sections.shared[0]);
                });
            }
        } else {
            addFolderSupport(options.folder);
        }

        function addFolderSupport(folder) {
            folder = folder || folderAPI.getDefaultFolder('calendar');
            commons.addFolderSupport(app, null, 'calendar', folder)
                .always(function () {
                    app.mediate();
                    win.show();
                })
                .fail(function (result) {
                    var message = gt('Application may not work as expected until this problem is solved.');
                    if (result && result.error) message = result.error + ' ' + message;
                    require(['io.ox/core/notifications'], function (notifications) {
                        notifications.yell('error', message);
                    });
                })
                .done(function () {
                    // app perspective
                    var lastPerspective = getPerspective(options.perspective || _.sanitize.option(_.url.hash('perspective')) || app.props.get('layout'));
                    app.pages.changePage(lastPerspective, { disableAnimations: true });
                });
        }
    });

    // set what to do if the app is started again
    // this way we can react to given options, like for example a different folder
    app.setResume(function (options) {
        var ret = $.when();
        // only consider folder option and persepective option
        if (options) {
            var defs = [],
                appNode = this.getWindow();
            appNode.busy();
            if (options.folder && options.folder !== this.folder.get()) {
                defs.push(this.folder.set(options.folder));
            }
            if (options.perspective && options.perspective !== app.props.get('layout')) {
                var perspective = getPerspective(options.perspective);
                if (_.device('smartphone')) defs.push(app.props.set('layout', perspective));
            }
            ret = $.when.apply(this, defs);
            ret.always(function () {
                appNode.idle();
            });
        }
        return ret;
    });

    return {
        getApp: app.getInstance
    };
});
