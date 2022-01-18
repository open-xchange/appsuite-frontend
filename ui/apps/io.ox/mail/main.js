/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
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

define('io.ox/mail/main', [
    'io.ox/mail/util',
    'io.ox/mail/api',
    'io.ox/mail/compose/api',
    'io.ox/core/commons',
    'io.ox/mail/listview',
    'io.ox/core/tk/list-control',
    'io.ox/mail/threadview',
    'io.ox/core/extensions',
    'io.ox/backbone/views/actions/util',
    'io.ox/core/notifications',
    'io.ox/core/toolbars-mobile',
    'io.ox/core/page-controller',
    'io.ox/core/capabilities',
    'io.ox/core/folder/tree',
    'io.ox/core/folder/view',
    'io.ox/core/folder/api',
    'io.ox/backbone/mini-views/quota',
    'io.ox/backbone/views/action-dropdown',
    'io.ox/mail/categories/mediator',
    'io.ox/core/api/account',
    'gettext!io.ox/mail',
    'settings!io.ox/mail',
    'settings!io.ox/core',
    'io.ox/core/api/certificate',
    'io.ox/settings/security/certificates/settings/utils',
    'io.ox/mail/actions',
    'io.ox/mail/mobile-navbar-extensions',
    'io.ox/mail/mobile-toolbar-actions',
    'io.ox/mail/toolbar',
    'io.ox/mail/import',
    'less!io.ox/mail/style',
    'io.ox/mail/folderview-extensions'
], function (util, api, composeAPI, commons, MailListView, ListViewControl, ThreadView, ext, actionsUtil, notifications, Bars, PageController, capabilities, TreeView, FolderView, folderAPI, QuotaView, ActionDropdownView, categories, accountAPI, gt, settings, coreSettings, certificateAPI, certUtils) {

    'use strict';

    // application object
    var app = ox.ui.createApp({
        name: 'io.ox/mail',
        id: 'io.ox/mail',
        title: 'Mail'
    });

    // a11y: dumb approach to track recent keyboard usage
    var openMessageByKeyboard = false;

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

            // create 4 pages with toolbars and navbars
            app.pages.addPage({
                name: 'folderTree',
                navbar: new Bars.NavbarView({
                    baton: baton,
                    extension: 'io.ox/mail/mobile/navbar'
                })
            });

            app.pages.addPage({
                name: 'listView',
                startPage: true,
                navbar: new Bars.NavbarView({
                    baton: baton,
                    extension: 'io.ox/mail/mobile/navbar'
                }),
                toolbar: new Bars.ToolbarView({
                    baton: baton,
                    page: 'listView',
                    extension: 'io.ox/mail/mobile/toolbar'
                }),
                secondaryToolbar: new Bars.ToolbarView({
                    baton: baton,
                    page: 'listView/multiselect',
                    extension: 'io.ox/mail/mobile/toolbar'
                })
            });

            app.pages.addPage({
                name: 'threadView',
                navbar: new Bars.NavbarView({
                    baton: baton,
                    extension: 'io.ox/mail/mobile/navbar'
                }),
                toolbar: new Bars.ToolbarView({
                    baton: baton,
                    page: 'threadView',
                    extension: 'io.ox/mail/mobile/toolbar'
                })
            });

            app.pages.addPage({
                name: 'detailView',
                navbar: new Bars.NavbarView({
                    baton: baton,
                    extension: 'io.ox/mail/mobile/navbar'
                }),
                toolbar: new Bars.ToolbarView({
                    baton: baton,
                    page: 'detailView',
                    extension: 'io.ox/mail/mobile/toolbar'
                })
            });

            // destroy popovers
            app.pages.getPage('detailView').on('pagebeforehide', function () {
                $(this).find('.popover-open').popover('destroy');
            });

            // important
            // tell page controller about special navigation rules
            app.pages.setBackbuttonRules({
                'listView': 'folderTree',
                'threadView': 'listView'
            });
        },
        /*
         * Init all nav- and toolbar labels for mobile
         */
        'navbars-mobile': function (app) {

            if (!_.device('smartphone')) return;

            app.pages.getNavbar('listView')
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

            app.pages.getNavbar('threadView')
                .setTitle(gt('Thread'))
                .setLeft(gt('Back'));

            // TODO restore last folder as starting point
            app.pages.showPage('listView');
        },

        'toolbars-mobile': function () {
            if (!_.device('smartphone')) return;

            // tell each page's back button what to do
            app.pages.getNavbar('listView').on('leftAction', function () {
                app.pages.goBack();
            });
            app.pages.getNavbar('threadView').on('leftAction', function () {
                app.pages.goBack();
                app.listView.selection.selectNone();
            });
            app.pages.getNavbar('detailView').on('leftAction', function () {
                app.pages.goBack();
                app.listView.selection.selectNone();
            });

            // checkbox toggle
            app.pages.getNavbar('listView').on('rightAction', function () {
                app.props.set('checkboxes', !app.props.get('checkboxes'));
            });

        },

        'pages-desktop': function (app) {
            if (_.device('smartphone')) return;

            // add page controller
            app.pages = new PageController(app);

            // create 2 pages
            // legacy compatibility
            app.getWindow().nodes.main.addClass('vsplit');

            app.pages.addPage({
                name: 'listView',
                container: app.getWindow().nodes.main,
                classes: 'leftside'
            });
            app.pages.addPage({
                name: 'detailView',
                container: app.getWindow().nodes.main,
                classes: 'rightside'
            });

        },

        /*
         * Folder view support
         */
        'folder-view': function (app) {

            if (_.device('smartphone')) return;

            // tree view
            app.treeView = new TreeView({ app: app, module: 'mail', contextmenu: true });
            FolderView.initialize({ app: app, tree: app.treeView });
            app.folderView.resize.enable();
        },

        /*
         * Folder view support mobile
         */
        'folder-view-mobile': function (app) {

            if (_.device('!smartphone')) return app;

            var nav = app.pages.getNavbar('folderTree'),
                page = app.pages.getPage('folderTree');

            nav.on('rightAction', function () {
                app.toggleFolders();
            });

            var tree = new TreeView({ app: app, module: 'mail', root: '1', contextmenu: true });
            // initialize folder view
            FolderView.initialize({ app: app, tree: tree });
            page.append(tree.render().$el);
            app.treeView = tree;
        },

        'account-error-handling': function (app) {

            app.addAccountErrorHandler = function (folderId, callbackEvent, data, overwrite) {
                var node = app.treeView.getNodeView(folderId),
                    updateNode = function (node) {
                        //#. Shown as a tooltip when a mail account doesn't work correctly. Click brings user to the settings page
                        node.showStatusIcon(gt('There is a problem with this account. Click for more information'), callbackEvent || 'checkAccountStatus', data || node.options.model_id, overwrite);
                    };

                if (node) {
                    updateNode(node);

                } else {
                    // wait for node to appear
                    app.treeView.on('appear:' + folderId, function () {
                        node = app.treeView.getNodeView(folderId);

                        if (node) updateNode(node);

                        app.treeView.off('appear:' + folderId);
                    });
                }
            };
        },

        'folder-view-ssl-events': function (app) {

            if (coreSettings.get('security/acceptUntrustedCertificates') || !coreSettings.get('security/manageCertificates')) return;

            // open certificates page when the user clicks on error indicator
            app.treeView.on('accountlink:ssl', function () {
                ox.launch('io.ox/settings/main', { folder: 'virtual/settings/io.ox/certificate' });
            });

            // open examin dialig when the user clicks on error indicator
            app.treeView.on('accountlink:sslexamine', function (error) {
                certUtils.openExaminDialog(error);
            });
        },

        'folder-view-account-ssl-error': function (app) {

            function filterAccounts(hostname, data) {
                var accountData = [];
                _.each(data, function (account) {
                    if (_(_.values(account)).contains(hostname)) accountData.push(account);
                });
                return accountData;
            }

            function updateStatus(hostname, modus, error) {

                accountAPI.all().done(function (data) {
                    var relevantAccounts = hostname ? filterAccounts(hostname, data) : data;

                    _.each(relevantAccounts, function (accountData) {
                        accountAPI.getStatus(accountData.id).done(function (obj) {
                            var node = app.treeView.getNodeView(accountData.root_folder);

                            if (!node) return;

                            if (obj[accountData.id].status === 'invalid_ssl') {
                                var event = modus ? 'accountlink:sslexamine' : 'accountlink:ssl',
                                    data = modus ? error : node.options.model_id;

                                app.addAccountErrorHandler(accountData.root_folder, event, data);

                            } else if (!obj[accountData.id].status || obj[accountData.id].status === 'ok') {
                                node.hideStatusIcon();
                                node.render();
                            }

                        });
                    });

                });

            }

            ox.on('http:error SSL:remove', function (error) {
                if (/^SSL/.test(error.code)) {
                    certificateAPI.get({ fingerprint: error.error_params[0] }).done(function (data) {
                        if (_.isEmpty(data)) {
                            updateStatus(data.hostname, ['accountlink:sslexamine'], error);
                        } else {
                            updateStatus(data.hostname);
                        }

                    });
                }

            });

            accountAPI.on('refresh:ssl', function (e, hostname) {
                updateStatus(hostname);
            });

        },

        'account-status-check': function () {

            function checkAllAccounts() {
                $.when(accountAPI.all(), accountAPI.getStatus()).done(function (data, statusdata) {
                    var statushash = statusdata[0];
                    _.each(data, function (accountData) {
                        var status = (statushash[accountData.id] || {}).status;
                        if (['ok', 'deactivated'].indexOf(status) >= 0) {
                            var node = app.treeView.getNodeView(accountData.root_folder);
                            if (!node) return;
                            node.hideStatusIcon();
                        } else if (status !== 'ok') {
                            app.addAccountErrorHandler(accountData.root_folder, 'checkAccountStatus');
                        }
                    });
                });
            }

            accountAPI.on('account:recovered', checkAllAccounts);

            app.treeView.on('checkAccountStatus', function () {
                ox.launch('io.ox/settings/main', { folder: 'virtual/settings/io.ox/settings/accounts' }).done(function () {
                    this.setSettingsPane({ folder: 'virtual/settings/io.ox/settings/accounts' });
                });
            });

            checkAllAccounts();
        },

        'OAuth-reauthorize': function (app) {

            ox.on('account:reauthorized', function (account) {
                if (!account) return;

                var mailAccount = _(account.get('associations')).filter({ module: 'mail' })[0];
                if (!mailAccount) return;

                var node = app.treeView.getNodeView(mailAccount.folder);
                if (!node) return;
                node.hideStatusIcon();
            });
            require([
                'io.ox/oauth/keychain',
                'io.ox/oauth/reauth_handler'
            ]).then(function (keychain, reauthHandler) {
                ox.on('http:error:OAUTH-0040 http:error:MSG-0114', function (err) {
                    var account = keychain.accounts.get(err.error_params[reauthHandler.columnForError(err.code)]);
                    if (!account) return;
                    var mailAccount = _(account.get('associations')).filter({ module: 'mail' })[0];
                    if (!mailAccount) return;
                    app.addAccountErrorHandler(mailAccount.folder, 'OAuthReauthorize', { account: account, err: err }, true);
                });

                app.treeView.on('OAuthReauthorize', function (data) {
                    reauthHandler.showDialog(data.account, data.err);
                });
            });
        },

        'mail-quota': function (app) {

            if (_.device('smartphone')) return;

            var quota = new QuotaView({
                //#. Quota means a general quota for mail and files
                title: coreSettings.get('quotaMode', 'default') === 'unified' ? gt('Quota') : gt('Mail quota'),
                renderUnlimited: false,
                upsell: {
                    title: gt('Need more space?'),
                    requires: 'active_sync || caldav || carddav',
                    id: 'mail-folderview-quota',
                    icon: ''
                },
                upsellLimit: 5 * 1024 * 1024 // default upsell limit of 5 mb
            });
            // add some listeners
            folderAPI.on('cleared-trash', function () {
                quota.getQuota(true);
            });
            api.on('deleted-mails-from-trash', function () {
                quota.getQuota(true);
            });

            api.on('refresh.all', function () {
                quota.getQuota(true);
            });

            app.treeView.$el.append(
                quota.render().$el
            );
        },

        'select-all-actions': function () {
            // otherwise user would have wait for 'auto refresh'
            api.on('move deleted-mails archive', function () {
                if (!app.listView.collection.length) app.listView.reload();
            });
        },

        /*
         * Default application properties
         */
        'props': function (app) {

            function getLayout() {
                // enforce vertical on smartphones
                if (_.device('smartphone')) return 'vertical';
                var layout = app.settings.get('layout', 'vertical');
                // 'compact' only works on desktop properly
                if (layout === 'compact' && _.device('!desktop')) layout = 'vertical';
                return layout;
            }

            // introduce shared properties
            app.props = new Backbone.Model({
                'layout': getLayout(),
                'checkboxes': _.device('smartphone') ? false : app.settings.get('showCheckboxes', false),
                'contactPictures': _.device('smartphone') ? false : app.settings.get('showContactPictures', false),
                'textPreview': app.settings.get('showTextPreview', true),
                'exactDates': app.settings.get('showExactDates', false),
                'alwaysShowSize': app.settings.get('alwaysShowSize', false),
                'categories': app.settings.get('categories/enabled', false),
                'category_id': categories.getInitialCategoryId(),
                'mobileFolderSelectMode': false
            });
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
         * Add support for virtual folder "Unread"
         */
        'all-unseen': function (app) {

            var loader = api.collectionLoader,
                params = loader.getQueryParams({ folder: 'virtual/all-unseen' }),
                collection = loader.getCollection(params);

            // set special attributes
            collection.gc = false;
            collection.preserve = true;
            collection.CUSTOM_PAGE_SIZE = 250;

            // register load listener which triggers complete
            collection.on('load reload', function () {
                this.setComplete(true);
            });

            // use mail API's "all-unseen" event to update counter (that is also used in top-bar)
            var virtualAllSeen = folderAPI.pool.getModel('virtual/all-unseen');
            api.on('all-unseen', function (e, count) {
                virtualAllSeen.set('unread', count);
            });

            function loadAllUnseenMessages() {
                api.getAllUnseenMessages().done(function success(list) {
                    var folders = _(list).chain().filter(function (data) {
                        // rewrite folder_id and id
                        data.id = data.original_id;
                        data.folder_id = data.original_folder_id;
                        // drop messages from spam and trash
                        return !accountAPI.is('spam|confirmed_spam|trash', data.folder_id);
                    }).pluck('folder_id').uniq().value();
                    folderAPI.multiple(folders);
                });
            }

            function initAllMessagesFolder() {
                loadAllUnseenMessages();
                ox.on('refresh^', loadAllUnseenMessages);
            }

            if (settings.get('features/unseenFolder')) {
                if (settings.get('unseenMessagesFolder')) {
                    initAllMessagesFolder();
                } else {
                    settings.once('change:features/unseenFolder', initAllMessagesFolder);
                }
            }

            // make virtual folder clickable
            app.folderView.tree.selection.addSelectableVirtualFolder('virtual/all-unseen');
        },

        /*
        * make some special folders not selectable
        */
        'unselectable-folders': function () {
            // make shared root folder unclickable (not virtual but still not a true selectable folder)
            if (!accountAPI.cache[0]) return;
            var id = accountAPI.cache[0].root_folder + '/Shared';
            app.folderView.tree.selection.addUnselectableFolder(id);
        },

        /*
         * Split into left and right pane
         */
        'vsplit': function (app) {
            // replacing vsplit with new pageController
            // TODO: refactor app.left and app.right
            var left = app.pages.getPage('listView'),
                right = app.pages.getPage('detailView');

            app.left = left.toggleClass('border-right', _.device('!smartphone'));
            app.right = right.addClass('mail-detail-pane');
        },

        /*
         * Setup list view
         */
        'list-view': function (app) {
            app.listView = new MailListView({ swipe: true, app: app, draggable: true, ignoreFocus: true, selectionOptions: { mode: 'special' } });
            app.listView.model.set({
                folder: app.folder.get(),
                thread: app.settings.get('threadSupport', true)
            });
            // for debugging
            window.list = app.listView;
        },

        'list-view-checkboxes': function (app) {
            // always hide checkboxes on small devices initially
            if (_.device('smartphone')) return;
            app.listView.toggleCheckboxes(app.props.get('checkboxes'));
        },

        'list-view-checkboxes-mobile': function (app) {
            // always hide checkboxes on small devices initially
            if (!_.device('smartphone')) return;
            app.props.set('checkboxes', false);
            app.listView.toggleCheckboxes(false);
        },

        'react to markunread': function () {
            // relevant to preserve the unread status when using list perspective as there is no parallel detailview opened
            // if we would not save this state the mail would be marked as read when the detailview is opened without the user selecting a different mail
            api.on('after:refresh.unseen', function (e, list) {
                if (list.length === 1) api.setToUnread = list[0].cid;
            });
            // delete marker on selection change
            app.listView.on('selection:multiple selection:one', function () {
                delete api.setToUnread;
            });
            // delete marker on selection action wehn not in list perspective
            app.listView.on('selection:action', function () {
                if (app.props.get('layout') !== 'list') delete api.setToUnread;
            });
        },

        /*
         * Scroll-o-mat
         * Scroll to top if new unseen messages arrive
         */
        'auto-scroll': function (app) {
            app.listView.on('add', function (model, index) {
                // only for top position
                if (index !== 0) return;
                // only for unseen messages
                if (!util.isUnseen(model.toJSON())) return;
                // only scroll to top if scroll position is below 50% of outer height
                var height = app.listView.$el.height() / 2;
                if (app.listView.$el.scrollTop() > height) return;
                // scroll to top
                app.listView.$el.scrollTop(0);
            });
        },

        /*
         * Get folder-based view options
         */
        'get-view-options': function (app) {
            app.getViewOptions = function (folder) {
                var options = app.settings.get(['viewOptions', folder], {});
                if (!app.settings.get('threadSupport', true)) options.thread = false;
                // no thread support in drafts/sent folders. This breaks caching (Sent folders get incomplete threads). See OXUIB-853
                if (accountAPI.is('sent|drafts', folder)) options.thread = false;

                // ignore unavailable sort options
                var isUnavailable =
                    (!settings.get('features/flag/color') && options.sort === 102) ||
                    (!settings.get('features/flag/star') && options.sort === 660) ||
                    (options.sort === 610) ||
                    (options.sort === 602 && !folderAPI.pool.getModel(folder).supports('ATTACHMENT_MARKER'));
                if (isUnavailable) delete options.sort;

                return _.extend({ sort: 661, order: 'desc', thread: false }, options);
            };
        },

        /*
         * Set folderview property
         */
        'prop-folderview': function (app) {
            app.props.set('folderview', _.device('smartphone') ? false : app.settings.get('folderview/visible/' + _.display(), true));
        },

        /*
         * Respond to changed sort option
         */
        'change:sort': function (app) {
            app.props.on('change:sort', function (model, value) {
                model = app.listView.model;
                // resolve from-to
                if (value === 'from-to') value = accountAPI.is('sent|drafts', model.get('folder')) ? 604 : 603;
                // do not accidentally overwrite other attributes on folderchange
                if (!app.changingFolders) {
                    // set proper order first
                    model.set('order', (/^(610|661|608|102|660|651)$/).test(value) ? 'desc' : 'asc', { silent: true });
                    app.props.set('order', model.get('order'));
                }
                // now change sort columns
                model.set({ sort: value });
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

        /*
         * Respond to conversation mode changes
         */
        'change:thread': function (app) {
            app.props.on('change:thread', function (model, value) {
                if (!app.changingFolders && app.listView.collection) {
                    // Bug 58207: manual gc, delay to avoid visual distractions for the user
                    var collection = app.listView.collection;
                    _.defer(function () {
                        collection.reset();
                        collection.setComplete(false);
                    });
                }
                app.listView.model.set('thread', !!value);
            });
        },

        'isThreaded': function (app) {
            app.isThreaded = function () {
                if (app.listView.loader.mode === 'search') return false;
                return app.props.get('thread');
            };
        },

        'getContextualData': function (app) {
            // get data required for toolbars and context menus
            // selection is array of strings (cid)
            app.getContextualData = function (selection) {
                var isThreaded = app.isThreaded(),
                    data = api.resolve(selection, isThreaded);
                return { app: app, data: data, folder_id: app.folder.get(), isThread: isThreaded };
            };
        },

        /*
         * Store view options
         */
        'store-view-options': function (app) {
            app.props.on('change', _.debounce(function () {
                if (app.props.get('find-result')) return;
                var folder = app.folder.get(), data = app.props.toJSON();
                app.settings
                    .set(['viewOptions', folder], { sort: data.sort, order: data.order, thread: data.thread })
                    .set('showTextPreview', data.textPreview)
                    .set('showExactDates', data.exactDates)
                    .set('alwaysShowSize', data.alwaysShowSize)
                    .set('categories/enabled', data.categories);

                if (_.device('!smartphone')) {
                    app.settings.set('layout', data.layout)
                                .set('showCheckboxes', data.checkboxes)
                                .set('showContactPictures', data.contactPictures);
                }
                app.settings.save();
            }, 500));
        },

        /*
         * Restore view opt
         */
        'restore-view-options': function (app) {
            var data = app.getViewOptions(app.folder.get());
            // marker so the change:sort listener does not change other attributes (which would be wrong in that case)
            app.changingFolders = true;
            app.props.set(data);
            app.changingFolders = false;
        },

        /*
         * Setup list view control
         */
        'list-view-control': function (app) {
            app.listControl = new ListViewControl({ id: 'io.ox/mail', listView: app.listView, app: app });
            app.left.append(
                app.listControl.render().$el
                    .attr('aria-label', gt('Messages'))
                    .find('.toolbar')
                    //#. toolbar with 'select all' and 'sort by'
                    .attr('aria-label', gt('Messages options'))
                    .end()
            );
            // turn top toolbar into bottom toolbar on smartphones
            if (_.device('smartphone')) {
                app.listControl.$('.toolbar.bottom').hide();
                app.listControl.$('.toolbar.top').removeClass('top').addClass('bottom');
                app.listControl.$el.removeClass('toolbar-top-visible');
            }
            // make resizable
            app.listControl.resizable();
        },

        'textPreview': function (app) {

            // default is true (for testing) until we have cross-stack support
            var support = settings.get('features/textPreview', true);

            app.supportsTextPreview = function () {
                return support;
            };

            app.supportsTextPreviewConfiguration = function () {
                var id = app.folder.get();
                return support && (accountAPI.isPrimary(id) || id === 'virtual/all-unseen');
            };

            app.useTextPreview = function () {
                return app.supportsTextPreviewConfiguration() && app.props.get('textPreview');
            };

            app.on('resume', function () {
                // Viewport calculations are invalid when app is invisible (See Bug 58552)
                this.listView.fetchTextPreview();
            });
        },

        /*
         * Setup thread view
         */
        'thread-view': function (app) {
            if (_.device('smartphone')) return;
            app.threadView = new ThreadView.Desktop({ app: app });
            app.right.append(app.threadView.render().$el);
        },

        'thread-view-mobile': function (app) {
            if (!_.device('smartphone')) return;

            // showing single mails will be done with the plain desktop threadview
            app.threadView = new ThreadView.Mobile();
            app.threadView.$el.on('showmail', function (e) {
                var cid = $(e.target).data().cid;
                app.showMail(cid);
                app.pages.changePage('detailView');
            });

            app.pages.getPage('threadView').append(app.threadView.render().$el);

        },

        /*
         * Selection message
         */
        'selection-message': function (app) {
            app.right.append(
                $('<div class="io-ox-center multi-selection-message"><div class="message"></div></div>')
            );
        },

        /*
         * Connect thread view's top nagivation with list view
         */
        'navigation': function (app) {
            // react on thread view navigation
            app.threadView.on({
                back: function () {
                    app.right.removeClass('preview-visible');
                    app.listView.focus();
                },
                previous: function () {
                    app.listView.previous();
                },
                next: function () {
                    app.listView.next();
                }
            });
        },

        /*
         * Selection changes in list view should be reflected in thread view navigation
         */
        'position': function (app) {

            function update() {
                var list = app.listView;
                app.threadView.updatePosition(list.getPosition() + 1)
                    .togglePrevious(list.hasPrevious())
                    .toggleNext(list.hasNext());
            }

            app.listView.on('selection:action', update);

            update();
        },

        /*
         * Respond to folder change
         */
        'folder:change': function (app) {

            // close mail detail view in list-mode on folder selection
            app.folderView.tree.on('selection:action', function () {
                // bug only if detail view is actually visible (see bug 45597)
                if (app.props.get('layout') === 'list' && app.right.hasClass('preview-visible')) {
                    app.threadView.trigger('back');
                }
            });

            app.on('folder:change', function (id) {

                if (app.props.get('mobileFolderSelectMode')) return;

                // marker so the change:sort listener does not change other attributes (which would be wrong in that case)
                app.changingFolders = true;

                var options = app.getViewOptions(id);

                app.props.set(_.pick(options, 'sort', 'order', 'thread'));

                // explicitly update when set to from-to (see bug 44458)
                if (options.sort === 'from-to') {
                    app.listView.model.set('sort', accountAPI.is('sent|drafts', id) ? 604 : 603);
                }

                app.listView.model.set('folder', id);
                app.folder.getData();
                app.changingFolders = false;
            });
        },

        /*
         * Auto subscribe mail folders
         */
        'auto-subscribe': function (app) {

            function subscribe(data) {
                if (data.module !== 'mail') return;
                if (data.subscribed) {
                    app.folderView.tree.select(data.id);
                } else {
                    folderAPI.update(data.id, { subscribed: true }, { silent: true }).done(function () {
                        folderAPI.refresh().done(function () {
                            app.folderView.tree.select(data.id);
                        });
                    });
                }
            }

            app.folder.getData().done(subscribe);
            app.on('folder:change', function (id, data) { subscribe(data); });
        },

        /*
         * Change foldername on mobiles in navbar
         */
        'folder:change-mobile': function (app) {
            if (!_.device('smartphone')) return;
            app.on('folder:change', function () {
                if (app.props.get('mobileFolderSelectMode')) return;
                app.folder.getData().done(function (d) {
                    app.pages.getNavbar('listView').setTitle(d.title);
                });
            });
        },

        /*
         * Define basic function to show an email
         */
        'show-mail': function (app) {

            if (_.device('smartphone')) return;

            // This function just shows an email. Almost.
            // It has a little optimization to add some delay if a message
            // has recently beeen deleted. This addresses the use-case of
            // cleaning up a mailbox, i.e. deleting several messages in a row.
            // Without the delay, the UI would try to render messages that are
            // just about to be deleted as well.

            var recentDeleteEventCount = 0,
                eventTimer,
                messageTimer,
                latestMessage;

            app.recentDelete = function () {
                return recentDeleteEventCount > 0;
            };

            function show() {
                // check if message is still within the current collection
                if (!app.listView.collection.get(latestMessage)) return;
                app.threadView.autoSelect = app.autoSelect;
                delete app.autoSelect;
                app.threadView.show(latestMessage, app.isThreaded());
                // a11y: used keyboard?
                if (openMessageByKeyboard || app.props.get('layout') === 'list') {
                    openMessageByKeyboard = false;
                    // set focus
                    var items = app.threadView.$('.list-item'),
                        index = items.index(items.filter('.expanded'));
                    items.filter('.expanded:first').find('.body').visibleFocus();
                    // fix scroll position (focus might scroll down)
                    if (index === 0) app.threadView.$('.scrollable').scrollTop(0);
                }
            }

            // show instantly
            app.showMail = function (cid) {
                // remember latest message
                latestMessage = cid;
                // instant: no delete case
                if (!recentDeleteEventCount) return show();
                // instant: already drawn
                if (app.threadView.model && app.threadView.model.cid === cid) return show();
                // delay
                app.threadView.empty();
                clearTimeout(messageTimer);
                var delay = (recentDeleteEventCount - 1) * 1000;
                messageTimer = setTimeout(show, delay);
            };

            // add delay if a mail just got deleted
            api.on('beforedelete', function () {
                if (recentDeleteEventCount < 2) recentDeleteEventCount++;
                clearTimeout(eventTimer);
                eventTimer = setTimeout(function () { recentDeleteEventCount = 0; }, 4000);
            });
        },

        /*
         * Define basic function to show an email
         */
        'show-mail-mobile': function (app) {
            if (!_.device('smartphone')) return;
            app.showMail = function (cid) {
                // render mail view and append it to detailview's page
                app.pages.getPage('detailView')
                    .empty().append(app.threadView.renderMail(cid));
            };
        },

        /*
         * Define basic function to show an thread overview on mobile
         */
        'mobile-show-thread-overview': function (app) {
            // clicking on a thread will show a custom overview
            // based on a custom threadview only showing mail headers
            app.showThreadOverview = function (cid) {
                app.threadView.show(cid, app.isThreaded());
            };
        },

        /*
         * Define basic function to reflect empty selection
         */
        'show-empty': function (app) {
            app.showEmpty = function () {
                app.threadView.empty();
                app.right.find('.multi-selection-message .message').empty().append(
                    gt('No message selected')
                ).attr('id', 'mail-multi-selection-message');
            };
        },

        /*
         * Define function to reflect multiple selection
         */
        'show-multiple': function (app) {

            if (_.device('smartphone')) return;

            app.showMultiple = function (list) {
                app.threadView.empty();
                list = api.resolve(list, app.isThreaded());

                // check if a folder is selected
                var id = app.folder.get(),
                    model = folderAPI.pool.getModel(id),
                    total = model.get('total'),
                    search = app.get('find') && app.get('find').isActive();

                // defer so that all selection events are triggered (e.g. selection:all)
                _.defer(function () {
                    var count = $('<span class="number">').text(list.length).prop('outerHTML');
                    app.right.find('.multi-selection-message .message')
                        .empty()
                        .attr('id', 'mail-multi-selection-message')
                        .append(
                            // message
                            $('<div>').append(
                                // although we are in showMultiple, we could just have one message if selection mode is alternative
                                //#. %1$d is the number of selected messages
                                gt.ngettext('%1$d message selected', '%1$d messages selected', count, count)
                            ),
                            // inline actions
                            id && total > list.length && !search ?
                                $('<div class="inline-actions selection-message">').append(
                                    // although "total" is always greater than 1, "gt.ngettext" must be used to produce correct plural forms for some languages!
                                    gt.ngettext(
                                        'There is %1$d message in this folder; not all messages are displayed in the list currently.',
                                        'There are %1$d messages in this folder; not all messages are displayed in the list currently.',
                                        total, total
                                    )
                                ).hide()
                                : $()
                        );
                });
            };

            app.showSelectionMessage = function () {
                _.defer(function () {
                    app.right.find('.selection-message').show();
                });
            };
        },
        // && app.getWindowNode().find('.select-all').attr('aria-checked') === 'true'
        /*
         * Define function to reflect multiple selection
         */
        'show-multiple-mobile': function (app) {
            if (_.device('!smartphone')) return;

            app.showMultiple = function (list) {

                app.threadView.empty();
                if (list) {
                    list = api.resolve(list, app.isThreaded());
                    app.pages.getCurrentPage().navbar.setTitle(
                        //#. This is a short version of "x messages selected", will be used in mobile mail list view
                        gt('%1$d selected', list.length));
                    // re-render toolbar
                    app.pages.getCurrentPage().secondaryToolbar.render();
                } else {
                    app.folder.getData().done(function (d) {
                        app.pages.getCurrentPage().navbar.setTitle(d.title);
                    });
                }
            };
        },

        'page-change-detail-view-mobile': function () {
            app.pages.getPage('detailView').on('header_ready', function () {
                app.pages.changePage('detailView');
            });
        },

        'selection-mobile': function (app) {

            if (!_.device('smartphone')) return;
            app.listView.on({
                'selection:empty': function () {
                    if (app.props.get('checkboxes')) app.showMultiple(false);
                },
                'selection:one': function (list) {
                    if (app.props.get('checkboxes')) app.showMultiple(list);
                },
                'selection:multiple': function (list) {
                    if (app.props.get('checkboxes')) app.showMultiple(list);
                },
                'selection:action': function (list) {
                    var isDraftFolder = _.contains(accountAPI.getFoldersByType('drafts'), this.model.get('folder'));

                    if (app.listView.selection.get().length === 1 && !app.props.get('checkboxes')) {
                        // check for thread
                        var cid = list[0],
                            isThread = this.collection.get(cid).get('threadSize') > 1;

                        if (isDraftFolder) {
                            var data = _.cid(cid);
                            ox.registry.call('mail-compose', 'open', { type: 'edit', original: { folderId: data.folder_id, id: data.id } });
                        } else if (isThread) {
                            app.showThreadOverview(cid);
                            app.pages.changePage('threadView');
                        } else {
                            // no page change here, bound via event
                            app.showMail(cid);
                        }
                    }
                }
            });
        },

        /*
         * Respond to single and multi selection in list view
         */
        'selection': function (app) {

            if (_.device('smartphone')) return;

            function resetRight(className) {
                return app.right
                    .removeClass('selection-empty selection-one selection-multiple preview-visible'.replace(className, ''))
                    .addClass(className);
            }

            function resetLeft(className) {
                return app.left
                    .removeClass('selection-empty selection-one selection-multiple'.replace(className, ''))
                    .addClass(className);
            }

            var react = _.debounce(function (type, list) {

                if (app.props.get('layout') === 'list' && type === 'action') {
                    resetRight('selection-one preview-visible');
                    resetLeft('selection-one');
                    app.showMail(list[0]);
                    return;
                } else if (app.props.get('layout') === 'list' && type === 'one') {
                    //don't call show mail (an invisible detailview would be drawn which marks it as read)
                    resetRight('selection-one');
                    resetLeft('selection-one');
                    return;
                }

                switch (type) {
                    case 'empty':
                        resetRight('selection-empty');
                        resetLeft('selection-empty');
                        app.showEmpty();
                        break;
                    case 'one':
                    case 'action':
                        resetRight('selection-one');
                        resetLeft('selection-one');
                        app.showMail(list[0]);
                        break;
                    case 'multiple':
                        resetRight('selection-multiple');
                        resetLeft('selection-multiple');
                        app.showMultiple(list);
                        break;
                    // no default
                }
            }, 1);

            app.listView.on({
                'selection:empty': function () {
                    app.right.find('.multi-selection-message div').attr('id', null);
                    react('empty');
                },
                'selection:one': function (list) {
                    app.right.find('.multi-selection-message div').attr('id', null);
                    var type = 'one';
                    if (app.listView.selection.getBehavior() === 'alternative') {
                        type = 'multiple';
                    }
                    react(type, list);
                },
                'selection:multiple': function (list) {
                    app.right.find('.multi-selection-message div').attr('id', null);
                    // no debounce for showMultiple or screenreaders read old number of selected messages
                    resetRight('selection-multiple');
                    resetLeft('selection-multiple');
                    app.showMultiple(list);
                },
                'selection:action': function (list) {
                    app.right.find('.multi-selection-message div').attr('id', null);
                    // make sure we are not in multi-selection
                    if (app.listView.selection.get().length === 1) react('action', list);
                },
                'selection:showHint': function () {
                    // just enable the info text in rightside
                    app.showSelectionMessage();
                }
            });
        },

        'preserve-selection': function (app) {
            if (_.device('smartphone')) return;
            app.listView.on({
                'selection:add': function (list) {
                    // only preserve items, if the current collection is sort by unread
                    if (app.props.get('sort') !== 651) return;
                    _(list).each(function (cid) {
                        api.pool.preserveModel(cid, true);
                    });
                },
                'selection:remove': function (list) {
                    _(list).each(function (cid) {
                        api.pool.preserveModel(cid, false);
                    });
                }
            });
        },

        /*
         * Thread view navigation must respond to changing layout
         */
        'change:layout': function (app) {
            app.props.on('change:layout', function (model, value) {
                app.threadView.toggleNavigation(value === 'list');
                ox.ui.apps.trigger('layout', app);
            });

            app.threadView.toggleNavigation(app.props.get('layout') === 'list');
        },

        /*
         * Respond to changing layout
         */
        'apply-layout': function (app) {
            if (_.device('smartphone')) return;
            app.applyLayout = function () {

                var layout = app.props.get('layout'), nodes = app.getWindow().nodes, toolbar, categoriesToolbar, className,
                    savedWidth = app.settings.get('listview/width/' + _.display()),
                    savedHeight = app.settings.get('listview/height/' + _.display());

                function applyWidth(x) {
                    var width = x === undefined ? '' : x + 'px';
                    app.right.css('left', width);
                    app.left.css('width', width);
                }

                function applyHeight(x) {
                    var height = x === undefined ? '' : x + 'px';
                    app.right.css('top', height);
                    app.left.css('height', height);
                }

                // remove inline styles from using the resize bar
                app.left.css({ width: '', height: '' });
                app.right.css({ left: '', top: '' });

                if (layout === 'vertical' || layout === 'compact') {
                    nodes.main.addClass('preview-right').removeClass('preview-bottom preview-none');
                    if (!_.device('touch')) applyWidth(savedWidth);
                } else if (layout === 'horizontal') {
                    nodes.main.addClass('preview-bottom').removeClass('preview-right preview-none');
                    if (!_.device('touch')) applyHeight(savedHeight);
                } else if (layout === 'list') {
                    nodes.main.addClass('preview-none').removeClass('preview-right preview-bottom');
                }

                // relocate toolbar
                toolbar = nodes.body.find('.classic-toolbar-container');
                categoriesToolbar = nodes.body.find('.categories-toolbar-container');
                className = 'classic-toolbar-visible';

                if (layout === 'compact') {
                    nodes.body.removeClass(className);
                    app.right.addClass(className).prepend(toolbar);
                    if (categoriesToolbar.length > 0) {
                        app.right.prepend(categoriesToolbar);
                    }
                } else {
                    app.right.removeClass(className);
                    nodes.body.addClass(className).prepend(toolbar);
                    if (categoriesToolbar.length > 0) {
                        nodes.body.prepend(categoriesToolbar);
                    }
                }

                if (layout !== 'list' && app.props.previousAttributes().layout === 'list' && !app.right.hasClass('preview-visible')) {
                    // listview did not create a detailview for the last mail, it was only selected, so detailview needs to be triggered manually(see bug 33456)
                    // only trigger if we actually have selected mails
                    if (app.listView.selection.get().length > 0) {
                        app.listView.selection.selectEvents(app.listView.selection.getItems());
                    }
                }

                this.listControl.applySizeConstraints();
            };

            app.props.on('change:layout', function () {
                // check if view dropdown has focus and restore the focus after rendering
                var body = app.getWindow().nodes.body,
                    focus = body.find('*[data-dropdown="view"] a:first').is(':focus');
                app.applyLayout();
                app.listView.redraw();
                if (focus) body.find('*[data-dropdown="view"] a:first').focus();
            });

            app.getWindow().on('show:initial', function () {
                app.applyLayout();
            });
        },

        /*
         * Respond to global refresh
         */
        'refresh': function (app) {
            api.on('refresh.all', function reload() {
                app.listView.reload();
            });
        },

        /*
         * Respond total/unread number changes when folder is reloaded (this may happen independent from refresh)
         */
        'reloadOnFolderChange': function (app) {
            api.on('changesAfterReloading', function reload() {
                app.listView.reload();
            });
        },

        /*
         * auto select first seen email (only on initial startup)
         */
        'auto-select': function (app) {

            // no auto-selection needed on smartphones
            if (!settings.get('autoselectMailOnStart', true) || _.device('smartphone')) return;

            var select = function () {
                app.listView.collection.find(function (model, index) {
                    if (!util.isUnseen(model.get('flags'))) {
                        app.autoSelect = true;
                        // select but keep focus in topbar. Don't use set here, as it breaks alternative selection mode (message is selected instead of displayed)
                        app.listView.selection.select(index, false, false);
                        // scroll node into view
                        app.listView.selection.getItems().eq(index).attr('tabindex', '0').intoViewport();
                        return true;
                    }
                });
            };

            app.listView.on('first-reset', function () {
                if (app.props.get('layout') === 'list') {
                    app.props.once('change:layout', function () {
                        if (app.listView.selection.get().length) return;
                        // defer to have a visible window
                        _.defer(select);
                    });
                    return;
                }
                // defer to have a visible window
                _.defer(select);
            });
        },

        'init-navbarlabel-mobile': function (app) {
            if (!_.device('smartphone')) return;

            // prepare first start
            app.listView.on('first-reset', function () {
                app.folder.getData().done(function (d) {
                    app.pages.getNavbar('listView').setTitle(d.title);
                });
            });
        },

        /*
         * Prefetch first n relevant (unseen) emails
         */
        'prefetch': function (app) {

            var count = settings.get('prefetch/count', 5);
            if (!_.isNumber(count) || count <= 0) return;

            app.prefetch = function (collection) {
                // get first 10 undeleted emails
                var http = require('io.ox/core/http');
                http.pause();
                collection.chain()
                    .filter(function (obj) {
                        return !util.isDeleted(obj);
                    })
                    .slice(0, count)
                    .each(function (model) {
                        var thread = model.get('thread') || [model.toJSON()], i, obj;
                        for (i = thread.length - 1; obj = thread[i]; i--) {
                            // get data
                            if (_.isString(obj)) obj = _.cid(obj);
                            // most recent or first unseen? (in line with threadview's autoSelectMail)
                            if ((i === 0 || util.isUnseen(obj)) && !util.isDeleted(obj)) {
                                api.get({ folder: obj.folder_id, id: obj.id, unseen: true });
                                break;
                            }
                        }
                    });
                http.resume();
            };

            app.listView.on('first-reset', app.prefetch);
        },

        'prefetch-message': function (app) {

            if (_.device('smartphone')) return;
            if (!settings.get('prefetch/next', true)) return;

            app.listView.on('selection:one', function () {

                // do not prefetch if a message has just been deleted
                if (app.recentDelete()) return;

                var items = this.selection.getItems(),
                    pos = this.selection.getPosition(items),
                    dir = this.selection.getDirection(),
                    last = items.length - 1, next;

                if (dir === 'down' && pos < last) next = items.eq(pos + 1);
                else if (dir === 'up' && pos > 0) next = items.eq(pos - 1);
                if (next) {
                    next = _.cid(next.attr('data-cid'));
                    next.unseen = true;
                    api.get(next);
                }
            });
        },

        /*
         * Prefetch mail-compose code
         */
        'prefetch-compose': function () {
            if (_.device('smartphone')) return;
            setTimeout(function () {
                require(['io.ox/mail/compose/main', 'io.ox/mail/compose/bundle'], function () {
                    require(['io.ox/core/api/snippets'], function (snippets) {
                        // prefetch signatures
                        snippets.getAll();
                    });
                });
            }, 3000);
        },

        /*
         * Connect collection loader with list view
         */
        'connect-loader': function (app) {
            app.listView.connect(api.collectionLoader);
        },

        /*
         * Select next item in list view if current item gets deleted
         */
        'before-delete': function (app) {

            // fixes scrolling issue on mobiles during delete
            if (_.device('smartphone')) return;
            if (!settings.get('features/selectBeforeDelete', true)) return;

            function isSingleThreadMessage(ids, selection) {
                if (ids.length !== 1) return false;
                if (selection.length !== 1) return false;
                var a = _.cid(ids[0]), b = String(selection[0]).replace(/^thread\./, '');
                return a !== b;
            }

            api.on('beforedelete beforeexpunge', function (e, ids) {
                var selection = app.listView.selection.get();
                if (isSingleThreadMessage(ids, selection)) return;
                // make sure to have strings
                if (ids.length > 0 && !_.isString(ids[0])) ids = _(ids).map(_.cid);
                // looks for intersection
                if (_.intersection(ids, selection).length) {
                    app.listView.selection.dodge();
                    // we might have removed the mail defining the thread, so we need to refresh
                    // the list or the thread will be gone until next refresh
                    if (app.isThreaded()) api.one('deleted-mails', function () { app.listView.reload(); });
                    if (ids.length === 1) return;
                    app.listView.onBatchRemove(ids.slice(1));
                }
            });
        },

        'before-delete-mobile': function (app) {
            if (!_.device('smartphone')) return;
            // if a mail will be deleted in detail view, go back one page
            api.on('beforedelete', function () {
                if (app.pages.getCurrentPage().name === 'detailView') {
                    // check if the threadoverview is empty
                    if (app.isThreaded() && app.threadView.collection.length === 1) {
                        app.pages.changePage('listView', { animation: 'slideright' });
                    } else {
                        app.pages.goBack();
                    }
                }
                app.listView.selection.selectNone();
            });
        },

        /*
         * Add support for drag & drop
         */
        'drag-drop': function () {
            app.getWindow().nodes.outer.on('selection:drop', function (e, _baton) {
                var baton = ext.Baton(app.getContextualData(_baton.data));
                baton.target = _baton.target;
                actionsUtil.invoke('io.ox/mail/actions/move', baton);
            });
        },

        /*
         * Handle archive event based on keyboard shortcut
         */
        'selection-archive': function () {
            // selection is array of strings (cid)
            app.listView.on('selection:archive', function (selection) {
                var baton = ext.Baton(app.getContextualData(selection));
                actionsUtil.invoke('io.ox/mail/actions/archive', baton);
            });
        },

        /*
         * Handle delete event based on keyboard shortcut or swipe gesture
         */
        'selection-delete': function () {
            app.listView.on('selection:delete', function (selection, shiftDelete) {
                var baton = ext.Baton(app.getContextualData(selection));
                baton.options.shiftDelete = shiftDelete;
                actionsUtil.invoke('io.ox/mail/actions/delete', baton);
            });
        },

        /*
         * Add support for selection:
         */
        'selection-doubleclick': function (app) {
            // detail app does not make sense on small devices
            // they already see emails in full screen
            if (_.device('smartphone')) return;
            app.listView.on('selection:doubleclick', function (list) {
                if (app.props && app.props.get('layout') === 'list') return;
                if (app.isThreaded()) list = _(api.threads.get(list[0])).pluck('cid');
                var cid = list[0],
                    obj = _.cid(cid),
                    isDraft = accountAPI.is('drafts', obj.folder_id);
                if (isDraft) {
                    api.get(obj).then(function (data) {
                        actionsUtil.invoke('io.ox/mail/actions/edit', data);
                    });
                } else {
                    ox.launch('io.ox/mail/detail/main', { cid: cid });
                }
            });
        },

        /*
         * Add support for selection:
         */
        'selection-mobile-swipe': function (app) {

            if (_.device('!smartphone')) return;

            ext.point('io.ox/mail/mobile/swipeButtonMore').extend({
                draw: function (baton) {
                    new ActionDropdownView({ el: this, point: 'io.ox/mail/links/inline' })
                    .setSelection(baton.array(), { data: baton.array(), app: app, isThread: baton.isThread });
                }
            });

            app.listView.on('selection:more', function (list, node) {
                var baton = ext.Baton({ data: list });
                // remember if this list is based on a single thread
                baton.isThread = baton.data.length === 1 && /^thread\./.test(baton.data[0]);
                // resolve thread
                baton.data = api.resolve(baton.data, app.isThreaded());
                // call action
                // we open a dropdown here with options.
                ext.point('io.ox/mail/mobile/swipeButtonMore').invoke('draw', node, baton);
                node.find('a.dropdown-toggle').click();
            });
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
            if (app.listView.selection.getBehavior() === 'alternative') {
                app.listView.toggleCheckboxes(true);
            } else {
                app.props.on('change:checkboxes', function (model, value) {
                    app.listView.toggleCheckboxes(value);
                });
            }
        },

        /*
         * Respond to change:checkboxes on mobiles
         * Change "edit" to "cancel" on button
         */
        'change:checkboxes-mobile': function (app) {
            if (_.device('!smartphone')) return;

            // intial hide
            app.listControl.$el.toggleClass('toolbar-bottom-visible', false);

            app.props.on('change:checkboxes', function (model, value) {
                app.listView.toggleCheckboxes(value);
                app.listControl.$el.toggleClass('toolbar-bottom-visible', value);
                if (value) {
                    app.pages.getNavbar('listView')
                        .setRight(gt('Cancel'))
                        .hide('.left');
                } else {
                    app.pages.getNavbar('listView')
                        .setRight(gt('Edit'))
                        .show('.left');
                    // reset navbar title on cancel
                    app.folder.getData().done(function (d) {
                        app.pages.getCurrentPage().navbar.setTitle(d.title);
                    });

                    // reset selection
                    app.listView.selection.selectNone();
                }
            });
        },

        /*
         * Respond to change of view options that require redraw
         */
        'change:viewOptions': function (app) {

            app.props.on('change:contactPictures change:exactDates change:alwaysShowSize change:textPreview', function () {
                app.listView.redraw();
                app.listView.$el.trigger('scroll');
                toggleClasses();
            });

            // update classes on folder change, e.g. text preview is not available for external accounts
            app.on('folder:change', toggleClasses);

            toggleClasses();

            function toggleClasses() {
                app.listView.$el
                    .toggleClass('show-contact-pictures', app.props.get('contactPictures'))
                    .toggleClass('show-text-preview', app.useTextPreview());
            }
        },

        'fix-mobile-lazyload': function (app) {
            if (_.device('!smartphone')) return;
            // force lazyload to load, otherwise the whole pane will stay empty...
            app.pages.getPage('detailView').on('pageshow', function () {
                $(this).scrollTop(0);
                $(this).find('li.lazy').trigger('scroll');
            });
        },

        'inplace-find': function (app) {
            if (_.device('smartphone') || !capabilities.has('search')) return;
            if (!app.isFindSupported()) return;
            app.initFind();

            function registerPoolAdd(model, find) {
                find.on('collectionLoader:created', function (loader) {
                    loader.each = function (obj) {
                        api.pool.add('detail', obj);
                    };
                });
            }

            return app.get('find') ? registerPoolAdd(app, app.get('find')) : app.once('change:find', registerPoolAdd);
        },
        // respond to pull-to-refresh in mail list on mobiles
        'on:pull-to-refresh': function (app) {
            if (_.device('!touch')) return;
            app.on('pull-to-refresh', function () {
                api.refresh().always(function () {
                    app.listView.removePullToRefreshIndicator();
                });
            });
        },

        'contextual-help': function (app) {
            app.getContextualHelp = function () {
                return 'ox.appsuite.user.sect.email.gui.html';
            };
        },

        'a11y': function (app) {
            app.listView.$el.attr('aria-label', gt('List view'));
            // mail list: focus mail detail view on <enter>
            // mail list: focus folder on <escape>
            app.listView.$el.on('keydown', '.list-item', function (e) {
                // focus message?
                if (e.which === 13) {
                    openMessageByKeyboard = true;
                    return;
                }
                // if a message is selected (mouse or keyboard) the focus is set on body
                if (e.which === 27) {
                    app.folderView.tree.$('.folder.selected').focus();
                    return false;
                }
            });
            // detail view: return back to list view via <escape>
            app.threadView.$el.on('keydown', function (e) {
                if (e.which !== 27) return;
                if ($(e.target).is('.dropdown-toggle, :input')) return;
                // make sure the detail view closes in list layout
                app.right.removeClass('preview-visible');
                app.listView.restoreFocus(true);
            });
            // folder tree: focus list view on <enter>
            app.folderView.tree.$el.on('keydown', '.folder', function (e) {
                // check if it's really the folder - not the contextmenu toggle
                if (!$(e.target).hasClass('folder')) return;
                if (e.which === 13) app.listView.restoreFocus(true);
            });
        },

        'auto-expunge': function (app) {

            if (!settings.get('features/autoExpunge', false)) return;

            function isDeleted(model) {
                return (model.get('flags') & 2) === 2;
            }

            app.listView.on('collection:load collection:paginate collection:reload', function () {
                // any deleted message?
                var any = this.collection.any(isDeleted);
                if (any) api.expunge(app.folder.get());
            });
        },

        /*
         * change to default folder on no permission or folder not found errors
         */
        'folder-errors': function (app) {
            // will be thrown if the external mail account server somehow does not support starttls anymore
            folderAPI.on('error:MSG-0092', function (error) {
                notifications.yell(error);
            });
            app.folder.handleErrors();

            // deactivated secondary mail account
            ox.on('account:status', function (data) {
                if (!data.deactivated) return;
                if (app.folder.get().indexOf(data.root_folder) < 0) return;
                app.folder.setDefault();
            });
        },

        // drafts deleted outside of this client
        'composition-spaces': function () {

            api.on('deleted-mails', function (e, ids) {
                if (_.some(ids, function (mail) { return ox.ui.spaces[mail.cid]; })) _.delay(refresh, 1000);
            });

            ox.on('refresh^', refresh);
            composeAPI.on('refresh', refresh);
            function refresh() {
                var activespaces = {};
                composeAPI.space.all().then(function transform(list) {
                    return _.chain(list).map(function (space) {
                        activespaces[space.cid] = {
                            //#. $1$s is the subject of an email
                            description: gt('Mail: %1$s', space.subject || gt('No subject')),
                            floating: true,
                            id: space.id + Math.random().toString(16),
                            cid: space.cid,
                            keepOnRestore: false,
                            module: 'io.ox/mail/compose',
                            point: space,
                            timestamp: new Date().valueOf(),
                            ua: navigator.userAgent
                        };
                        return activespaces[space.cid];
                    }).filter(function (space) {
                        // filter out already loaded ones
                        return !ox.ui.apps.getByCID(space.cid);
                    }).value();
                }).then(function (list) {
                    // add new ones
                    return ox.ui.App.restoreLoad({ spaces: list });
                }).then(function () {
                    // look for removed spaces
                    _.each(ox.ui.App.get('io.ox/mail/compose'), function (app) {
                        var space = activespaces[app.cid];
                        // update taskbar items title (changed outside client)
                        if (space && space.point) {
                            var model = getTaskBarModel(space.point.cid);
                            if (model) model.set('title', space.description);
                        }
                        // update state
                        return space ?
                            app.resume(space) :
                            app.onError({ code: 'UI-SPACEMISSING' });
                    });
                }).catch(function (e) {
                    if (ox.debug) console.error(e);
                });
            }

            function getTaskBarModel(cid) {
                return _.find(ox.ui.floatingWindows.models, function (model) {
                    return model.get('cid') === cid;
                });
            }
        },

        'database-drafts': function () {
            // edit of existing draft
            composeAPI.on('before:send before:save', function (id, data) {
                var editFor = data.meta.editFor;
                if (!editFor || data.mailPath) return;

                var cid = _.cid({ id: editFor.originalId, folder_id: editFor.originalFolderId }),
                    draftsId = accountAPI.getFoldersByType('drafts');
                _(draftsId).each(function (id) {
                    _(api.pool.getByFolder(id)).each(function (collection) {
                        collection.remove(cid);
                    });
                });
            });
            // new draft created
            composeAPI.on('after:save', function (data) {
                if (data.mailPath) return;
                var folder = app.folder.get();
                if (accountAPI.is('drafts', folder)) app.listView.reload();
            });
            // existing draft removed
            composeAPI.on('after:send', function (data) {
                var editFor = data.meta.editFor;
                if (!editFor || data.mailPath) return;
                var folder = app.folder.get();
                if (accountAPI.is('drafts', folder)) app.listView.reload();
            });
        },

        'real-drafts': function () {
            // edit of existing draft
            composeAPI.on('before:send', function removeFromPool(space, data) {
                if (!data.mailPath) return;
                var id = (data.mailPath || {}).id,
                    folder = (data.mailPath || {}).folderId;
                _(api.pool.getByFolder(folder)).each(function (collection) {
                    collection.remove(_.cid({ id: id, folder_id: folder }));
                });
            });

            // update
            composeAPI.on('after:send after:update after:remove after:save add mailref:changed', function refreshFolder(data, result) {
                var mailPath = data.mailPath || result.mailPath;
                if (!mailPath) return;
                // immediate reload when currently selected
                var folder = app.folder.get();
                if (accountAPI.is('drafts', folder)) return app.listView.reload();
                // delayed reload on next select

                _(api.pool.getByFolder(mailPath.folderId)).each(function (collection) {
                    collection.expire();
                });
            });
        },

        'mail-progress': function () {
            if (_.device('smartphone')) return;
            ext.point('io.ox/mail/sidepanel').extend({
                id: 'progress',
                index: 300,
                draw: function () {

                    var $el = $('<div class="generic-toolbar bottom mail-progress">')
                        .hide()
                        .append(
                            $('<div class="progress">').append(
                                $('<div class="progress-bar">')
                            ),
                            $('<div class="caption">').append(
                                $('<span>'),
                                $('<a href="#" class="close" data-action="close" role="button">').attr('aria-label', gt('Close')).append(
                                    $('<i class="fa fa-times" aria-hidden="true">').attr('title', gt('Close'))
                                )
                            )
                        );
                    composeAPI.queue.collection.on('progress', function (data) {
                        if (!data.count) {
                            // Workaround for Safari flex layout issue (see bug 46496)
                            if (_.device('safari')) $el.closest('.window-sidepanel').find('.folder-tree')[0].scrollTop += 1;
                            return $el.hide();
                        }
                        var n = data.count,
                            pct = Math.round(data.pct * 100),
                            //#. %1$d is number of messages; %2$d is progress in percent
                            caption = gt.ngettext('Sending %1$d message ... %2$d%', 'Sending %1$d messages ... %2$d%', n, n, pct);
                        $el.find('.progress-bar').css('width', pct + '%');
                        $el.find('.caption span').text(caption);
                        $el.find('[data-action="close"]').off().on('click', function (e) {
                            e.preventDefault();
                            data.abort();
                        }).toggle(data.pct < 1);
                        $el.show();
                    });

                    this.append($el);
                }
            });
        },

        'refresh-folders': function () {
            var resetMailFolders = _.throttle(function () {
                // reset collections and folder (to update total count)
                var affectedFolders = _(['inbox', 'sent', 'drafts'])
                    .chain()
                    .map(function (type) {
                        var folders = accountAPI.getFoldersByType(type);
                        api.pool.resetFolder(folders);
                        return folders;
                    })
                    .flatten()
                    .value();
                folderAPI.multiple(affectedFolders, { cache: false });
                api.trigger('refresh.all');
            }, 5000, { leading: false });

            function refreshFolders(data, result) {
                if (result.error) {
                    return $.Deferred().reject(result).promise();
                } else if (result.data) {
                    var folder = result.data.folderId;
                    $.when(accountAPI.getUnifiedMailboxName(), accountAPI.getPrimaryAddress())
                    .done(function (isUnified, senderAddress) {
                        // check if mail was sent to self to update inbox counters correctly
                        var sendToSelf = false;
                        _.chain(_.union(data.to, data.cc, data.bcc)).each(function (item) {
                            if (item[1] === senderAddress[1]) {
                                sendToSelf = true;
                                return;
                            }
                        });
                        // wait a moment, then update folders as well
                        setTimeout(function () {
                            if (isUnified !== null) {
                                folderAPI.refresh();
                            } else if (sendToSelf) {
                                folderAPI.reload(folder, accountAPI.getInbox());
                            } else {
                                folderAPI.reload(folder);
                            }
                        }, 5000);
                    });
                }
            }

            // only needed for db-based drafts
            composeAPI.on('after:save', function (data, result) {
                if (data.mailPath) return;
                resetMailFolders();
                refreshFolders(data, result);
            });

            composeAPI.on('after:send', function (data, result) {
                resetMailFolders();
                refreshFolders(data, result);
            });
        },

        // reverted for 7.10
        // 'primary-action': function (app) {

        //     app.addPrimaryAction({
        //         point: 'io.ox/mail/sidepanel',
        //         label: gt('Compose'),
        //         action: 'io.ox/mail/actions/compose',
        //         toolbar: 'compose'
        //     });
        // },

        'sidepanel': function (app) {
            if (_.device('smartphone')) return;
            ext.point('io.ox/mail/sidepanel').extend({
                id: 'tree',
                index: 100,
                draw: function (baton) {
                    // add border & render tree and add to DOM
                    this.addClass('border-right').append(baton.app.treeView.$el);
                }
            });

            var node = app.getWindow().nodes.sidepanel;
            ext.point('io.ox/mail/sidepanel').invoke('draw', node, ext.Baton({ app: app }));
        },

        'metrics': function (app) {

            // forward event to internal tracker
            if (app.options.first) {
                app.listView.on('first-reset', function () {
                    var t = _.now() - ox.t0;
                    ox.trigger('timing:mail:ready', t);
                });
            }

            // legacy piwik tracking
            require(['io.ox/metrics/main'], function (metrics) {
                if (!metrics.isEnabled()) return;

                var nodes = app.getWindow().nodes,
                    node = nodes.outer,
                    sidepanel = nodes.sidepanel;
                // A/B testing which add mail account button is prefered
                metrics.watch({
                    node: node,
                    selector: '[data-action="add-mail-account"]',
                    type: 'click'

                }, {
                    app: 'mail',
                    target: 'folder/account',
                    type: 'click',
                    action: 'add'
                });

                function track(target, node) {
                    node = $(node);
                    var isSelect = !!node.attr('data-name');
                    metrics.trackEvent({
                        app: 'mail',
                        target: target,
                        type: 'click',
                        action: isSelect ? node.attr('data-name') : node.attr('data-action'),
                        detail: isSelect ? node.attr('data-value') : ''
                    });
                }

                // categories
                nodes.body.on('mousedown', '.categories-toolbar-container .category', function (e) {
                    metrics.trackEvent({
                        app: 'mail',
                        target: 'toolbar',
                        type: 'click',
                        action: 'select-tab',
                        detail: $(e.currentTarget).attr('data-id')
                    });
                });

                // main toolbar: actions, view dropdown
                nodes.body.on('track', '.classic-toolbar-container', function (e, node) {
                    track('toolbar', node);
                });
                // detail view: actions
                nodes.body.on('track', '.thread-view-control', function (e, node) {
                    track('detail/toolbar', node);
                });
                // listview toolbar
                nodes.main.find('.list-view-control .toolbar').on('mousedown', 'a[data-name], a[data-action]', function (e) {
                    track('list/toolbar', e.currentTarget);
                });

                // folder tree action
                _.defer(function () {
                    sidepanel.find('.context-dropdown').on('mousedown', 'a', function (e) {
                        metrics.trackEvent({
                            app: 'mail',
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
                        app: 'mail',
                        target: 'folder/toolbar',
                        type: 'click',
                        action: $(e.currentTarget).attr('data-action')
                    });
                });
                app.getWindow().nodes.outer.on('selection:drop', function (e, baton) {
                    metrics.trackEvent({
                        app: 'mail',
                        target: 'folder',
                        type: 'click',
                        action: 'drop',
                        detail: baton.data.length ? 'single' : 'multiple'
                    });
                });
                // check for clicks in folder trew
                app.on('folder:change folder-virtual:change', function (folder, data) {
                    data = data || {};
                    metrics.getFolderFlags(folder)
                        .then(function (list) {
                            // unfied
                            if (folderAPI.is('unifiedfolder', data)) list.unshift('unfified');
                            // primary vs. external
                            list.unshift(folderAPI.is('external', data) ? 'external' : 'primary');
                            metrics.trackEvent({
                                app: 'mail',
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
                            app: 'mail',
                            target: 'list/' + app.props.get('layout'),
                            type: 'click',
                            action: 'select',
                            detail: list.length > 1 ? 'multiple' : 'one'
                        });
                    }, 100, { trailing: false })
                });
            });
        },

        'unified-folder-support': function () {
            // only register if we have a unified mail account
            accountAPI.getUnifiedMailboxName().done(function (unifiedMailboxName) {
                if (!unifiedMailboxName) {
                    return;
                }

                var checkForSync = function (model) {
                    // check if we need to sync unified folders
                    var accountId = api.getAccountIDFromFolder(model.get('folder_id')),
                        folderTypes = {
                            7: 'INBOX',
                            9: 'Drafts',
                            10: 'Sent',
                            11: 'Spam',
                            12: 'Trash'
                        };

                    return accountAPI.get(accountId).then(function (accountData) {
                        var folder, originalFolderId, unifiedFolderId, unifiedSubfolderId;
                        if (!accountData) {
                            folder = folderAPI.pool.models[model.get('folder_id')];
                            // check if we are in the unified folder
                            if (folder && folder.is('unifiedfolder')) {
                                originalFolderId = model.get('original_folder_id');
                                unifiedSubfolderId = model.get('folder_id') + '/' + originalFolderId;
                                // unified folder has special mail ids
                                var id = model.get('original_id');

                                return [{ folder_id: originalFolderId, id: id }, { folder_id: unifiedSubfolderId, id: id }];
                            }
                            //check if we are in the unified folder's subfolder
                            folder = folderAPI.pool.models[folder.get('folder_id')];
                            if (folder && folder.is('unifiedfolder')) {
                                unifiedFolderId = folder.id;
                                originalFolderId = model.get('folder_id').replace(folder.id + '/', '');
                                // unified folder has special mail ids

                                return [{ folder_id: unifiedFolderId, id: originalFolderId + '/' + model.get('id') }, { folder_id: originalFolderId, id: model.get('id') }];
                            }
                        // check if we are in a standard folder that needs to be synced to a unified folder
                        } else if (accountData.unified_inbox_enabled) {
                            folder = folderAPI.pool.models[model.get('folder_id')];
                            var folderType = folderTypes[folder.get('standard_folder_type')];

                            if (folderType) {
                                unifiedFolderId = unifiedMailboxName + '/' + folderType;
                                unifiedSubfolderId = unifiedFolderId + '/' + folder.get('id');
                                // unified folder has special mail ids

                                return [{ folder_id: unifiedFolderId, id: model.get('folder_id') + '/' + model.get('id') }, { folder_id: unifiedSubfolderId, id: model.get('id') }];
                            }
                        }
                        return $.Deferred().reject();
                    });
                };

                api.pool.get('detail').on('change:flags', function (model, value, options) {
                    options = options || {};

                    if (!model || options.unifiedSync) return;

                    // get previous and current flags to determine if unseen bit has changed
                    var previous = util.isUnseen(model.previous('flags')),
                        current = util.isUnseen(model.get('flags'));
                    if (previous === current) return;
                    checkForSync(model).done(function (modelsToSync) {
                        _(modelsToSync).each(function (mail) {
                            var obj = api.pool.get('detail').get(_.cid(mail));

                            if (obj) {
                                var changes = {
                                    flags: current ? obj.get('flags') & ~32 : obj.get('flags') | 32
                                };
                                if (!current) {
                                    changes.unseen = false;
                                }
                                obj.set(changes, { unifiedSync: true });

                                // update thread model
                                api.threads.touch(obj.attributes);
                                api.trigger('update:' + _.ecid(obj.attributes), obj.attributes);
                            } else {
                                // detail models not loaded yet. Just trigger folder manually
                                folderAPI.changeUnseenCounter(mail.folder_id, current ? +1 : -1);
                            }
                            // mark folder as expired in pool (needed for listviews to draw correct)
                            api.pool.resetFolder(mail.folder_id);
                        });
                    });
                });

                api.pool.get('detail').on('remove', function (model) {
                    if (!model) return;
                    // check if removed message was unseen
                    var unseen = util.isUnseen(model.get('flags'));
                    checkForSync(model).done(function (modelsToSync) {
                        _(modelsToSync).each(function (mail) {
                            if (unseen) {
                                folderAPI.changeUnseenCounter(mail.folder_id, -1);
                            }
                            // mark folder as expired in pool (needed for listviews to draw correct)
                            api.pool.resetFolder(mail.folder_id);
                        });
                    });
                });
            });
        },

        'sockets': function (app) {
            ox.on('socket:mail:new', function (data) {
                folderAPI.reload(data.folder);
                // push arrives, other folder selected
                if (data.folder !== app.folder.get(data.folder)) {
                    _(api.pool.getByFolder(data.folder)).invoke('expire');
                } else {
                    app.listView.reload();
                }
            });
        },

        'vacation-notice': function (app) {
            if (!capabilities.has('mailfilter_v2')) return;
            require(['io.ox/mail/mailfilter/vacationnotice/indicator'], function (View) {
                new View().attachTo(app.listControl.$el);
            });
        },

        'autoforward-notice': function (app) {
            if (!capabilities.has('mailfilter_v2')) return;
            require(['io.ox/mail/mailfilter/autoforward/indicator'], function (View) {
                new View().attachTo(app.listControl.$el);
            });
        }
    });

    // launcher
    app.setLauncher(function () {
        // get window
        var win = ox.ui.createWindow({
            name: 'io.ox/mail',
            title: 'Inbox',
            chromeless: true,
            find: capabilities.has('search')
        });

        if (_.url.hash('mailto')) ox.registry.call('mail-compose', 'open');

        app.setWindow(win);
        app.settings = settings;
        window.mailapp = app;

        commons.addFolderSupport(app, null, 'mail', app.options.folder)
            .always(function always() {
                app.mediate();
                win.show();
            })
            .fail(function fail(result) {
                // missing folder information indicates a connection failure
                var message = settings.get('folder/inbox') && result && result.error ?
                    result.error + ' ' + gt('Application may not work as expected until this problem is solved.') :
                    // default error
                    api.mailServerDownMessage;
                notifications.yell('error', message);
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
