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

define('io.ox/files/main',
    ['io.ox/core/commons',
     'gettext!io.ox/files',
     'settings!io.ox/files',
     'io.ox/core/extensions',
     'io.ox/core/folder/api',
     'io.ox/core/folder/tree',
     'io.ox/core/folder/view',
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
    ], function (commons, gt, settings, ext, folderAPI, TreeView, FolderView, actions, Bars, PageController, capabilities, api) {

    'use strict';

    // application object
    var app = ox.ui.createApp({ name: 'io.ox/files', title: 'Drive' }),
        // app window
        win;

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
            var c = app.getWindow().nodes.main;
            var navbar = $('<div class="mobile-navbar">'),
                toolbar = $('<div class="mobile-toolbar">');

            app.navbar = navbar;
            app.toolbar = toolbar;

            app.pages = new PageController(app);

            app.getWindow().nodes.body.addClass('classic-toolbar-visible').append(navbar, toolbar);

            // create 3 pages with toolbars and navbars
            app.pages.addPage({
                name: 'folderTree',
                container: c,
                navbar: new Bars.NavbarView({
                    app: app,
                    extension: 'io.ox/files/mobile/navbar'
                })
            });

            app.pages.addPage({
                name: 'mainView',
                container: c,
                startPage: true,
                navbar: new Bars.NavbarView({
                    app: app,
                    extension: 'io.ox/files/mobile/navbar'
                }),
                toolbar: new Bars.ToolbarView({
                    app: app,
                    page: 'mainView',
                    extension: 'io.ox/files/mobile/toolbar'
                }),
                secondaryToolbar: new Bars.ToolbarView({
                    app: app,
                    page: 'mainView/multiselect',
                    extension: 'io.ox/files/mobile/toolbar'
                })
            });

            app.pages.addPage({
                name: 'detailView',
                container: c,
                navbar: new Bars.NavbarView({
                    app: app,
                    extension: 'io.ox/files/mobile/navbar'
                }),
                toolbar: new Bars.ToolbarView({
                    app: app,
                    page: 'detailView',
                    extension: 'io.ox/files/mobile/toolbar'

                })
            });

            // important
            // tell page controller about special navigation rules
            app.pages.setBackbuttonRules({
                'mainView': 'folderTree'
            });
        },

        /*
         * Init all nav- and toolbar labels for mobile
         */
        'navbars-mobile': function (app) {

            if (!_.device('small')) return;

            app.pages.getNavbar('mainView')
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
                .setTitle('') // no title
                .setLeft(
                    //#. Used as button label for a navigation action, like the browser back button
                    gt('Back')
                );

            // tell each page's back button what to do
            app.pages.getNavbar('mainView')
                .on('leftAction', function () {
                    app.pages.goBack();
                }).hide('.right');

            app.pages.getNavbar('detailView').on('leftAction', function () {
                app.pages.goBack();
            });

            // TODO restore last folder as starting point
            app.pages.showPage('mainView');
        },

        /*
         * Folder view support
         */
        'folder-view': function (app) {

            if (_.device('small')) return;

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

            if (_.device('!small')) return;

            var nav = app.pages.getNavbar('folderTree'),
                page = app.pages.getPage('folderTree');

            nav.on('rightAction', function () {
                app.toggleFolders();
            });

            var tree = new TreeView({ app: app, contextmenu: true, module: 'infostore' });

            // initialize folder view
            FolderView.initialize({ app: app, tree: tree, firstResponder: 'mainView' });
            page.append(tree.render().$el);
        },
        /*
         * Folder change listener for mobile
         */
        'folder-view-mobile-listener': function () {
            if (_.device('!smartphone')) return;
            // always change folder on click
            // No way to use tap here since folderselection really messes up the event chain
            app.pages.getPage('folderTree').on('click', '.folder.selectable', function (e) {
                if ($(e.target).hasClass('fa')) return; // if folder expand, do not change page
                if (app.props.get('mobileFolderSelectMode') === true) {
                    $(e.currentTarget).trigger('contextmenu'); // open menu
                    return; // do not change page in edit mode
                }
                app.pages.changePage('mainView');
            });
        },
        /*
         * Folder change listener for mobile
         */
        'change:folder-mobile': function (app) {
            if (_.device('!smartphone')) return;


            function update() {
                app.folder.getData().done(function (d) {
                    app.pages.getNavbar('mainView').setTitle(d.title);
                });
            }

            app.on('folder:change', update);

            // do once on startup
            update();
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

        'change:perspective': function () {
             //use last manually choosen perspective (mode) as default
            win.on('change:perspective', function (e, name, id) {
                app.props.set('layout', id);
            });
        },

        'change:perspective-mobile': function (app) {
            if (_.device('!smartphone')) return;

            win.on('change:perspective', function (e, name, id) {
                if (id === 'fluid:list') {
                    app.pages.getNavbar('mainView').show('.right');
                } else {
                    app.pages.getNavbar('mainView').hide('.right');
                }
            });
        },
        /*
         * Default application properties
         */
        'props': function (app) {
            // introduce shared properties
            app.props = new Backbone.Model({
                'layout': settings.get('view', 'fluid:list'),
                'folderEditMode': false, // mobile only
                'showCheckboxes': false  // mobile only
            });

            win.trigger('change:perspective', 'fluid', app.props.get('layout'));
        },


        /*
         * Set folderview property
         */
        'prop-folderview': function (app) {
            app.props.set('folderview', _.device('small') ? false : app.settings.get('folderview/visible/' + _.display(), true));
        },

        /*
         * Store view options
         */
        'store-view-options': function (app) {
            app.props.on('change', _.debounce(function () {
                var data = app.props.toJSON();
                app.settings
                    .set('view', data.layout)
                    .save();
            }, 500));
        },

        /*
         * Respond to folder view changes
         */
        'change:folderview': function (app) {
            if (_.device('small')) return;
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
         * Respond to layout change
         */
        'change:layout': function (app) {
            app.props.on('change:layout', function (model, value) {
                ox.ui.Perspective.show(app, value);
            });

            window.drive = app;
        },

        /*
         * mobile only
         * toggle edit mode in listview on mobiles
         */
        'change:checkboxes': function (app) {
            if (_.device('!smartphone')) return;
            // bind action on button
            app.pages.getNavbar('mainView').on('rightAction', function () {
                app.props.set('showCheckboxes', !app.props.get('showCheckboxes'));
            });

            // listen to prop event
            app.props.on('change:showCheckboxes', function () {
                var $view = app.getWindow().nodes.main.find('.view-list');
                app.selection.clear();
                if (app.props.get('showCheckboxes')) {
                    $view.removeClass('checkboxes-hidden');
                    app.pages.getNavbar('mainView').setRight(gt('Cancel')).hide('.left');
                } else {
                    $view.addClass('checkboxes-hidden');
                    app.pages.getNavbar('mainView').setRight(gt('Edit')).show('.left');

                }
            });

        },

        'toggle-secondary-toolbar': function (app) {
            app.props.on('change:showCheckboxes', function (model, state) {
                app.pages.toggleSecondaryToolbar('mainView', state);
            });
        },
        /*
         * Folerview toolbar
         */
        'folderview-toolbar': function (app) {

            if (_.device('small')) return;

            function toggleFolderView(e) {
                e.preventDefault();
                app.folderView.toggle(e.data.state);
            }

            var side = app.getWindow().nodes.sidepanel;
            side.find('.foldertree-container').addClass('bottom-toolbar');
            side.find('.foldertree-sidepanel').append(
                $('<div class="generic-toolbar bottom visual-focus">').append(
                    $('<a href="#" class="toolbar-item" tabindex="1">')
                    .attr('title', gt('Close folder view'))
                    .append($('<i class="fa fa-angle-double-left">'))
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

            if (_.device('small') || !capabilities.has('search')) return;

            var win = app.getWindow(), side = win.nodes.sidepanel;
            side.addClass('top-toolbar');

            require(['io.ox/search/main'], function (facetedsearch) {
                //add reference: used in perspective
                app.searchapi = facetedsearch.apiproxy;
                //register
                //commons.wireGridAndSearch(app.grid, app.getWindow(), facetedsearch.apiproxy);
            });
        }
    });

    //map old settings/links
    function map(pers) {
        var mapping;
        if (/^(icons)$/.test(pers)) {
            //support old setting value
            mapping = 'fluid:icon';
        } else if (!/^(fluid:list|fluid:icon|fluid:tile)$/.test(pers)) {
            mapping = 'fluid:list';
        }
        return mapping || pers;
    }

    // launcher
    app.setLauncher(function (options) {
        // get window
        app.setWindow(win = ox.ui.createWindow({
            name: 'io.ox/files',
            title: 'Drive',
            chromeless: true,
            facetedsearch: capabilities.has('search'),
            usePageController: _.device('smartphone')
        }));

        win.addClass('io-ox-files-main');
        app.settings = settings;

        commons.wirePerspectiveEvents(app);

        // doesn't work anymore
        // might be better to revoke 'create' right on trash folder
        // ------------------------------------------------------------
        // app.on('folder:change', function (id, data) {
        //     if (folderAPI.is('trash', data)) {//no new files in trash folders
        //         ext.point('io.ox/files/links/toolbar').disable('default');//that's the plus sign
        //     } else {
        //         ext.point('io.ox/files/links/toolbar').enable('default');//that's the plus sign
        //     }
        //     win.updateToolbar();
        // });

        win.nodes.outer.on('selection:drop', function (e, baton) {
            actions.invoke('io.ox/files/actions/move', null, baton);
        });

        // fix missing default folder
        options.folder = options.folder || folderAPI.getDefaultFolder('infostore') || 9;

        // go!
        return commons.addFolderSupport(app, null, 'infostore', options.folder)
            .always(function () {
                app.mediate();
                // prepare perspective for pagecontroller
                if (win.options.usePageController) win.options.mainPage = app.pages.getPage('mainView');
                win.show();
            })
            .done(function () {
                var pers = map(options.perspective || _.url.hash('perspective') || app.props.get('layout'));
                ox.ui.Perspective.show(app, pers);
            });
    });

    return {
        getApp: app.getInstance
    };
});
