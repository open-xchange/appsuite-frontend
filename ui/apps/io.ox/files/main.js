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
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define('io.ox/files/main', [
    'io.ox/core/commons',
    'gettext!io.ox/files',
    'settings!io.ox/files',
    'io.ox/core/extensions',
    'io.ox/core/folder/api',
    'io.ox/core/folder/tree',
    'io.ox/core/folder/view',
    'io.ox/files/listview',
    'io.ox/core/tk/list-control',
    'io.ox/core/extPatterns/actions',
    'io.ox/core/toolbars-mobile',
    'io.ox/core/page-controller',
    'io.ox/core/capabilities',
    'io.ox/files/api',
    'io.ox/files/mobile-navbar-extensions',
    'io.ox/files/mobile-toolbar-actions',
    'io.ox/files/actions',
    'io.ox/files/folderview-extensions',
    'less!io.ox/files/style',
    'io.ox/files/toolbar'
], function (commons, gt, settings, ext, folderAPI, TreeView, FolderView, FileListView, ListViewControl, actions, Bars, PageController, capabilities, api) {

    'use strict';

    // application object
    var app = ox.ui.createApp({ name: 'io.ox/files', title: 'Drive' }),
        // app window
        win;

    app.mediator({

        /*
         * Pages for desktop
         * As this module uses only one perspective, we only need one page
         */
        'pages-desktop': function (app) {
            if (_.device('smartphone')) return;
            var c = app.getWindow().nodes.main;

            app.pages = new PageController(app);

            // create 3 pages with toolbars and navbars
            app.pages.addPage({
                name: 'fluid',
                container: c,
                startPage: true
            });
        },

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

            // create 3 pages with toolbars and navbars
            app.pages.addPage({
                name: 'folderTree',
                navbar: new Bars.NavbarView({
                    baton: baton,
                    extension: 'io.ox/files/mobile/navbar'
                })
            });

            app.pages.addPage({
                name: 'fluid',
                startPage: true,
                navbar: new Bars.NavbarView({
                    baton: baton,
                    extension: 'io.ox/files/mobile/navbar'
                }),
                toolbar: new Bars.ToolbarView({
                    baton: baton,
                    page: 'fluid',
                    extension: 'io.ox/files/mobile/toolbar'
                }),
                secondaryToolbar: new Bars.ToolbarView({
                    baton: baton,
                    page: 'fluid/multiselect',
                    extension: 'io.ox/files/mobile/toolbar'
                })
            });

            app.pages.addPage({
                name: 'detailView',
                navbar: new Bars.NavbarView({
                    baton: baton,
                    extension: 'io.ox/files/mobile/navbar'
                }),
                toolbar: new Bars.ToolbarView({
                    baton: baton,
                    page: 'detailView',
                    extension: 'io.ox/files/mobile/toolbar'

                })
            });

            // important
            // tell page controller about special navigation rules
            app.pages.setBackbuttonRules({
                'fluid': 'folderTree'
            });
        },

        /*
         * Init all nav- and toolbar labels for mobile
         */
        'navbars-mobile': function (app) {

            if (!_.device('smartphone')) return;

            app.pages.getNavbar('fluid')
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
                // no title
                .setTitle('')
                .setLeft(
                    //#. Used as button label for a navigation action, like the browser back button
                    gt('Back')
                );

            // tell each page's back button what to do
            app.pages.getNavbar('fluid')
                .on('leftAction', function () {
                    app.pages.goBack();
                }).hide('.right');

            app.pages.getNavbar('detailView').on('leftAction', function () {
                app.pages.goBack();
            });

            // TODO restore last folder as starting point
            app.pages.showPage('fluid');
        },

        /*
         * Folder view support
         */
        'folder-view': function (app) {

            if (_.device('smartphone')) return;

            // tree view
            var tree = new TreeView({ app: app, module: 'infostore', root: settings.get('rootFolderId', 9), contextmenu: true });

            // initialize folder view
            FolderView.initialize({ app: app, tree: tree });
            app.folderView.resize.enable();
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

            var tree = new TreeView({ app: app, contextmenu: true, module: 'infostore', root: settings.get('rootFolderId', 9) });

            // initialize folder view
            FolderView.initialize({ app: app, tree: tree, firstResponder: 'fluid' });
            page.append(tree.render().$el);
        },

        /*
         * Folder change listener for mobile
         */
        'change:folder-mobile': function (app) {
            if (_.device('!smartphone')) return;

            function update() {
                app.folder.getData().done(function (d) {
                    app.pages.getNavbar('fluid').setTitle(d.title);
                });
            }

            app.on('folder:change', update);

            // do once on startup
            update();
        },

        /*
         * Default application properties
         */
        'props': function (app) {
            // introduce shared properties
            app.props = new Backbone.Model({
                'layout': app.settings.get('layout', 'list'),
                'folderEditMode': false,
                'showCheckboxes': false
            });
        },

        /*
         * Setup list view
         */
        'list-view': function (app) {
            app.listView = new FileListView({ app: app, draggable: true, ignoreFocus: true });
            app.listView.model.set({ folder: app.folder.get() });
            // for debugging
            window.list = app.listView;
        },

        /*
         * Setup list view control
         */
        'list-view-control': function (app) {
            app.listControl = new ListViewControl({ id: 'io.ox/files', listView: app.listView, app: app });
            app.getWindow().nodes.main.append(
                app.listControl.render().$el
                    //#. items list (e.g. mails)
                    .attr('aria-label', gt('Item list'))
                    .find('.toolbar')
                    //#. toolbar with 'select all' and 'sort by'
                    .attr('aria-label', gt('Item list options'))
                    .end()
            );
            // make resizable
            app.listControl.resizable();
        },

        /*
         * Connect collection loader with list view
         */
        'connect-loader': function (app) {
            app.listView.connect(api.collectionLoader);
        },

        /*
         * Respond to folder change
         */
        'folder:change': function (app) {
            app.on('folder:change', function (id) {
                var options = app.getViewOptions(id);
                app.props.set(options);
                app.listView.model.set('folder', id);
            });
        },

        /*
         * Get folder-based view options
         */
        'get-view-options': function (app) {
            app.getViewOptions = function (folder) {
                var options = app.settings.get(['viewOptions', folder]);
                return _.extend({ sort: 702, order: 'asc', layout: 'list' }, options);
            };
        },

        /*
         * Store view options
         */
        'store-view-options': function (app) {
            app.props.on('change', _.debounce(function () {
                var folder = app.folder.get(), data = app.props.toJSON();
                app.settings
                    .set(['viewOptions', folder], { sort: data.sort, order: data.order, layout: data.layout });
                if (_.device('!smartphone')) {
                    app.settings.set('showCheckboxes', data.checkboxes);
                }
                app.settings.save();
            }, 500));
        },

        /*
         * Restore view opt
         */
        'restore-view-options': function (app) {
            var data = app.getViewOptions(app.folder.get());
            app.props.set(data);
        },

        /*
         * Respond to changed sort option
         */
        'change:sort': function (app) {
            app.props.on('change:sort', function (model, value) {
                // set proper order first
                var model = app.listView.model;
                model.set('order', (/^(5|704)$/).test(value) ? 'desc' : 'asc', { silent: true });
                app.props.set('order', model.get('order'));
                // now change sort columns
                model.set('sort', value);
            });
        },

        /*
         * Respond to changed order
         */
        'change:order': function (app) {
            app.props.on('change:order', function (model, value) {
                app.listView.model.set('order', value);
            });
        },

        // respond to resize events
        'resize': function (app) {

            if (_.device('smartphone')) return;

            $(window).on('resize', function () {
                var list = app.listView,
                    width = list.$el.width(),
                    layout = app.props.get('layout'),
                    // icon: 140px as minimum width (120 content + 20 margin/border)
                    // tile: 180px (160 + 20)
                    // minimum is 1, maximum is 12
                    column = Math.max(1, Math.min(12, width / (layout === 'icon' ? 140 : 180) >> 0));
                // update class name
                list.el.className = list.el.className.replace(/\s?grid\-\d+/g, '');
                list.$el.addClass('grid-' + column);
            });

            $(window).trigger('resize');
        },

        /*
         * Respond to changing layout
         */
        'change:layout': function (app) {

            if (_.device('smartphone')) return;

            function applyLayout() {

                var layout = app.props.get('layout');

                if (layout === 'list') {
                    app.listView.$el.addClass('column-layout').removeClass('grid-layout icon-layout tile-layout');
                } else if (layout === 'icon') {
                    app.listView.$el.addClass('grid-layout icon-layout').removeClass('column-layout tile-layout');
                } else {
                    app.listView.$el.addClass('grid-layout tile-layout').removeClass('column-layout icon-layout');
                }
            }

            app.props.on('change:layout', function () {
                applyLayout();
                app.listView.redraw();
            });

            applyLayout();
        },

        /*
         * Delete file
         * leave detailview if file is deleted
         */
        'delete:file-mobile': function (app) {
            if (_.device('!smartphone')) return;
            api.on('delete', function () {
                if (app.pages.getCurrentPage().name === 'detailView') {
                    app.pages.goBack();
                }
            });
        },

        /*
         * Set folderview property
         */
        'prop-folderview': function (app) {
            app.props.set('folderview', _.device('smartphone') ? false : app.settings.get('folderview/visible/' + _.display(), true));
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
         * mobile only
         * toggle edit mode in listview on mobiles
         */
        'change:checkboxes': function (app) {
            if (_.device('!smartphone')) return;
            // bind action on button
            app.pages.getNavbar('fluid').on('rightAction', function () {
                app.props.set('showCheckboxes', !app.props.get('showCheckboxes'));
            });

            // listen to prop event
            app.props.on('change:showCheckboxes', function () {
                var $view = app.getWindow().nodes.main.find('.view-list');
                app.selection.clear();
                if (app.props.get('showCheckboxes')) {
                    $view.removeClass('checkboxes-hidden');
                    app.pages.getNavbar('fluid').setRight(gt('Cancel')).hide('.left');
                } else {
                    $view.addClass('checkboxes-hidden');
                    app.pages.getNavbar('fluid').setRight(gt('Edit')).show('.left');
                }
            });
        },

        'toggle-secondary-toolbar': function (app) {
            app.props.on('change:showCheckboxes', function (model, state) {
                app.pages.toggleSecondaryToolbar('fluid', state);
            });
        },

        /*
         * Folerview toolbar
         */
        'folderview-toolbar': function (app) {

            if (_.device('smartphone')) return;

            function toggleFolderView(e) {
                e.preventDefault();
                app.folderView.toggle(e.data.state);
            }

            var side = app.getWindow().nodes.sidepanel;
            side.find('.foldertree-container').addClass('bottom-toolbar');
            side.find('.foldertree-sidepanel').append(
                $('<div class="generic-toolbar bottom visual-focus">').append(
                    $('<a href="#" class="toolbar-item" role="button" tabindex="1">')
                    .append(
                        $('<i class="fa fa-angle-double-left" aria-hidden="true">'),
                        $('<span class="sr-only">').text(gt('Close folder view'))
                    )
                    .on('click', { app: app, state: false }, toggleFolderView)
                )
            );
        },

        /*
         * folder edit mode for mobile
         */
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

        'inplace-search': function (app) {

            if (_.device('smartphone') || !capabilities.has('search')) return;

            var win = app.getWindow(), side = win.nodes.sidepanel;
            side.addClass('top-toolbar');
            win.facetedsearch.ready.done(function (search) {
                //add reference: used in perspective
                app.searchapi = search.apiproxy;
            });
        }
    });

    // launcher
    app.setLauncher(function (options) {
        // get window
        app.setWindow(win = ox.ui.createWindow({
            name: 'io.ox/files',
            title: 'Drive',
            chromeless: true,
            facetedsearch: capabilities.has('search')
        }));

        win.addClass('io-ox-files-main');
        app.settings = settings;

        commons.wirePerspectiveEvents(app);

        win.nodes.outer.on('selection:drop', function (e, baton) {
            actions.invoke('io.ox/files/actions/move', null, baton);
        });

        // fix missing default folder
        options.folder = options.folder || folderAPI.getDefaultFolder('infostore') || 9;

        // go!
        return commons.addFolderSupport(app, null, 'infostore', options.folder)
            .always(function () {
                app.mediate();
                win.show(function () {
                    // trigger grid resize
                    $(window).trigger('resize');
                });
            });
    });

    return {
        getApp: app.getInstance
    };
});
