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
    'io.ox/core/folder/node',
    'io.ox/core/folder/view',
    'io.ox/files/listview',
    'io.ox/core/tk/list-control',
    'io.ox/files/share/listview',
    'io.ox/backbone/mini-views/toolbar',
    'io.ox/core/extPatterns/actions',
    'io.ox/core/toolbars-mobile',
    'io.ox/core/page-controller',
    'io.ox/core/capabilities',
    'io.ox/files/api',
    'io.ox/core/tk/sidebar',
    'io.ox/core/viewer/views/sidebarview',
    'io.ox/files/mobile-navbar-extensions',
    'io.ox/files/mobile-toolbar-actions',
    'io.ox/files/actions',
    'less!io.ox/files/style',
    'less!io.ox/core/viewer/style',
    'io.ox/files/toolbar',
    'io.ox/files/share/toolbar',
    'io.ox/files/upload/dropzone'
], function (commons, gt, settings, ext, folderAPI, TreeView, TreeNodeView, FolderView, FileListView, ListViewControl, MySharesView, Toolbar, actions, Bars, PageController, capabilities, api, sidebar, Sidebarview) {

    'use strict';

    // application object
    var app = ox.ui.createApp({ name: 'io.ox/files', title: 'Drive' }),
        // app window
        win,
        sidebarView = new Sidebarview({ closable: true });

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
                name: 'main',
                container: c,
                startPage: true
            });

            app.getTour = function () {
                return { id: 'default/io.ox/files', path: 'io.ox/tours/files' };
            };
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
                name: 'main',
                startPage: true,
                navbar: new Bars.NavbarView({
                    baton: baton,
                    extension: 'io.ox/files/mobile/navbar'
                }),
                toolbar: new Bars.ToolbarView({
                    baton: baton,
                    page: 'main',
                    extension: 'io.ox/files/mobile/toolbar'
                }),
                secondaryToolbar: new Bars.ToolbarView({
                    baton: baton,
                    page: 'main/multiselect',
                    extension: 'io.ox/files/mobile/toolbar'
                })
            });

            /*app.pages.addPage({
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
            });*/

            // important
            // tell page controller about special navigation rules
            app.pages.setBackbuttonRules({
                'main': 'folderTree'
            });
        },

        /*
         * Init all nav- and toolbar labels for mobile
         */
        'navbars-mobile': function (app) {

            if (!_.device('smartphone')) return;

            app.pages.getNavbar('main')
                .setLeft(gt('Folders'))
                .setRight(
                    //#. Used as a button label to enter the "edit mode"
                    gt('Edit')
                );

            app.pages.getNavbar('folderTree')
                .setTitle(gt('Folders'))
                .setLeft(false)
                .setRight(gt('Edit'));

            /*app.pages.getNavbar('detailView')
                // no title
                .setTitle('')
                .setLeft(
                    //#. Used as button label for a navigation action, like the browser back button
                    gt('Back')
                );
            */
            // tell each page's back button what to do
            app.pages.getNavbar('main')
                .on('leftAction', function () {
                    app.pages.goBack();
                }).hide('.right');

            /*app.pages.getNavbar('detailView').on('leftAction', function () {
                app.pages.goBack();
            });*/

            // TODO restore last folder as starting point
            app.pages.showPage('main');
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
            FolderView.initialize({ app: app, tree: tree, firstResponder: 'main' });
            page.append(tree.render().$el);
        },

        /*
         * Folder change listener for mobile
         */
        'change:folder-mobile': function (app) {
            if (_.device('!smartphone')) return;

            function update() {
                app.folder.getData().done(function (d) {
                    app.pages.getNavbar('main').setTitle(d.title);
                });
            }

            app.on('folder:change', update);

            // do once on startup
            update();
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
         * Default application properties
         */
        'props': function (app) {
            // layout
            var layout = app.settings.get('layout');
            if (!/^(list|icon|tile)/.test(layout)) layout = 'list';
            // introduce shared properties
            app.props = new Backbone.Model({
                'checkboxes': _.device('smartphone') ? false : app.settings.get('showCheckboxes', false),
                'filter': 'none',
                'layout': layout,
                'folderEditMode': false,
                'details': _.device('touch') ? false : app.settings.get('showDetails', true)
            });
            // initial setup
            var folder = app.folder.get();
            if (folder) app.props.set(app.getViewOptions(folder));
        },

        /*
         * Setup list view
         */
        'list-view': function (app) {
            app.listView = new FileListView({ app: app, draggable: true, ignoreFocus: true, noSwipe: true, noPullToRefresh: true });
            app.listView.model.set({ folder: app.folder.get(), sort: app.props.get('sort'), order: app.props.get('order') });
            // for debugging
            window.list = app.listView;
        },

        /*
         * Setup list view control
         */
        'list-view-control': function (app) {
            app.listControl = new ListViewControl({ id: 'io.ox/files', listView: app.listView, app: app });
            var node = _.device('smartphone') ? app.pages.getPage('main') : app.getWindow().nodes.main;
            node.append(
                app.listControl.render().$el
                //#. items list (e.g. mails)
                .attr('aria-label', gt('Item list'))
                .find('.toolbar')
                //#. toolbar with 'select all' and 'sort by'
                .attr('aria-label', gt('Item list options'))
                .end()
            );
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
                // we clear the list now to avoid flickering due to subsequent layout changes
                app.listView.empty();
                var options = app.getViewOptions(id);
                app.props.set(options);
                app.listView.model.set('folder', id);
            });
        },

        /*
         * Respond to virtual myshares
         */
        'myshares-listview': function (app) {
            if (!capabilities.has('publication')) return;

            // add virtual folder to folder api
            folderAPI.virtual.add('virtual/myshares', function () {
                return $.when([]);
            });

            ext.point('io.ox/core/foldertree/infostore/app').extend({
                id: 'myshares',
                index: 100,
                draw: function (tree) {
                    this.append(
                        new TreeNodeView({
                            title: gt('My shares'),
                            folder: 'virtual/myshares',
                            icons: tree.options.icons,
                            tree: tree,
                            parent: tree
                        })
                        .render().$el.addClass('myshares')
                    );
                }
            });

            app.folderView.tree.on({
                'virtual': function (id) {
                    if (id !== 'virtual/myshares') return;

                    app.trigger('folder-virtual:change', id, { type: 'myshares', standard_folder_type: 'virtual' });

                    if (app.mysharesListViewControl) {
                        app.mysharesListViewControl.$el.show().siblings().hide();
                    } else {

                        app.mysharesListView = new MySharesView({
                            app: app,
                            pagination: false,
                            draggable: false,
                            ignoreFocus: true,
                            noSwipe: true
                        });

                        app.mysharesListViewControl = new ListViewControl({
                            id: 'io.ox/files/share/myshares',
                            listView: app.mysharesListView,
                            app: app
                        });

                        api.on('change:permissions', _.debounce(function () {
                            app.mysharesListView.reload();
                        }), 10);

                        folderAPI.on('change:permissions', _.debounce(function () {
                            app.mysharesListView.reload();
                        }), 10);

                        var toolbar = new Toolbar({ title: app.getTitle(), tabindex: 1 });

                        app.getWindow().nodes.body.prepend(app.mysharesListViewControl.render().$el.addClass('myshares-list-control').append(toolbar.render().$el));

                        app.updateMyshareToolbar = _.debounce(function (list) {
                            var baton = ext.Baton({
                                $el: toolbar.$list,
                                data: app.mysharesListView.collection.get(list),
                                collection: app.mysharesListView.collection,
                                model: app.mysharesListView.collection.get(app.mysharesListView.collection.get(list))
                            }),
                            ret = ext.point('io.ox/files/share/classic-toolbar')
                                .invoke('draw', toolbar.$list.empty(), baton);

                            $.when.apply($, ret.value()).then(function () {
                                toolbar.initButtons();
                            });
                        }, 10);

                        app.updateMyshareToolbar([]);
                        // update toolbar on selection change as well as any model change
                        app.mysharesListView.on('selection:change change', function () {
                            app.updateMyshareToolbar(app.mysharesListView.selection.get());
                        });

                        app.mysharesListViewControl.$el.siblings().hide();
                    }
                },
                'change': function () {
                    if (app.mysharesListViewControl) {
                        app.mysharesListViewControl.$el.hide().siblings().show();
                    }
                }
            });
        },

        /*
         * Store view options
         */
        'store-view-options': function (app) {
            app.props.on('change', _.debounce(function () {
                if (app.props.get('find-result')) return;
                var folder = app.folder.get(), data = app.props.toJSON();
                app.settings
                    .set(['viewOptions', folder], { sort: data.sort, order: data.order, layout: data.layout });
                if (_.device('!smartphone')) {
                    app.settings.set('showCheckboxes', data.checkboxes);
                }
                app.settings.set('showDetails', data.details);
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

        'selection:change': function () {

            if (_.device('touch')) return;

            app.listView.on('selection:change', function () {

                // do nothing if closed
                if (!sidebarView.open) return;

                if (app.listView.selection.isEmpty()) {
                    sidebarView.$('.detail-pane').empty().append(
                        $('<div class="io-ox-center">').append(
                            $('<div class="summary empty">').text(gt('No elements selected'))
                        )
                    );
                } else {

                    var item = app.listView.selection.get()[0], folder, model;

                    if (/^folder\./.test(item)) {
                        // get folder
                        folder = folderAPI.pool.getModel(item.replace(/^folder\./, ''));
                        model = new api.Model(folder.attributes);
                    } else {
                        model = app.listView.collection.get(item);
                    }

                    sidebarView.render(model);
                    sidebarView.renderSections();
                    sidebarView.$('img').trigger('appear.lazyload');
                    sidebarView.$('.sidebar-panel-thumbnail').attr('aria-label', gt('thumbnail'));
                }
            });
        },

        /*
         * Respond to changed filter
         */
        'change:filter': function (app) {

            app.props.on('change:filter', function (model, value) {
                app.listView.selection.selectNone();
                if (value === 'none') app.listView.setFilter();
                else app.listView.setFilter('.file-type-' + value);
            });

            // reset filter on folder change
            app.on('folder:change', function () {
                app.props.set('filter', 'none');
            });
        },

        // respond to resize events
        'resize': function (app) {

            if (_.device('smartphone')) return;

            $(window).on('resize', function () {

                var list = app.listView, width, layout, gridWidth, column;

                // skip recalcucation if invisible
                if (!list.$el.is(':visible')) return;

                width = list.$el.width();
                layout = app.props.get('layout');
                gridWidth = layout === 'icon' ? 140 : 180;
                // icon: 140px as minimum width (120 content + 20 margin/border)
                // tile: 180px (160 + 20)
                // minimum is 1, maximum is 12
                column = Math.max(1, Math.min(12, width / gridWidth >> 0));

                // update class name
                list.el.className = list.el.className.replace(/\s?grid\-\d+/g, '');
                list.$el.addClass('grid-' + column).attr('grid-count', column);
            });

            $(window).trigger('resize');
        },

        /*
         * Respond to changing layout
         */
        'change:layout': function (app) {

            app.applyLayout = function () {

                var layout = app.props.get('layout'),
                    details = app.props.get('details');

                if (details && _.device('!touch')) {
                    sidebarView.open = true;
                    sidebarView.$el.toggleClass('open', true);
                    app.listView.trigger('selection:change');
                }

                if (layout === 'list') {
                    ext.point('io.ox/core/viewer/sidebar/fileinfo').enable('thumbnail');
                    app.listView.$el.addClass('column-layout').removeClass('grid-layout icon-layout tile-layout');
                } else if (layout === 'icon') {
                    app.listView.$el.addClass('grid-layout icon-layout').removeClass('column-layout tile-layout');
                } else {
                    app.listView.$el.addClass('grid-layout tile-layout').removeClass('column-layout icon-layout');
                }

                if (layout !== 'list') {
                    ext.point('io.ox/core/viewer/sidebar/fileinfo').disable('thumbnail');
                }
                app.listView.trigger('selection:change');

                if (_.device('smartphone')) {
                    onOrientationChange();
                }
            };

            function onOrientationChange() {
                if (_.device('landscape')) {
                    //use 3 items per row on smartphones in landscape orientation
                    app.listView.$el.removeClass('grid-2').addClass('grid-3');
                } else {
                    //use 2 items per row on smartphones in portrait orientation
                    app.listView.$el.removeClass('grid-3').addClass('grid-2');
                }
            }

            if (_.device('smartphone')) {
                //use debounce here or some smartphone animations are not finished yet, resulting in incorrect orientationstate (seen on S4)
                $(window).on('orientationchange', _.debounce(onOrientationChange, 500));
            }

            app.props.on('change:layout', function () {
                _.defer(function () {
                    app.applyLayout();
                    app.listView.redraw();
                    $(document).trigger('resize');
                });
            });

            app.applyLayout();
        },

        /*
         * Add support for doubleclick
         */
        'selection-doubleclick': function (app) {

            var ev = _.device('touch') ? 'tap' : 'dblclick';

            app.listView.$el.on(ev, '.file-type-folder .list-item-content', function (e) {
                var obj = _.cid($(e.currentTarget).parent().attr('data-cid'));
                app.folder.set(obj.id);
            });

            app.listView.$el.on(ev, '.list-item:not(.file-type-folder) .list-item-content', function (e) {
                var cid = $(e.currentTarget).parent().attr('data-cid'),
                    selectedModel = _(api.resolve([cid], false)).invoke('toJSON'),
                    baton = ext.Baton({ data: selectedModel[0], collection: app.listView.collection, app: app });

                actions.invoke('io.ox/files/actions/default', null, baton);
            });
        },

        //open on pressing enter
        'selection-enter': function (app) {
            if (_.device('smartphone')) {
                return;
            }

            // folders
            app.listView.$el.on('keydown', '.file-type-folder', function (e) {
                if (e.which === 13) {
                    var obj = _.cid($(e.currentTarget).attr('data-cid'));
                    app.folder.set(obj.id);
                }
            });

            // files
            app.listView.$el.on('keydown', '.list-item:not(.file-type-folder)', function (e) {
                if (e.which === 13) {
                    var cid = app.listView.selection.get()[0],
                        selectedModel = _(api.resolve([cid], false)).invoke('toJSON'),
                        baton = ext.Baton({ data: selectedModel[0], collection: app.listView.collection, app: app });

                    actions.invoke('io.ox/files/actions/default', null, baton);
                }
            });
        },

        /*
         * Respond to API events that need a reload
         */
        'requires-reload': function (app) {
            // listen to events that affect the filename, add files, or remove files
            api.on('rename add:version remove:version change:version', _.debounce(function () {
                app.listView.reload();
            }, 100));
            folderAPI.on('rename', _.debounce(function (id, data) {
                // if the renamed folder is inside the folder currently displayed, reload
                if (data.folder_id === app.folder.get()) {
                    app.listView.reload();
                }
            }, 100));
            // use throttled updates for add:file - in case many small files are uploaded
            api.on('add:file', _.throttle(function () {
                app.listView.reload();
            }, 10000));
            // always refresh when the last file has finished uploading
            api.on('stop:upload', _.bind(app.listView.reload, app.listView));
            var myFolder = false,
                doReload = _.debounce(function () {
                    // we only need to reload if the current folder is affected
                    if (myFolder) {
                        myFolder = false;
                        app.listView.reload();
                    }
                }, 100);
            api.on('copy', function (list, targetFolder) {
                var appfolder = app.folder.get();
                if (appfolder === targetFolder) {
                    myFolder = true;
                }
                doReload();
            });
        },

        /*
         * Add listener to files upload to select newly uploaded files after listview reload
         */
        'select-uploaded-files': function (app) {
            api.on('stop:upload', function (requests) {
                api.collectionLoader.collection.once('reload', function () {
                    $.when.apply(this, requests).done(function () {
                        var files,
                            selection = app.listView.selection,
                            items;

                        files = _(arguments).map(_.cid);

                        items = selection.getItems(function () {
                            return files.indexOf($(this).attr('data-cid')) >= 0;
                        });

                        selection.selectNone();
                        selection.selectAll(items);
                    });
                });
            });
        },

        /*
         * Respond to change:checkboxes
         */
        'change:checkboxes': function (app) {

            if (_.device('smartphone')) return;

            app.props.on('change:checkboxes', function (model, value) {
                app.listView.toggleCheckboxes(value);
            });

            app.listView.toggleCheckboxes(app.props.get('checkboxes'));
        },

        'detail-sidebar': function (app) {

            if (_.device('smartphone')) return;

            sidebar.add({
                side: 'right',
                sidebar: sidebarView.$el.css('padding', '0 16px'),
                target: app.listControl.$el,
                visible: app.props.get('details')
            });
        },

        'change:details': function (app) {

            if (_.device('smartphone')) return;

            function toggle(state) {
                sidebarView.open = state;
                sidebarView.$el.trigger('toggle-sidebar', state).toggleClass('open', state);
                app.applyLayout();
                app.listView.trigger('selection:change');
                // trigger generic resize event so that other components can respond to it
                $(document).trigger('resize');
            }

            app.props.on('change:details', function (model, value) {
                toggle(value);
            });

            toggle(app.props.get('details'));

            sidebarView.$el.on('click', '.viewer-fileinfo .close', function () {
                app.props.set('details', false);
            });
        },

        /*
         * Respond to global refresh
         */
        'refresh': function (app) {
            ox.on('refresh^', function () {
                _.defer(function () {
                    app.listView.reload();
                });
            });
        },

        /*
         *
         */
        'folder:add/remove': function (app) {

            folderAPI.on('create', function (data) {
                if (data.folder_id === app.folder.get()) app.listView.reload();
            });

            folderAPI.on('remove', function (id, data) {
                // on folder remove, the folder model is directly removed from the collection.
                // the folder tree automatically selects the parent folder. therefore,
                // the parent folder's collection just needs to be marked as expired
                _(api.pool.getByFolder(data.folder_id)).each(function (collection) {
                    collection.expired = true;
                });
            });
        },

        /*
         * Delete file
         * leave detailview if file is deleted

        'delete:file-mobile': function (app) {
            if (_.device('!smartphone')) return;
            api.on('delete', function () {
                if (app.pages.getCurrentPage().name === 'detailView') {
                    app.pages.goBack();
                }
            });
        },
        */
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
        'change:checkboxes-mobile': function (app) {

            if (_.device('!smartphone')) return;

            // bind action on button
            app.pages.getNavbar('main').on('rightAction', function () {
                app.props.set('showCheckboxes', !app.props.get('showCheckboxes'));
            });

            // listen to prop event
            app.props.on('change:showCheckboxes', function () {
                var $view = app.getWindow().nodes.main.find('.view-list');
                app.selection.clear();
                if (app.props.get('showCheckboxes')) {
                    $view.removeClass('checkboxes-hidden');
                    app.pages.getNavbar('main').setRight(gt('Cancel')).hide('.left');
                } else {
                    $view.addClass('checkboxes-hidden');
                    app.pages.getNavbar('main').setRight(gt('Edit')).show('.left');
                }
            });
        },

        'toggle-secondary-toolbar': function (app) {
            app.props.on('change:showCheckboxes', function (model, state) {
                app.pages.toggleSecondaryToolbar('main', state);
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

        'inplace-find': function (app) {

            if (_.device('smartphone') || !capabilities.has('search')) return;

            app.searchable();
        },

        // respond to search results
        'find': function (app) {
            if (_.device('smartphone') || !app.get('find')) return;
            app.get('find').on({
                'find:query:result': function (response) {
                    api.pool.add('detail', response.results);
                }
            });
        },

        'contextual-help': function (app) {
            app.getContextualHelp = function () {
                return 'ox.appsuite.user.sect.files.gui.html#ox.appsuite.user.sect.files.gui';
            };
        },

        'before-delete': function (app) {

            if (_.device('smartphone')) return;

            api.on('beforedelete', function (ids) {
                // change selection
                app.listView.selection.dodge();
                // optimization for many items
                if (ids.length === 1) return;
                // remove all DOM elements of current collection; keep the first item
                app.listView.onBatchRemove(ids.slice(1));
            });
        },

        /*
         * Handle delete event based on keyboard shortcut or swipe gesture
         */
        'selection-delete': function () {
            app.listView.on('selection:delete', function (cids) {
                // turn cids into proper objects
                var list = _(api.resolve(cids, false)).invoke('toJSON');
                // check if action can be called
                actions.check('io.ox/files/actions/delete', list).done(function () {
                    actions.invoke('io.ox/files/actions/delete', null, ext.Baton({ data: list }));
                });
            });
        },

        // register listView as dropzone (folders only)
        'listview-dropzone': function (app) {
            app.listView.$el
                .addClass('dropzone')
                .attr('data-dropzones', '.selectable.file-type-folder');
        },

        'metrics': function (app) {
            require(['io.ox/metrics/main'], function (metrics) {
                //if (!metrics.isEnabled()) return;
                var nodes = app.getWindow().nodes,
                    //node = nodes.outer,
                    toolbar = nodes.body.find('.classic-toolbar-container'),
                    sidepanel = nodes.sidepanel;
                // toolbar actions
                toolbar.delegate('.io-ox-action-link', 'mousedown', function (e) {
                    metrics.trackEvent({
                        app: 'drive',
                        target: 'toolbar',
                        type: 'click',
                        action: $(e.currentTarget).attr('data-action')
                    });
                });
                // toolbar options dropfdown
                toolbar.delegate('.dropdown-menu a', 'mousedown', function (e) {
                    var node =  $(e.target).closest('a');
                    metrics.trackEvent({
                        app: 'drive',
                        target: 'toolbar',
                        type: 'click',
                        action: node.attr('data-name'),
                        detail: node.attr('data-value')
                    });
                });
                // folder tree action
                sidepanel.find('.context-dropdown').delegate('li>a', 'mousedown', function (e) {
                    metrics.trackEvent({
                        app: 'drive',
                        target: 'folder/context-menu',
                        type: 'click',
                        action: $(e.currentTarget).attr('data-action')
                    });
                });
                // check for clicks in folder trew
                app.on('folder:change folder-virtual:change', function (folder, data) {
                    // http://oxpedia.org/wiki/index.php?title=HTTP_API#DefaultTypes
                    // hint: custom ids for virtual folder 'vi'
                    metrics.trackEvent({
                        app: 'drive',
                        target: 'folder',
                        type: 'click',
                        action: 'select',
                        detail:  data.standard_folder_type + '.' + data.type
                    });
                });
                // selection in listview
                app.listView.on({
                    'selection:multiple selection:one': function (list) {
                        metrics.trackEvent({
                            app: 'drive',
                            target: 'list/' + app.props.get('layout'),
                            type: 'click',
                            action: 'select',
                            detail: list.length > 1 ? 'multiple' : 'one'
                        });
                    }
                });
            });
        }
    });

    // launcher
    app.setLauncher(function (options) {
        // get window
        app.setWindow(win = ox.ui.createWindow({
            name: 'io.ox/files',
            id: 'io.ox/files',
            title: 'Drive',
            chromeless: true,
            find: capabilities.has('search')
        }));

        win.addClass('io-ox-files-main');
        app.settings = settings;

        commons.wirePerspectiveEvents(app);

        win.nodes.outer.on('selection:drop', function (e, baton) {
            // convert composite keys to objects
            baton.data = _(baton.data).map(function (item) {
                return _.isString(item) ? _.cid(item) : item;
            });
            // empty?
            if (!baton.data.length) return;
            // ensure proper type
            baton.dropType = 'infostore';
            baton.target = baton.target.replace(/^folder\./, '');
            // avoid self-reference
            if (baton.data[0].id === baton.target) return;
            // call move action (instead of API) to have visual error handlers
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
