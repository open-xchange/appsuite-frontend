/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/files/main', [
    'io.ox/core/commons',
    'gettext!io.ox/files',
    'settings!io.ox/files',
    'settings!io.ox/core',
    'io.ox/core/extensions',
    'io.ox/core/folder/api',
    'io.ox/core/api/jobs',
    'io.ox/core/folder/tree',
    'io.ox/core/folder/view',
    'io.ox/files/listview',
    'io.ox/core/tk/list-control',
    'io.ox/backbone/mini-views/toolbar',
    'io.ox/backbone/views/actions/util',
    'io.ox/core/toolbars-mobile',
    'io.ox/core/page-controller',
    'io.ox/core/capabilities',
    'io.ox/files/api',
    'io.ox/core/tk/sidebar',
    'io.ox/core/viewer/views/sidebarview',
    'io.ox/backbone/mini-views/quota',
    'io.ox/core/notifications',
    'io.ox/backbone/views/toolbar',
    'io.ox/core/api/filestorage',
    'io.ox/core/api/tab',
    // prefetch
    'io.ox/files/mobile-navbar-extensions',
    'io.ox/files/mobile-toolbar-actions',
    'io.ox/files/actions',
    'less!io.ox/files/style',
    'less!io.ox/core/viewer/style',
    'io.ox/files/toolbar',
    'io.ox/files/upload/dropzone',
    'io.ox/core/folder/breadcrumb',
    'io.ox/files/contextmenu'
], function (commons, gt, settings, coreSettings, ext, folderAPI, jobsAPI, TreeView, FolderView, FileListView, ListViewControl, Toolbar, actionsUtil, Bars, PageController, capabilities, api, sidebar, Sidebarview, QuotaView, notifications, ToolbarView, filestorageAPI, tabAPI) {

    'use strict';

    // application object
    var app = ox.ui.createApp({ id: 'io.ox/files', name: 'io.ox/files', title: 'Drive' }),
        // app window
        win,
        sidebarView = new Sidebarview({ closable: true, app: app });

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

        },

        /**
         * Add listener for browser tab communication. Event needs a
         * 'propagate' string for propagation
         */
        'refresh-from-broadcast': function () {
            if (!ox.tabHandlingEnabled) return;
            // we can be sure that 'io.ox/core/api/tab' is cached when 'ox.tabHandlingEnabled' is true
            var tabAPI = require('io.ox/core/api/tab');
            var events = tabAPI.communicationEvents;
            events.listenTo(events, 'refresh-file', function (parameters) {
                api.propagate('refresh:file', _.pick(parameters, 'folder_id', 'id'));
            });
            events.listenTo(events, 'add-file', function (parameters) {
                api.propagate('add:file', _.pick(parameters, 'folder_id', 'id'));
            });
            events.listenTo(events, 'upload-file', function (parameters) {
                var folderId = parameters ? parameters.folder_id : null;
                if (folderId && folderId !== app.folder.get()) {
                    api.pool.resetFolder(folderId);
                } else {
                    app.listView.reload();
                }
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

            app.treeView = new TreeView({ app: app, module: 'infostore', root: settings.get('rootFolderId', 9), contextmenu: true });
            FolderView.initialize({ app: app, tree: app.treeView });
            app.folderView.resize.enable();

            // cleans up folders that are part of an external account that was deleted recently
            folderAPI.on('error:FILE_STORAGE-0004', function (error, id) {
                if (!id) return;
                folderAPI.pool.removeCollection(id, { removeModels: true });
            });
        },

        'account-errors': function (app) {

            // account errors are shown in EVERY folder that are part of that account
            app.treeView.on('click:account-error', function (folder) {
                var accountError = folder['com.openexchange.folderstorage.accountError'];
                if (!accountError) return;

                require(['io.ox/backbone/views/modal', 'io.ox/backbone/mini-views'], function (ModalDialog, miniViews) {
                    new ModalDialog({
                        model: new Backbone.Model(),
                        point: 'io.ox/files/account-errors',
                        //#. title of dialog when contact subscription needs to be recreated on error
                        title: gt('Error')
                    })
                    .extend({
                        default: function () {
                            this.account = filestorageAPI.getAccountsCache().findWhere({ qualifiedId: folder.account_id });

                            this.$body.append(
                                $('<div class="form-group">').append(
                                    $('<div class="info-text">')
                                        .css('word-break', 'break-word')
                                        .text(accountError.error + ' ' + accountError.error_desc)
                                        .addClass(accountError.code.toLowerCase())
                                )
                            );
                        },
                        // password outdated
                        password: function () {
                            if (!/^(LGI-0025)$/.test(accountError.code)) return;
                            // improve error message
                            this.$('.info-text').text(gt('The password was changed recently. Please enter the new password.'));
                            // fallback
                            if (!this.account) return;
                            // input
                            var guid = _.uniqueId('form-control-label-');
                            this.$body.append(
                                $('<div class="form-group">').append(
                                    $('<label>').attr('for', guid).text(gt('Password')),
                                    new miniViews.PasswordView({
                                        name: 'password',
                                        model: this.model,
                                        id: guid,
                                        autocomplete: false,
                                        options: { mandatory: true } }).render().$el
                                )
                            );
                            // button
                            this.addButton({ label: gt('Save'), action: 'save' })
                                .on('save', function () {
                                    var password = this.model.get('password'),
                                        data = this.account.pick('id', 'filestorageService', 'displayName');
                                    // prevent shared 'configuration' object
                                    _.extend(data, { configuration: { url: this.account.get('configuration').url, password: password } });
                                    filestorageAPI.updateAccount(data).fail(notifications.yell);
                                }.bind(this));
                        },
                        // all other non credentials related errors
                        refresh: function () {
                            if (/^(LGI-0025)$/.test(accountError.code)) return;
                            this.addButton({ label: gt('Retry'), action: 'retry' })
                                .on('retry', function () {
                                    folderAPI.list(10, { cache: false, force: true }).fail(notifications.yell);
                                });
                        },
                        unsubscribe: function () {
                            // currently mw does not support unsubscribe when password changed
                            if (/^(LGI-0025)$/.test(accountError.code)) return;
                            this.addAlternativeButton({ label: gt('Hide folder'), action: 'unsubscribe' })
                            .on('unsubscribe', function () {
                                folderAPI.update(folder.id, { subscribed: false }).then(function () {
                                    folderAPI.refresh();
                                }, function (e) {
                                    notifications.yell(e);
                                });
                            });
                        },
                        // all permanent errors
                        close: function () {
                            var closeButton = this.$footer.find('[data-action="cancel"]');
                            // is primary
                            var isPrimary = !this.$footer.find('button:not(.pull-left)').length;
                            if (isPrimary) closeButton.addClass('btn-primary');
                            // should be labled as 'Cancel' for outdated password
                            if (/^(LGI-0025)$/.test(accountError.code)) closeButton.text(gt('Cancel'));
                        }
                    })
                    .addButton({ className: 'btn-default' })
                    .open();
                });
            });
        },

        /**
         * PDF preconversion of office documents on file upload and when a new file version is added
         */
        'pdf-preconversion': function () {
            // check if document converter is available
            if (!capabilities.has('document_preview')) { return; }

            // check setting 'io.ox/core//pdf/enablePreconversionOnUpload'
            // if true or not present, perform preconversion on file upload
            if (coreSettings.get('pdf/enablePreconversionOnUpload') === false) { return; }

            function getFileModelFromDescriptor(fileDescriptor) {
                return api.get(fileDescriptor).then(function (file) {
                    return api.pool.get('detail').get(_.cid(file));
                });
            }

            function getConverterUrl(model) {
                return require(['io.ox/core/tk/doc-converter-utils']).then(function (DocConverterUtils) {
                    return DocConverterUtils.getEncodedConverterUrl(model, { async: true });
                });
            }

            function isOfficeDocumentAndNeedsPDFConversion(model) {
                var file = model.toJSON();
                // always preconvert for Text and Presentation documents, but for spreadsheets only if the Spreadsheet app is not available
                return (api.isWordprocessing(file) || api.isPresentation(file) || (api.isSpreadsheet(file) && !capabilities.has('spreadsheet')));
            }

            function preconvertPDF(file) {
                getFileModelFromDescriptor(file).then(function (model) {
                    // resolve with document converter url or reject to skip Ajax call
                    if (isOfficeDocumentAndNeedsPDFConversion(model)) {
                        return getConverterUrl(model);
                    }
                    return $.Deferred().reject();

                }).then(function (url) {
                    $.ajax({
                        url: url,
                        dataType: 'text'
                    });
                });
            }

            api.on('add:file add:version', preconvertPDF);
        },

        'files-quota': function (app) {

            if (_.device('smartphone')) return;

            var quota = new QuotaView({
                //#. Quota means a general quota for mail and files
                title: coreSettings.get('quotaMode', 'default') === 'unified' ? gt('Quota') : gt('File quota'),
                renderUnlimited: false,
                module: 'file',
                upsell: {
                    title: gt('Need more space?'),
                    requires: 'boxcom || google || microsoftgraph',
                    id: 'files-folderview-quota',
                    icon: ''
                },
                upsellLimit: 5 * 1024 * 1024 // default upsell limit of 5 mb
            });
            // add some listeners
            folderAPI.on('clear', function () {
                quota.getQuota(true);
            });

            api.on('add:file remove:file add:version remove:version', function () {
                quota.getQuota(true);
            });

            api.on('copy', function () {
                quota.getQuota(true);
            });

            app.treeView.$el.append(
                quota.render().$el
            );
        },

        'long-running-jobs': function () {
            jobsAPI.on('added:infostore', function () {
                require(['io.ox/core/yell'], function (yell) {
                    //#. moving folders/files
                    yell('info', gt('Move operation takes longer to finish'));
                });
            });
            jobsAPI.on('finished:infostore', _.debounce(function () {
                require(['io.ox/core/yell'], function (yell) {
                    //#. %1$s: moving folders/files
                    yell('info', gt('Finished moving'));
                });
            }, 50));
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
            app.treeView = tree;
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
                var options = app.settings.get(['viewOptions', folder], {}),
                    defaultSort = 702,
                    defaultOrder = 'asc';

                if (folder === 'virtual/myshares' || folderAPI.is('attachmentView', { id: folder })) {
                    defaultSort = 5;
                    defaultOrder = 'desc';
                }

                if (!/^(list|icon|tile)/.test(options.layout)) options.layout = 'list';
                return _.extend({ sort: defaultSort, order: defaultOrder, layout: 'list' }, options);
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
                'filter': 'all',
                'layout': layout,
                'folderEditMode': false,
                'details': _.device('touch') ? false : app.settings.get('showDetails', true),
                'searchActive': false
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
            app.listControl = new ListViewControl({ id: 'io.ox/files/listviewcontrol', listView: app.listView, app: app });
            var node = _.device('smartphone') ? app.pages.getPage('main') : app.getWindow().nodes.main;
            node.append(
                app.listControl.render().$el
                //#. items list (e.g. mails)
                .attr({
                    'aria-label': gt('Files')
                })
                .find('.toolbar')
                //#. toolbar with 'select all' and 'sort by'
                .attr('aria-label', gt('Files options'))
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
            // see Bug 43512 - Opening a Drive direct link in Safari removes the edit bar
            // hide and show sidepanel for correct layout. Somehow, scroll into view and flexbox-layout have errors (mostly in safari)
            app.folderView.tree.selection.view.on('scrollIntoView', function () {
                app.getWindow().nodes.sidepanel.hide().show(0);
            });

            app.on('folder:change', function (id) {
                // we clear the list now to avoid flickering due to subsequent layout changes
                app.listView.empty();
                var options = app.getViewOptions(id);
                app.props.set(options);
                // always trigger a change (see bug 41500)
                app.listView.model.set('folder', null, { silent: true });
                app.listView.model.set('folder', id);
            });

            app.on('folder-virtual:change', function (id) {
                app.listView.empty();
                var options = app.getViewOptions(id);
                app.props.set(options);

                app.listView.model.set(options);
                app.listView.model.set('folder', null, { silent: true });
                app.listView.model.set('folder', id);

            });
        },

        'getContextualData': function (app) {
            // get data required for toolbars and context menus
            // selection is array of cids
            app.getContextualData = function (selection, type) {
                // folder at the time the baton was created
                var folder_id = app.folder.get();

                // todo: check where and whether collection and allIds are needed
                var options = { folder_id: folder_id, app: app, allIds: [], originFavorites: false, originMyShares: false };
                switch (type) {
                    case 'favorites':
                        options.all = this.myFavoriteListView.collection;
                        options.originFavorites = true;
                        break;
                    case 'shares':
                        options.all = this.mysharesListView.collection;
                        options.originMyShares = true;
                        break;
                    default:
                        options.all = this.listView.collection;
                        break;
                }
                // turn cids into proper objects
                if (type === 'shares') {
                    options.models = selection.map(function (cid) {
                        return options.all.get(cid);
                    });
                } else {
                    options.models = api.resolve(selection, false);
                }
                options.data = _(options.models).invoke('toJSON');
                return options;
            };
        },

        /*
         * Respond to virtual myshares
         */
        'myshares-listview': function (app) {

            if (capabilities.has('guest')) return;
            if (!capabilities.has('gab || share_links')) return;

            // add virtual folder to folder api
            folderAPI.virtual.add('virtual/myshares', function () { return $.when([]); });

            var loading = false;

            app.folderView.tree.on({
                'virtual': function (id) {
                    if (id !== 'virtual/myshares') return;

                    app.folder.unset();
                    app.getWindow().setTitle(gt('My shares'));

                    if (app.mysharesListViewControl) {
                        app.mysharesListViewControl.$el.show().siblings().hide();
                        app.updateMyshareToolbar([]);
                        return;
                    }

                    app.getWindow().nodes.body.busy().children().hide();
                    if (loading) return;
                    loading = true;

                    require(['io.ox/files/share/listview', 'io.ox/files/share/api', 'io.ox/files/share/toolbar'], function (MySharesView, shareApi) {

                        app.mysharesListView = new MySharesView({
                            app: app,
                            pagination: false,
                            draggable: false,
                            ignoreFocus: true,
                            noSwipe: true,
                            noPullToRefresh: true
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

                        shareApi.on('remove:link new:link', _.debounce(function () {
                            app.mysharesListView.reload();
                        }), 10);

                        var toolbar = new ToolbarView({ point: 'io.ox/files/share/toolbar/links', title: app.getTitle() });

                        app.getWindow().nodes.body.prepend(
                            app.mysharesListViewControl.render().$el
                                .hide().addClass('myshares-list-control')
                                .prepend(toolbar.$el)
                        );

                        app.updateMyshareToolbar = function (selection) {
                            toolbar.setSelection(selection.map(_.cid), function () {
                                return this.getContextualData(selection, 'shares');
                            }.bind(this));
                        };

                        app.updateMyshareToolbar([]);

                        // update toolbar on selection change as well as any model change
                        app.mysharesListView.on('selection:change change', function () {
                            app.updateMyshareToolbar(app.mysharesListView.selection.get());
                        });

                        // show? (maybe user switched folder meanwhile)
                        if (app.folder.get() === null) {
                            app.mysharesListViewControl.$el.show().siblings().hide();
                        }

                        loading = false;
                    });
                },
                'change': function () {
                    if (app.mysharesListViewControl) {
                        app.mysharesListViewControl.$el.hide().siblings().show();
                        if (app.mysharesListView) {
                            // to get a notification when listView is rendered complete
                            app.mysharesListView.trigger('listview:shown');
                        }
                    }
                    if (loading) {
                        app.getWindow().nodes.body.idle().children().show();
                    }
                }
            });

            app.pages.getPage('main').on('myshares-folder-back', function () {
                app.folderView.tree.selection.getItems().removeClass('selected');
                app.folderView.tree.selection.set(folderAPI.getDefaultFolder('infostore'));
                app.mysharesListViewControl.$el.hide().siblings().show();
            });
        },

        /*
         * Respond to virtual favorites
         */
        'myfavorites-listview': function (app) {

            var loading = false;

            app.folderView.tree.on({

                'virtual': function (id) {

                    if (id !== 'virtual/favorites/infostore') return;

                    app.folder.unset();
                    app.getWindow().setTitle(gt('Favorites'));

                    if (app.myFavoritesListViewControl) {
                        app.myFavoritesListViewControl.$el.show().siblings().hide();
                        app.updateMyFavoritesToolbar([]);
                        return;
                    }

                    app.getWindow().nodes.body.busy().children().hide();
                    if (loading) return;
                    loading = true;

                    require(['io.ox/files/favorite/listview'], function (MyFavoriteView) {

                        app.myFavoriteListView = new MyFavoriteView({
                            app: app,
                            pagination: false,
                            draggable: false,
                            ignoreFocus: true,
                            noSwipe: true,
                            noPullToRefresh: true
                        });

                        app.myFavoritesListViewControl = new ListViewControl({
                            id: 'io.ox/files/favorite/myfavorites',
                            listView: app.myFavoriteListView,
                            app: app
                        });

                        var toolbar = new ToolbarView({ point: 'io.ox/files/toolbar/links', title: app.getTitle(), strict: false });

                        app.getWindow().nodes.body.prepend(
                            app.myFavoritesListViewControl.render().$el
                                .hide().addClass('myfavorites-list-control')
                                .prepend(toolbar.$el)
                        );

                        app.updateMyFavoritesToolbar = _.debounce(function (selection) {
                            toolbar.setSelection(selection.map(_.cid), function () {
                                var options = this.getContextualData(selection, 'favorites');
                                return options;
                            }.bind(this));
                        }, 10);

                        app.updateMyFavoritesToolbar([]);

                        // update toolbar on selection change as well as any model change
                        app.myFavoriteListView.on('selection:change change favorite:add favorite:remove', function () {
                            app.updateMyFavoritesToolbar(app.myFavoriteListView.selection.get());
                        });

                        // show? (maybe user switched folder meanwhile)
                        if (app.folder.get() === null) {
                            app.myFavoritesListViewControl.$el.show().siblings().hide();
                        }

                        loading = false;
                    });
                },
                'change': function () {
                    if (app.myFavoritesListViewControl) {
                        app.myFavoritesListViewControl.$el.hide().siblings().show();
                        app.myFavoriteListView.selection.clear();
                        if (app.mysharesListView) {
                            // to get a notification when listView is rendered complete
                            app.mysharesListView.trigger('listview:shown');
                        }
                    }
                    if (loading) {
                        app.getWindow().nodes.body.idle().children().show();
                    }
                }
            });

            app.pages.getPage('main').on('myfavorites-folder-back', function () {
                app.folderView.tree.selection.getItems().removeClass('selected');
                app.folderView.tree.selection.set(folderAPI.getDefaultFolder('infostore'));
                app.myFavoritesListViewControl.$el.hide().siblings().show();
            });
        },

        'attachmentViewUpdater': function (app) {
            var attachmentView = coreSettings.get('folder/mailattachments', {});
            if (_.isEmpty(attachmentView)) return;

            function expireAttachmentView() {
                _(attachmentView).each(function (folder) {
                    _(api.pool.getByFolder(folder)).each(function (collection) {
                        collection.expired = true;
                    });
                    if (app.folder.get() === folder) app.listView.reload();
                });
            }

            app.folderView.tree.on('change', expireAttachmentView);

            require(['io.ox/mail/api'], function (mailAPI) {
                mailAPI.on('delete new-mail copy update archive archive-folder', expireAttachmentView);
            });
        },

        /*
         * Store view options
         */
        'store-view-options': function (app) {
            app.props.on('change', _.debounce(function () {
                if (app.props.get('find-result')) return;
                var folder = app.folder.get() || 'virtual/myshares', data = app.props.toJSON();
                app.settings
                    .set(['viewOptions', folder], { sort: data.sort, order: data.order, layout: data.layout });
                if (_.device('!smartphone')) {
                    app.settings.set('showCheckboxes', data.checkboxes);
                }
                app.settings.set('showDetails', data.details);
                app.settings.save().fail(function (e) {
                    if (e.code !== 'SVL-0011' && _.keys(app.settings.get('viewOptions')).length < 2500) return;

                    return app.settings
                        .set('viewOptions', {})
                        .set(['viewOptions', folder], { sort: data.sort, order: data.order, layout: data.layout })
                        .save();
                });
            }, 500));
            app.listenTo(folderAPI, 'remove:infostore', function (folder) {
                // garbage collect viewOptions when removing folders
                // or we'll end up with Bug 66217
                var viewOptions = app.settings.get('viewOptions', {});
                delete viewOptions[folder.id];
                app.settings.set('viewOptions', viewOptions).save();
            });
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
            app.props.on('change:sort', function (m, value) {
                if (!app.treeView) return;
                // set proper order first
                var model = app.listView.model,
                    viewOptions = app.getViewOptions(app.treeView.selection.get());
                if (viewOptions) {
                    model.set('order', viewOptions.order, { silent: true });
                } else {
                    // set default
                    model.set('order', (/^(5|704)$/).test(value) ? 'desc' : 'asc', { silent: true });
                }
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

            function updateSidebar(list, currentTargetCID) {

                // do nothing if closed
                if (!sidebarView.open) return;

                if (app.listView.selection.isEmpty()) {
                    sidebarView.$('.detail-pane').empty().append(
                        $('<div class="io-ox-center">').append(
                            $('<div class="summary empty">').text(gt('No elements selected'))
                        )
                    );
                } else {

                    var item = currentTargetCID || app.listView.selection.get()[0];
                    var model;

                    if (/^folder\./.test(item)) {
                        // get folder
                        model = new api.Model(folderAPI.pool.getModel(item.replace(/^folder\./, '')).attributes);
                    } else {
                        model = app.listView.collection.get(item);
                    }

                    sidebarView.render(model);
                    sidebarView.$('img').trigger('appear.lazyload');
                    sidebarView.$('.sidebar-panel-thumbnail').attr('aria-label', gt('thumbnail'));
                }
            }
            app.listView.on('selection:change', updateSidebar);
            api.pool.get('detail').on('expired_models', function (ids) {
                if (sidebarView && sidebarView.model && _(ids).indexOf(sidebarView.model.cid) !== -1) {
                    updateSidebar();
                }
            });
        },

        /*
         * Respond to changed filter
         */
        'change:filter': function (app) {
            var ignoreFolderChange = false;
            app.props.on('change:filter', function (model, value) {
                app.listView.selection.selectNone();
                if (api.collectionLoader.setMimeTypeFilter(value === 'all' ? null : [value])) {
                    var id = app.listView.model.get('folder');
                    _(api.pool.getByFolder(id)).each(function (collection) {
                        collection.expired = true;
                    });
                    app.listView.empty();
                    var options = app.getViewOptions(id);
                    app.props.set(options);
                    app.listView.model.set('folder', null, { silent: true });
                    ignoreFolderChange = true;
                    app.listView.model.set('folder', id);
                    ignoreFolderChange = false;
                }
            });

            // reset filter on folder change
            app.on('folder:change', function () {
                if (!ignoreFolderChange) {
                    api.collectionLoader.setMimeTypeFilter(null);
                    app.props.set('filter', 'all');
                }
            });
        },

        // respond to resize events
        'resize': function (app) {

            if (_.device('smartphone')) return;

            var resizePending = false;

            $(window).on('resize', function () {

                var list = app.listView, width, layout, gridWidth, column;

                resizePending = true;

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
                list.el.className = list.el.className.replace(/\s?grid-\d+/g, '');
                list.$el.addClass('grid-' + column).attr('grid-count', column);

                resizePending = false;
            });

            $(window).trigger('resize');

            app.on('resume', function () {
                if (resizePending) $(window).trigger('resize');
            });
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
                    ox.ui.apps.trigger('layout', app);
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
                // simple id check for folders, prevents errors if folder id contains '.'
                var id = $(e.currentTarget).parent().attr('data-cid').replace(/^folder./, '');
                app.folder.set(id);
            });

            app.listView.$el.on(ev, '.list-item:not(.file-type-folder) .list-item-content', function (e) {
                var cid = $(e.currentTarget).parent().attr('data-cid'),
                    baton = ext.Baton(app.getContextualData([cid]));
                actionsUtil.invoke('io.ox/files/actions/default', baton);
            });
        },

        // open on pressing enter / space
        'selection-enter': function (app) {

            if (_.device('smartphone')) return;

            var ev = tabAPI.openInTabEnabled() ? 'keypress' : 'keydown';

            // folders
            app.listView.$el.on(ev, '.file-type-folder', function (e) {
                if (/13|32/.test(e.which)) {
                    e.preventDefault();
                    // simple id check for folders, prevents errors if folder id contains '.'
                    var id = $(e.currentTarget).attr('data-cid').replace(/^folder./, '');
                    app.listView.once('collection:load', function () {
                        app.listView.selection.select(0);
                    });
                    app.folder.set(id);
                }
            });

            // files
            app.listView.$el.on(ev, '.list-item:not(.file-type-folder)', function (e) {
                if (!/13|32/.test(e.which)) return;
                e.preventDefault();
                var baton = ext.Baton(app.getContextualData(app.listView.selection.get()));
                actionsUtil.invoke('io.ox/files/actions/default', baton);
            });
        },

        /*
         * Respond to API events that need a reload
         */
        'requires-reload': function (app) {
            // listen to events that affect the filename, description add files, or remove files
            api.on('rename description add:version remove:version change:version change:file', _.debounce(function (file) {
                // if file not in current folder displayed,
                if (file && file.folder_id && (file.folder_id !== app.folder.get())) {
                    api.pool.resetFolder(file.folder_id);
                } else {
                    app.listView.reload();
                }
            }, 100));
            // bug 53498
            api.on('reload:listview', _.debounce(function () {
                app.listView.selection.clear();
                app.listView.reload();
            }, 100));
            api.on('refresh:listviews', _.debounce(function () {
                ox.trigger('refresh^');
            }, 100));
            folderAPI.on('rename', _.debounce(function (id, data) {
                // if the renamed folder is inside the folder currently displayed, reload
                if (data.folder_id === app.folder.get()) {
                    app.listView.reload();
                } else {
                    ox.trigger('refresh^');
                }
            }, 100));
            // use throttled updates for add:file - in case many small files are uploaded
            api.on('add:file', _.throttle(function (file) {
                // if file not in current folder displayed,
                if (file && file.folder_id && (file.folder_id !== app.folder.get())) {
                    api.pool.resetFolder(file.folder_id);
                } else {
                    app.listView.reload();
                }
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
            // listen
            api.on('stop:upload', function (requests, files) {
                api.collectionLoader.collection.once('reload', function () {
                    $.when.apply(this, requests).done(function () {
                        var newItemsCid,
                            listView = app.listView,
                            selection = listView.selection,
                            // selection array to select after upload
                            itemsToSelect,
                            folderCids,
                            fileCids,
                            newfolderIds;

                        // all uploaded files
                        fileCids = _(arguments).map(_.cid);

                        // get all uploaded folders,
                        // using just the folder_ids of files doesn't work for nested empty folders
                        newfolderIds = _.unique(_.reduce(files, function (collector, obj) {
                            // cases to think about:
                            //  1. upload a folder with sub folders -> uploads are added to the queue per folder, but all folders are created before
                            //  2. add additional items to the upload queue during a currently running upload
                            var createdFoldersByUpload = _.property(['options', 'currentUploadInfo', 'createdFoldersByUpload'])(obj);
                            return collector.concat(createdFoldersByUpload);
                        }, []));
                        folderCids = _(newfolderIds).map(function (folder_id) { return listView.createFolderCompositeKey(folder_id); });
                        newItemsCid = fileCids.concat(folderCids);

                        itemsToSelect = selection.getItems(function () {
                            // add already rendered items to selection array
                            var position = newItemsCid.indexOf($(this).attr('data-cid'));
                            if (position >= 0) {
                                delete newItemsCid[position];
                            }
                            return position >= 0;
                        });

                        // limit selectable items to PRIMARY_PAGE_SIZE
                        var lastPosition = api.collectionLoader.PRIMARY_PAGE_SIZE - selection.getItems().length;
                        _.each(_.without(newItemsCid, undefined).slice(0, lastPosition > 0 ? lastPosition : 0), function (cid) {
                            var file = api.pool.get('detail').get(cid);
                            // select only if the current folder is the upload folder
                            if (file && app.folder.get() === file.get('folder_id')) {
                                if (cid) {
                                    app.listView.on('add:' + cid, function (model) {
                                        _.each(selection.getItems(), function (item) {
                                            if ($(item).attr('data-cid') === model.cid) {
                                                // add items to selection array after rendering
                                                itemsToSelect.push(item);
                                            }
                                        });
                                        // select all items from selectiona array after rendering
                                        selection.selectAll(itemsToSelect);
                                    });
                                }
                            }
                        });
                        // deselect all items
                        selection.selectNone();
                        selection.selectAll(itemsToSelect);
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
                    app.listView.reload({ pregenerate_previews: false });
                });
            });
        },

        'account:delete': function () {
            ox.on('account:delete', function (id) {
                if (!id || app.folder.get().indexOf(id) === -1) return;
                switchToDefaultFolder();
            });
        },

        /*
         *
         */
        'folder:add/remove': function (app) {

            folderAPI.on('create', function (data) {
                if (data.folder_id === app.folder.get()) app.listView.reload();

                // select created folder
                app.listView.on('add:' + _.cid(data), function (model) {
                    var cid = app.listView.getCompositeKey(model);
                    app.listView.selection.set([cid], true);
                });
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
         * change to default folder on no permission or folder not found errors
         */
        'folder-error': function (app) {
            app.folder.handleErrors();
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
            commons.addFolderViewToggle(app);
        },

        'premium-area': function () {

            ext.point('io.ox/files/sidepanel').extend({
                id: 'premium-area',
                index: 10000,
                draw: function (baton) {
                    this.append(
                        commons.addPremiumFeatures(baton.app, {
                            append: false,
                            upsellId: 'folderview/infostore/bottom',
                            upsellRequires: 'boxcom || google || microsoftgraph'
                        })
                    );
                }
            });
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
            if (_.device('smartphone') || !capabilities.has('search')) return;
            if (!app.isFindSupported()) return;
            app.initFind();

            function registerHandler(model, find) {
                find.on({
                    'find:query': function () {
                        // hide sort options
                        app.listControl.$el.find('.grid-options:first').hide();
                        app.props.set('searchActive', true);
                    },
                    'find:cancel': function () {
                        // show sort options again
                        app.listControl.$el.find('.grid-options:first').show();
                        app.props.set('searchActive', false);
                    }
                });
            }

            return app.get('find') ? registerHandler(app, app.get('find')) : app.once('change:find', registerHandler);
        },

        // respond to search results
        'find': function (app) {
            if (_.device('smartphone') || !app.get('find')) return;
            app.get('find').on({
                'find:query:result': function (response) {
                    api.pool.add('detail', response.results);
                    app.props.set('filter', 'all');
                }
            });
        },

        'contextual-help': function (app) {
            app.getContextualHelp = function () {
                var folder = this.folder.get() || this.treeView.selection.get() || '';
                if (folder.match(/^virtual\/myshares$/)) return 'ox.appsuite.user.sect.dataorganisation.sharing.drive.html';
                if (folder.match(/^maildrive:\/\/0/)) return 'ox.appsuite.user.sect.drive.view.attachments.html';
                return 'ox.appsuite.user.sect.drive.gui.html';
            };
        },

        'before-delete': function (app) {

            if (_.device('smartphone')) return;

            api.on('beforedelete', function (ids) {
                var selection = app.listView.selection;
                var cids = _.map(ids, _.cid);

                //intersection check for Bug 41861
                if (_.intersection(cids, selection.get()).length) {
                    // set the direction for dodge function
                    selection.getPosition();
                    // change selection
                    selection.dodge();
                    // optimization for many items
                    if (ids.length === 1) return;
                    // remove all DOM elements of current collection; keep the first item
                    app.listView.onBatchRemove(ids.slice(1));
                }
            });
        },

        'remove-file': function (app) {
            api.on('remove:file', function () {
                // trigger scroll after remove, if files were removed with select all we need to trigger a redraw or we get an empty view
                app.listView.$el.trigger('scroll');

                // When a file is removed the trash collection must be updated for showing the correct contextmenu entries
                var id = settings.get('folder/trash');
                if (id) {
                    folderAPI.get(id, { cache: false });
                }
            });
        },

        /*
         * Handle delete event based on keyboard shortcut or swipe gesture
         */
        'selection-delete': function () {
            app.listView.on('selection:delete', function (cids) {
                // turn cids into proper objects
                var list = _(api.resolve(cids, false)).invoke('toJSON');
                // Tested: false
                actionsUtil.invoke('io.ox/files/actions/delete', list);
            });
        },

        // register listView as dropzone (folders only)
        'listview-dropzone': function (app) {
            app.listView.$el
                .addClass('dropzone')
                .attr('data-dropzones', '.selectable.file-type-folder');
        },

        'sidepanel': function (app) {
            if (_.device('smartphone')) return;

            ext.point('io.ox/files/sidepanel').extend({
                id: 'tree',
                index: 100,
                draw: function (baton) {
                    // add border & render tree and add to DOM
                    this.addClass('border-right').append(baton.app.treeView.$el);
                }
            });

            var node = app.getWindow().nodes.sidepanel;
            ext.point('io.ox/files/sidepanel').invoke('draw', node, ext.Baton({ app: app }));
        },

        'metrics': function (app) {

            require(['io.ox/metrics/main'], function (metrics) {
                if (!metrics.isEnabled()) return;
                var nodes = app.getWindow().nodes,
                    control = nodes.body.find('.list-view-control > .generic-toolbar'),
                    sidepanel = nodes.sidepanel;
                metrics.watch({
                    node: sidepanel,
                    selector: '[data-action="add-storage-account"]',
                    type: 'click'
                }, {
                    app: 'drive',
                    target: 'folder/account',
                    type: 'click',
                    action: 'add'
                });

                function track(target, node) {
                    node = $(node);
                    var isSelect = !!node.attr('data-name'),
                        action = (node.attr('data-action') || '').replace(/^io\.ox\/files\/(detail\/)?/, '');
                    metrics.trackEvent({
                        app: 'drive',
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
                control.on('track', function (e, node) {
                    track('list/toolbar', node);
                });

                // folder tree action
                _.defer(function () {
                    sidepanel.find('.context-dropdown').on('mousedown', 'a', function (e) {
                        metrics.trackEvent({
                            app: 'drive',
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
                        app: 'drive',
                        target: 'folder/toolbar',
                        type: 'click',
                        action: $(e.currentTarget).attr('data-action')
                    });
                });
                // check for clicks in folder trew
                app.on('folder:change folder-virtual:change', function (folder) {
                    metrics.getFolderFlags(folder)
                        .then(function (list) {
                            metrics.trackEvent({
                                app: 'drive',
                                target: 'folder',
                                type: 'click',
                                action: 'select',
                                detail: list.join('/')
                            });
                        });
                });
                // selection in listview
                app.listView.on({
                    'selection:multiple selection:one': _.throttle(function (list) {
                        metrics.trackEvent({
                            app: 'drive',
                            target: 'list/' + app.props.get('layout'),
                            type: 'click',
                            action: 'select',
                            detail: list.length > 1 ? 'multiple' : 'one'
                        });
                    }, 100, { trailing: false })
                });
                // default action
                ox.on('action:invoke:io.ox/files/actions/default', function () {
                    metrics.trackEvent({
                        app: 'drive',
                        target: 'list/' + app.props.get('layout'),
                        type: 'click',
                        action: 'selection-doubleclick'
                    });
                });
            });
        },

        'select-file': function (app) {

            app.selectFile = function (obj) {
                obj = _.isString(obj) ? _.cid(obj) : obj;
                api.get(obj).done(function (model) {
                    var models = api.resolve(model, false),
                        baton = ext.Baton({ models: models, app: app, favorites: false, portal: true });
                    // Tested: false
                    actionsUtil.invoke('io.ox/files/actions/show-in-folder', baton);
                });
            };
        },

        'a11y': function (app) {
            // mail list: focus mail detail view on <enter>
            // mail list: focus folder on <escape>
            app.listView.$el.on('keydown', '.list-item', function (e) {
                // if a message is selected (mouse or keyboard) the focus is set on body
                if (e.which === 27) {
                    app.folderView.tree.$('.folder.selected').focus();
                    return false;
                }
            });
            // folder tree: focus list view on <enter>
            // folder tree: focus top-bar on <escape>
            app.folderView.tree.$el.on('keydown', '.folder', function (e) {
                // check if it's really the folder - not the contextmenu toggle
                if (!$(e.target).hasClass('folder')) return;
                if (e.which === 13) app.listView.restoreFocus(true);
                // if (e.which === 27) $('#io-ox-topbar .active-app > a').focus();
            });
        },

        // FLD-0003 -> permission denied
        //  => Bug 57149: error handling on permission denied
        // FLD-0008 -> not found
        //  => Bug 56943: error handling on external folder delete
        // FILE_STORAGE-0004 -> account missing
        //  => Bug 58354: error handling on account missing
        // FILE_STORAGE-0055
        //  => Bug 54793: error handling when folder does not exists anymore
        'special-error-handling': function (app) {
            app.listenTo(ox, 'http:error:FLD-0003 http:error:FLD-0008 http:error:FILE_STORAGE-0004 http:error:FILE_STORAGE-0055 CHECK_CURRENT_FOLDER', function (error, request) {
                var folder = request.params.parent || request.data.parent;
                if (!folder || folder !== this.folder.get()) return;
                if (folderAPI.isBeingDeleted(folder)) return;
                switchToDefaultFolder(error);
            });
        },

        'account-error-handling': function (app) {

            app.addAccountErrorHandler = function (folderId, callbackEvent, data, overwrite) {
                var node = app.treeView.getNodeView(folderId + '/'),
                    updateNode = function (node) {
                        node.showStatusIcon(gt('There is a problem with this account. Click for more information'), callbackEvent || 'checkAccountStatus', data || node.options.model_id, overwrite);
                    };
                if (node) {
                    updateNode(node);
                } else {
                    // wait for node to appear
                    app.treeView.on('appear:' + folderId + '/', function () {
                        node = app.treeView.getNodeView(folderId + '/');
                        if (node) updateNode(node);
                        app.treeView.off('appear:' + folderId + '/');
                    });
                }
            };

            function updateStatus(folderId) {
                var node = app.treeView.getNodeView(folderId + '/');
                if (!node) return;
                node.hideStatusIcon();
                node.render();
            }

            filestorageAPI.on('refresh:basicAccount', function (e, folderId) {
                updateStatus(folderId);
            });
        },

        'account-status-check': function () {

            filestorageAPI.getAllAccounts().done(function (data) {
                _.each(data.models, function (accountData) {
                    if (accountData.get('hasError') === true) {
                        app.addAccountErrorHandler(accountData.get('qualifiedId'), 'checkAccountStatus');
                    }
                });
            });

            app.treeView.on('checkAccountStatus', function () {
                ox.launch('io.ox/settings/main', { folder: 'virtual/settings/io.ox/settings/accounts' }).done(function () {
                    this.setSettingsPane({ folder: 'virtual/settings/io.ox/settings/accounts' });
                });
            });
        }
    });

    var switchToDefaultFolder = _.debounce(function (error) {
        var model = folderAPI.pool.getModel(app.folder.get());
        if (model && model.get('folder_id') !== undefined) folderAPI.list(model.get('folder_id'), { cache: false });
        app.folder.setDefault();
        if (!error) return;
        folderAPI.path(model.get('folder_id')).done(function (folder) {
            error.error += '\n' + _(folder).pluck('title').join('/');
            notifications.yell(error);
        });
    }, 1000, true);

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

        // see bug 41082 - fix for unrecognized -webkit-overflow-scrolling: touch
        function orientationChangeHandler() {
            var menu = $('body').find('ul.dropdown-menu:visible');
            menu.css('-webkit-overflow-scrolling', 'touch');
            menu.css('-webkit-overflow-scrolling', '');
        }

        app.registerGlobalEventHandler(window, 'orientationchange', orientationChangeHandler);

        commons.wirePerspectiveEvents(app);

        win.nodes.outer.on('selection:drop', function (e, _baton) {
            // baton data is array of cid
            // let's get a new baton through getContextualData
            var baton = ext.Baton(app.getContextualData(_baton.data));
            // ensure proper type
            baton.dropType = 'infostore';
            baton.target = _baton.target.replace(/^folder\./, '');
            // call move action (instead of API) to have visual error handlers
            actionsUtil.invoke('io.ox/files/actions/move', baton);
        });

        // fix missing default folder
        options.folder = options.folder || folderAPI.getDefaultFolder('infostore') || 9;

        // go!
        return commons.addFolderSupport(app, null, 'infostore', options.folder)
            .then(function () {
                app.mediate();
                win.show(function () {
                    // trigger grid resize
                    $(window).trigger('resize');
                });
            });
    });

    // set what to do if the app is started again
    // this way we can react to given options, like for example a different folder
    app.setResume(function (options) {
        // only consider folder option for now
        if (options && options.folder && options.folder !== this.folder.get()) {
            var appNode = this.getWindow();
            appNode.busy();
            return this.folder.set(options.folder).always(function () {
                appNode.idle();
            });
        }
        return $.when();
    });

    return {
        getApp: app.getInstance
    };
});
