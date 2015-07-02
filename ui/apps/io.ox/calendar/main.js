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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/calendar/main', [
    'settings!io.ox/core',
    'io.ox/core/commons',
    'io.ox/core/extensions',
    'io.ox/core/capabilities',
    'io.ox/core/folder/api',
    'io.ox/core/folder/tree',
    'io.ox/core/folder/view',
    'settings!io.ox/calendar',
    'gettext!io.ox/calendar',
    'io.ox/core/tk/vgrid',
    'io.ox/core/toolbars-mobile',
    'io.ox/core/page-controller',
    'io.ox/calendar/api',
    'io.ox/calendar/mobile-navbar-extensions',
    'io.ox/calendar/mobile-toolbar-actions',
    'io.ox/calendar/toolbar',
    'io.ox/calendar/actions',
    'less!io.ox/calendar/style'
], function (coreConfig, commons, ext, capabilities, folderAPI, TreeView, FolderView, settings, gt, VGrid, Bars, PageController, api) {

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

            app.pages.addPage({
                name: 'folderTree',
                navbar: new Bars.NavbarView({
                    baton: baton,
                    extension: 'io.ox/calendar/mobile/navbar'
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
                }),
                startPage: true
            });

            app.pages.addPage({
                name: 'week',
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
                'week': 'month',
                'list': 'folderTree'
            });
        },
        /*
         * Pagecontroller
         */
        'pages-desktop': function (app) {
            if (_.device('smartphone')) return;
            var c = app.getWindow().nodes.main;

            app.pages = new PageController(app);

            // create 3 pages with toolbars and navbars
            app.pages.addPage({
                name: 'month',
                container: c,
                startPage: true
            });

            app.pages.addPage({
                name: 'week',
                container: c
            });

            app.pages.addPage({
                name: 'list',
                container: c
            });
        },

        /*
         * Early List view vsplit - we need that to get a Vgrid instance
         * Vsplit compatibilty
         */
        'list-vsplit': function (app) {
            if (_.device('smartphone')) return;
            var vsplit = commons.vsplit($('<div>'), app);
            app.left = vsplit.left;
            app.right = vsplit.right;
        },

        /*
         * Early List view vsplit - we need that to get a Vgrid instance
         * Vsplit compatibilty
         */
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
                .setLeft(gt('Folders'));

            app.pages.getNavbar('week')
                .on('leftAction', function () {
                    ox.ui.Perspective.show(app, 'month', { animation: 'slideright' });
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
                .setLeft(false)
                .setRight(gt('Edit'));

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
                    app.grid.selection.clear();
                    app.grid.showTopbar(false);
                    app.grid.showToolbar(false);
                    app.pages.getNavbar('list').setRight(gt('Edit')).show('.left');
                } else {
                    // also show sorting options
                    app.grid.showTopbar(true);
                    app.grid.showToolbar(true);
                    app.pages.getNavbar('list').setRight(gt('Cancel')).hide('.left');
                }
                app.props.set('checkboxes', !app.props.get('checkboxes'));
            });
        },

        /*
         * VGrid
         */
        'vgrid': function (app) {

            var gridOptions = {
                settings: settings,
                showToggle: _.device('smartphone'),
                hideTopbar: _.device('smartphone'),
                hideToolbar: _.device('smartphone'),
                // if it's shown, it should be on the top
                toolbarPlacement: 'top'
            };

            // show "load more" link
            gridOptions.tail = function () {
                var link = $('<div class="vgrid-cell tail">').append(
                    //#. Label for a button which shows more upcoming
                    //#. appointments in a listview by extending the search
                    //#. by one month in the future
                    $('<a href="#" tabindex="1">').text(gt('Expand timeframe by one month'))
                );
                return link;
            };

            app.grid = new VGrid(app.left, gridOptions);

            app.getGrid = function () {
                return this.grid;
            };

            if (_.device('smartphone')) {
                // remove some stuff from toolbar once
                app.grid.one('meta:update', function () {
                    app.grid.getToolbar().find('.select-all-toggle, .grid-info').hide();
                });
            }
        },

        /*
         * Folder view support
         */
        'folder-view': function (app) {

            // tree view
            var tree = new TreeView({ app: app, contextmenu: true, flat: true, indent: false, module: 'calendar' });

            // initialize folder view
            FolderView.initialize({ app: app, tree: tree });
            app.folderView.resize.enable();
        },

        'toggle-folder-editmode': function (app) {

            if (_.device('!smartphone')) return;

            var toggle =  function () {

                var page = app.pages.getPage('folderTree'),
                    state = app.props.get('mobileFolderSelectMode'),
                    right = state ? gt('Edit') : gt('Cancel');
                app.props.set('mobileFolderSelectMode', !state);
                app.pages.getNavbar('folderTree').setRight(right);
                page.toggleClass('mobile-edit-mode', !state);
            };

            app.toggleFolders = toggle;
        },

        /*
         * Folder view mobile support
         */
        'folder-view-mobile': function (app) {
            if (_.device('!smartphone')) return;

            var nav = app.pages.getNavbar('folderTree'),
                page = app.pages.getPage('folderTree');

            nav.on('rightAction', function () {
                app.toggleFolders();
            });

            var tree = new TreeView({
                app: app,
                contextmenu: true,
                flat: true,
                indent: false,
                module: 'calendar'
            });
            // always change to month view after folder change
            var cb = function () {
                if (app.getWindow().currentPerspective !== 'month') {
                    ox.ui.Perspective.show(app, 'month');
                }
            };
            // initialize folder view
            FolderView.initialize({ app: app, tree: tree, firstResponder: 'month', respondCallback: cb });
            page.append(tree.render().$el);
        },

        /*
         * Default application properties
         */
        'props': function (app) {
            var view = settings.get('viewView', 'week:week');
            // introduce shared properties
            app.props = new Backbone.Model({
                'layout': view,
                'checkboxes': _.device('smartphone') ? false : app.settings.get('showCheckboxes', false),
                'colorScheme': app.settings.get('colorScheme', 'custom'),
                'mobileFolderSelectMode': false
            });

            // store colorScheme in settings to ensure that 'colorScheme' is not undefined
            app.settings.set('colorScheme', app.props.get('colorScheme'));
        },

        'vgrid-checkboxes': function (app) {
            // always hide checkboxes on small devices initially
            if (_.device('smartphone')) return;
            var grid = app.getGrid();
            grid.setEditable(app.props.get('checkboxes'));
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
                    .set('viewView', data.layout)
                    .set('showCheckboxes', data.checkboxes)
                    .set('colorScheme', data.colorScheme)
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
            //if (_.device('smartphone')) return;
            app.props.on('change:checkboxes', function (model, value) {
                app.grid.setEditable(value);
            });
        },

        /*
         * Respond to change:colorScheme
         */
        'change:colorScheme': function (app) {
            var selectScheme = function (app, value) {
                var node = app.getWindow().nodes.outer;

                switch (value) {
                    case 'classic': node.removeClass('dark-colors custom-colors'); break;
                    case 'dark':
                        if (_.device('smartphone')) {
                            node.removeClass('dark-colors custom-colors');
                        } else {
                            node.removeClass('custom-colors').addClass('dark-colors');
                        }
                        break;
                    case 'custom': node.removeClass('dark-colors').addClass('custom-colors'); break;
                    default: node.removeClass('dark-colors custom-colors'); break;
                }
            };

            app.props.on('change:colorScheme', function (model, value) {
                selectScheme(app, value);
            });
            selectScheme(app, app.props.get('colorScheme'));
        },

        /*
         * Respond to layout change
         */
        'change:layout': function (app) {
            app.props.on('change:layout', function (model, value) {
                // no animations on desktop
                ox.ui.Perspective.show(app, value, { disableAnimations: true });
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

        'inplace-find': function (app) {

            if (_.device('smartphone') || !capabilities.has('search')) return;

            app.searchable();

            var lastPerspective,
                SEARCH_PERSPECTIVE = 'list',
                find = app.get('find');
            // additional handler: switch to list perspective (and back)
            find.on({
                'find:query': function () {
                    // hide sort options
                    app.grid.getToolbar().find('.grid-options:first').hide();
                    // switch to supported perspective
                    lastPerspective = lastPerspective || app.props.get('layout') || _.url.hash('perspective');
                    if (lastPerspective !== SEARCH_PERSPECTIVE) {
                        // fluent option: do not write to user settings
                        app.props.set('layout', SEARCH_PERSPECTIVE, { fluent: true });
                        // cancel search when user changes view
                        app.props.on('change', find.cancel);
                    }
                },
                'find:cancel': function () {
                    // switch back to perspective used before
                    var currentPerspective = _.url.hash('perspective') || app.props.get('layout');
                    if (lastPerspective && lastPerspective !== currentPerspective)
                        app.props.set('layout', lastPerspective);
                    // show sort options again
                    app.grid.getToolbar().find('.grid-options:first').show();
                    // disable
                    app.props.off('change', find.cancel);
                    // reset
                    lastPerspective = undefined;
                }
            });
        },

        /*
         * mobile only
         * change current date label in navbar
         */
        'change:navbar:date-mobile': function (app) {
            if (_.device('!smartphone')) return;
            app.pages.getPage('week').on('change:navbar:date', function (e, dates) {
                app.pages.getNavbar('week').setTitle(dates.date);
            });
        },
        /*
         * mobile only
         *
         */
        'show-weekview-mobile': function (app) {
            if (_.device('!smartphone')) return;
            app.pages.getPage('week').on('pageshow', function () {
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
            app.grid.selection.on('selection:doubleclick', function (e, key) {
                ox.launch('io.ox/calendar/detail/main', { cid: key });
            });
        },

        /*
         * Add support for virtual folder "All my appointments"
         */
        'all-my-appointments': function (app) {

            app.folderView.tree.selection.addSelectableVirtualFolder('virtual/all-my-appointments');
        },

        'contextual-help': function (app) {
            app.getContextualHelp = function () {
                return 'ox.appsuite.user.sect.calendar.gui.html#ox.appsuite.user.reference.calendar.elements';
            };
        }

    });

    // launcher
    app.setLauncher(function (options) {

        // get window
        app.setWindow(win = ox.ui.createWindow({
            name: 'io.ox/calendar',
            find: capabilities.has('search'),
            chromeless: true
        }));

        app.settings = settings;
        app.refDate = moment();

        win.addClass('io-ox-calendar-main');

        // go!
        commons.addFolderSupport(app, null, 'calendar', options.folder || 'virtual/all-my-appointments')
            .always(function () {
                app.mediate();
                win.show();
            })
            .done(function () {

                // app perspective
                var lastPerspective = options.perspective || _.url.hash('perspective') || app.props.get('layout');

                if (_.device('smartphone') && _.indexOf(['week:workweek', 'week:week', 'calendar'], lastPerspective) >= 0) {
                    lastPerspective = 'week:day';
                } else {
                    // corrupt data fix
                    if (lastPerspective === 'calendar') lastPerspective = 'week:workweek';
                }
                ox.ui.Perspective.show(app, lastPerspective, { disableAnimations: true });
                app.props.set('layout', lastPerspective);
            });
    });

    return {
        getApp: app.getInstance
    };
});
