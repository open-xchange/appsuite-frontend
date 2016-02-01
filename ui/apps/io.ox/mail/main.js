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
 * @author Alexander Quast <alexander.quast@open-xchange.com>
 */

define('io.ox/mail/main', [
    'io.ox/mail/util',
    'io.ox/mail/api',
    'io.ox/core/commons',
    'io.ox/mail/listview',
    'io.ox/core/tk/list-control',
    'io.ox/mail/threadview',
    'io.ox/core/extensions',
    'io.ox/core/extPatterns/actions',
    'io.ox/core/extPatterns/links',
    'io.ox/core/api/account',
    'io.ox/core/notifications',
    'io.ox/core/toolbars-mobile',
    'io.ox/core/page-controller',
    'io.ox/core/capabilities',
    'io.ox/core/folder/tree',
    'io.ox/core/folder/view',
    'io.ox/core/folder/api',
    'io.ox/backbone/mini-views/quota',
    'gettext!io.ox/mail',
    'settings!io.ox/mail',
    'io.ox/mail/actions',
    'io.ox/mail/mobile-navbar-extensions',
    'io.ox/mail/mobile-toolbar-actions',
    'io.ox/mail/toolbar',
    'io.ox/mail/import',
    'less!io.ox/mail/style',
    'io.ox/mail/folderview-extensions'
], function (util, api, commons, MailListView, ListViewControl, ThreadView, ext, actions, links, account, notifications, Bars, PageController, capabilities, TreeView, FolderView, folderAPI, QuotaView, gt, settings) {

    'use strict';

    // application object
    var app = ox.ui.createApp({
        name: 'io.ox/mail',
        id: 'io.ox/mail',
        title: 'Mail'
    });

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
            });
            app.pages.getNavbar('detailView').on('leftAction', function () {
                app.pages.goBack();
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

            app.getTour = function () {
                //no tours for guests, yet. See bug 41542
                if (capabilities.has('guest')) return;

                return { id: 'default/io.ox/mail', path: 'io.ox/tours/mail' };
            };
        },

        /*
         * Folder view support
         */
        'folder-view': function (app) {

            if (_.device('smartphone')) return;

            // tree view
            app.treeView = new TreeView({ app: app, module: 'mail', contextmenu: true });

            // initialize folder view
            FolderView.initialize({ app: app, tree: app.treeView });
            app.folderView.resize.enable();
        },

        'mail-quota': function (app) {

            if (_.device('smartphone')) return;

            var quota = new QuotaView({
                title: gt('Mail quota'),
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

            app.treeView.$el.append(
                quota.render().$el
            );
        },

        /*
         * Convenience function to toggle folder view
         */
        'folder-view-toggle': function (app) {
            if (_.device('smartphone')) return;
            app.getWindow().nodes.main.on('dblclick', '.list-view-control .toolbar', function () {
                app.folderView.toggle();
            });
        },

        /*
         * Default application properties
         */
        'props': function (app) {

            function getLayout() {
                // enforece vertical on smartphones
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
                'exactDates': app.settings.get('showExactDates', false),
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
         * Folder view support
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
        },

        /*
         * Add support for virtual folder "Unread"
         */
        'all-unseen': function (app) {

            var loader = api.collectionLoader,
                params = loader.getQueryParams({ folder: 'virtual/all-unseen' }),
                collection = loader.getCollection(params);

            // register load listener which triggers complete
            collection.on('load', function () {
                this.complete = true;
                this.preserve = true;
                this.CUSTOM_PAGE_SIZE = 250;
                this.trigger('complete');
            });

            // use mail API's "all-unseen" event to update counter (that is also used in top-bar)
            var virtualAllSeen = folderAPI.pool.getModel('virtual/all-unseen');
            api.on('all-unseen', function (e, count) {
                virtualAllSeen.set('unread', count);
            });

            // make virtual folder clickable
            app.folderView.tree.selection.addSelectableVirtualFolder('virtual/all-unseen');
        },

        /*
         * Split into left and right pane
         */
        'vsplit': function (app) {
            // replacing vsplit with new pageController
            // TODO: refactor app.left and app.right
            var left = app.pages.getPage('listView'),
                right = app.pages.getPage('detailView');

            app.left = left.addClass('border-right');
            app.right = right.addClass('mail-detail-pane').attr({
                'role': 'complementary',
                'aria-label': gt('Mail Details')
            });
        },

        /*
         * Setup list view
         */
        'list-view': function (app) {
            app.listView = new MailListView({ swipe: true, app: app, draggable: true, ignoreFocus: true, selectionOptions: { mode: 'special' } });
            app.listView.model.set({ folder: app.folder.get() });
            app.listView.model.set('thread', true);
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

        'list-view-message-empty': function (app) {
            // enable 'empty' message
            app.listView.messageEmpty
                //.removeClass('hidden')
                .find('.message-empty')
                // customize message
                .text(gt('Empty'));
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
                var options = app.settings.get(['viewOptions', folder]);
                return _.extend({ sort: 610, order: 'desc', thread: false }, options);
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
                if (value === 'from-to') value = account.is('sent|drafts', model.get('folder')) ? 604 : 603;
                // do not accidentally overwrite other attributes on folderchange
                if (!app.changingFolders) {
                    // set proper order first
                    model.set('order', (/^(610|608)$/).test(value) ? 'desc' : 'asc', { silent: true });
                    app.props.set('order', model.get('order'));
                    // turn off conversation mode for any sort order but date (610)
                    if (value !== 610) app.props.set('thread', false);
                }
                if (value === 610 && !app.props.get('thread')) {
                    // restore thread when it was disabled by force
                    var options = app.getViewOptions(app.folder.get());
                    app.props.set('thread', options.threadrestore || false);
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
            app.props.on('change:thread', function (model, value, opt) {
                if (!app.changingFolders && app.listView.collection) {
                    app.listView.collection.expired = true;
                }
                if (value === true) {
                    app.props.set('sort', 610);
                    app.listView.model.set('thread', true);
                } else {
                    // remember/remove thread state for restoring
                    opt.viewOptions = app.props.get('sort') === 610 ? { threadrestore: undefined } : { threadrestore: true };
                    app.listView.model.set('thread', false);
                }
            });
        },

        'isThreaded': function (app) {
            app.isThreaded = function () {
                if (app.listView.loader.mode === 'search') return false;
                return app.props.get('thread');
            };
        },

        /*
         * Store view options
         */
        'store-view-options': function (app) {
            app.props.on('change', _.debounce(function (model, options) {
                if (app.props.get('find-result')) return;
                var folder = app.folder.get(), data = app.props.toJSON();
                app.settings
                    .set(['viewOptions', folder], _.extend({ sort: data.sort, order: data.order, thread: data.thread }, options.viewOptions || {}))
                    .set('layout', data.layout)
                    .set('showContactPictures', data.contactPictures)
                    .set('showExactDates', data.exactDates);
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
         * Setup thread view
         */
        'thread-view': function (app) {
            if (_.device('smartphone')) return;
            app.threadView = new ThreadView.Desktop();
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
                if (app.props.get('layout') === 'list') {
                    app.threadView.trigger('back');
                }
            });

            app.on('folder:change', function (id) {

                if (app.props.get('mobileFolderSelectMode')) return;

                // marker so the change:sort listener does not change other attributes (which would be wrong in that case)
                app.changingFolders = true;

                var options = app.getViewOptions(id),
                    fromTo = $(app.left[0]).find('.dropdown.grid-options .dropdown-menu [data-value="from-to"] span'),
                    showTo = account.is('sent|drafts', id);

                app.props.set(_.pick(options, 'sort', 'order', 'thread'));
                app.listView.model.set('folder', id);
                app.folder.getData();
                fromTo.text(showTo ? gt('To') : gt('From'));
                app.changingFolders = false;
            });
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
            // wWithout the delay, the UI would try to render messages that are
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
                app.threadView.show(latestMessage, app.isThreaded());
            }

            // show instantly
            app.showMail = function (cid) {
                // remember latest message
                latestMessage = cid;
                // delay or instant?
                if (recentDeleteEventCount) {
                    // clear view instantly
                    app.threadView.empty();
                    clearTimeout(messageTimer);
                    var delay = (recentDeleteEventCount - 1) * 1000;
                    messageTimer = setTimeout(show, delay);
                } else {
                    show();
                }
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
                app.pages.getPage('detailView').empty().append(app.threadView.renderMail(cid));
            };
        },

        /*
         * Define basic function to show an thread overview on mobile
         */
        'mobile-show-thread-overview': function (app) {
            // clicking on a thread will show a custom overview
            // based on a custom threadview only showing mail headers
            app.showThreadOverview = function (cid) {
                app.threadView.show(cid, app.props.get('thread'));
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
                list = api.resolve(list, app.props.get('thread'));

                // check if a folder is selected
                var id = app.folder.get(),
                    model = folderAPI.pool.getModel(id),
                    total = model.get('total'),
                    search = app.get('find') && app.get('find').isActive();

                app.right.find('.multi-selection-message .message')
                    .empty()
                    .attr('id', 'mail-multi-selection-message')
                    .append(
                        // message
                        $('<div>').append(
                            gt('%1$d messages selected', $('<span class="number">').text(list.length).prop('outerHTML'))
                        ),
                        // inline actions
                        id && total && !search ?
                            $('<div class="inline-actions">').append(
                                $('<span>').text(gt('The following actions apply to all messages (%1$d) in this folder:', total)),
                                $('<br>'),
                                //#. %1$d is the total number of messages
                                $('<a href="#" data-action="moveAll">').text(gt('Move all messages to another folder')),
                                $('<br>'),
                                //#. %1$d is the total number of messages
                                $('<a href="#" data-action="clear">').text(gt('Delete all messages in this folder'))
                            )
                            .on('click', 'a', function (e) {
                                e.preventDefault();
                                var action = $(e.currentTarget).data('action');
                                require(['io.ox/core/folder/actions/common'], function (common) {
                                    if (action === 'moveAll') common.moveAll(id);
                                    else if (action === 'clear') common.clearFolder(id);
                                });
                            })
                            : $()
                    );
            };
        },

        /*
         * Define function to reflect multiple selection
         */
        'show-multiple-mobile': function (app) {
            if (_.device('!smartphone')) return;

            app.showMultiple = function (list) {

                app.threadView.empty();
                if (list) {
                    list = api.resolve(list, app.props.get('thread'));
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
                    var isDraftFolder = _.contains(account.getFoldersByType('drafts'), this.model.get('folder'));

                    if (app.listView.selection.get().length === 1 && !app.props.get('checkboxes')) {
                        // check for thread
                        var cid = list[0],
                            isThread = this.collection.get(cid).get('threadSize') > 1;

                        if (isDraftFolder) {
                            ox.registry.call('mail-compose', 'edit', _.cid(cid));
                        } else if (isThread) {
                            app.showThreadOverview(cid);
                            app.pages.changePage('threadView');
                        } else {
                            app.showMail(cid);
                            app.pages.changePage('detailView');
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

            var react = _.debounce(function (type, list) {

                if (app.props.get('layout') === 'list' && type === 'action') {
                    resetRight('selection-one preview-visible');
                    app.showMail(list[0]);
                    return;
                } else if (app.props.get('layout') === 'list' && type === 'one') {
                    //don't call show mail (an invisible detailview would be drawn which marks it as read)
                    resetRight('selection-one');
                    return;
                }

                switch (type) {
                    case 'empty':
                        resetRight('selection-empty');
                        app.showEmpty();
                        break;
                    case 'one':
                    case 'action':
                        resetRight('selection-one');
                        app.showMail(list[0]);
                        break;
                    case 'multiple':
                        resetRight('selection-multiple');
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
                    app.showMultiple(list);
                },
                'selection:action': function (list) {
                    app.right.find('.multi-selection-message div').attr('id', null);
                    // make sure we are not in multi-selection
                    if (app.listView.selection.get().length === 1) react('action', list);
                }
            });
        },

        /*
         * Thread view navigation must respond to changing layout
         */
        'change:layout': function (app) {
            app.props.on('change:layout', function (model, value) {
                app.threadView.toggleNavigation(value === 'list');
            });

            app.threadView.toggleNavigation(app.props.get('layout') === 'list');
        },

        /*
         * Respond to changing layout
         */
        'apply-layout': function (app) {
            if (_.device('smartphone')) return;
            app.applyLayout = function () {

                var layout = app.props.get('layout'), nodes = app.getWindow().nodes, toolbar, className,
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
                className = 'classic-toolbar-visible';
                if (layout === 'compact') {
                    nodes.body.removeClass(className);
                    app.right.addClass(className).prepend(toolbar);
                } else {
                    app.right.removeClass(className);
                    nodes.body.addClass(className).prepend(toolbar);
                }

                if (layout !== 'list' && app.props.previousAttributes().layout === 'list' && !app.right.hasClass('preview-visible')) {
                    //listview did not create a detailview for the last mail, it was only selected, so detailview needs to be triggered manually(see bug 33456)
                    app.listView.selection.selectEvents();
                }
            };

            app.props.on('change:layout', function () {
                app.applyLayout();
                app.listView.redraw();
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
         * auto select first seen email (only on initial startup)
         */
        'auto-select': function (app) {

            // no auto-selection needed on smartphones
            if (_.device('smartphone')) return;

            app.listView.on('first-reset', function () {
                // defer to have a visible window
                _.defer(function () {
                    app.listView.collection.find(function (model, index) {
                        if (!util.isUnseen(model.get('flags'))) {
                            app.listView.selection.select(index);
                            return true;
                        }
                    });
                });
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
         * Prefetch first 10 relevant (unseen) emails
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
                                api.get({ unseen: true, id: obj.id, folder: obj.folder_id });
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

            function isSingleThreadMessage(ids, selection) {
                if (ids.length !== 1) return false;
                if (selection.length !== 1) return false;
                var a = _.cid(ids[0]), b = String(selection[0]).replace(/^thread\./, '');
                return a !== b;
            }

            api.on('beforedelete', function (e, ids) {
                var selection = app.listView.selection.get();
                if (isSingleThreadMessage(ids, selection)) return;
                // looks for intersection
                ids = _(ids).map(_.cid);
                if (_.intersection(ids, selection).length) app.listView.selection.dodge();
            });
        },

        'before-delete-mobile': function (app) {
            if (!_.device('smartphone')) return;
            // if a mail will be deleted in detail view, go back one page
            api.on('beforedelete', function () {
                if (app.pages.getCurrentPage().name === 'detailView') {
                    // check if the threadoverview is empty
                    if (app.props.get('thread') && app.threadView.collection.length === 1) {
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
            app.getWindow().nodes.outer.on('selection:drop', function (e, baton) {
                // remember if this list is based on a single thread
                baton.isThread = baton.data.length === 1 && /^thread\./.test(baton.data[0]);
                // resolve thread
                baton.data = api.resolve(baton.data, app.props.get('thread'));
                // call action
                actions.check('io.ox/mail/actions/move', baton.data).done(function () {
                    actions.invoke('io.ox/mail/actions/move', null, baton);
                });
            });
        },

        /*
         * Handle archive event based on keyboard shortcut
         */
        'selection-archive': function () {
            app.listView.on('selection:archive', function (list) {
                var baton = ext.Baton({ data: list });
                // remember if this list is based on a single thread
                baton.isThread = baton.data.length === 1 && /^thread\./.test(baton.data[0]);
                // resolve thread
                baton.data = api.resolve(baton.data, app.props.get('thread'));
                // call action
                actions.check('io.ox/mail/actions/archive', baton.data).done(function () {
                    actions.invoke('io.ox/mail/actions/archive', null, baton);
                });
            });
        },

        /*
         * Handle delete event based on keyboard shortcut or swipe gesture
         */
        'selection-delete': function () {
            app.listView.on('selection:delete', function (list) {
                var baton = ext.Baton({ data: list });
                // remember if this list is based on a single thread
                baton.isThread = baton.data.length === 1 && /^thread\./.test(baton.data[0]);
                // resolve thread
                baton.data = api.resolve(baton.data, app.props.get('thread'));
                // call action
                // check if action can be called
                actions.check('io.ox/mail/actions/delete', baton.data).done(function () {
                    actions.invoke('io.ox/mail/actions/delete', null, baton);
                });
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
                if (app.isThreaded()) list = _(api.threads.get(list[0])).pluck('cid');
                var cid = list[0],
                    obj = _.cid(cid),
                    isDraft = account.is('drafts', obj.folder_id);
                if (isDraft) {
                    ox.registry.call('mail-compose', 'edit', obj);
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

            ext.point('io.ox/mail/mobile/swipeButtonMore').extend(new links.Dropdown({
                id: 'actions',
                index: 1,
                classes: '',
                label: '',
                ariaLabel: '',
                icon: '',
                noCaret: true,
                ref: 'io.ox/mail/links/inline'
            }));

            app.listView.on('selection:more', function (list, node) {
                var baton = ext.Baton({ data: list });
                // remember if this list is based on a single thread
                baton.isThread = baton.data.length === 1 && /^thread\./.test(baton.data[0]);
                // resolve thread
                baton.data = api.resolve(baton.data, app.props.get('thread'));
                // call action
                // we open a dropdown here with options.
                ext.point('io.ox/mail/mobile/swipeButtonMore').invoke('draw', node, baton);
                node.find('a').click();
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
            app.listControl.$el.toggleClass('toolbar-top-visible', false);

            app.props.on('change:checkboxes', function (model, value) {
                app.listView.toggleCheckboxes(value);
                app.listControl.$el.toggleClass('toolbar-top-visible', value);
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
         * Respond to change:contactPictures
         */
        'change:contactPictures': function (app) {
            app.props.on('change:contactPictures', function () {
                app.listView.redraw();
            });
        },

        /*
         * Respond to change:exactDates
         */
        'change:exactDates': function (app) {
            app.props.on('change:exactDates', function () {
                app.listView.redraw();
            });
        },

        'fix-mobile-lazyload': function (app) {
            if (_.device('!smartphone')) return;
            // force lazyload to load, otherwise the whole pane will stay empty...
            app.pages.getPage('detailView').on('pageshow', function () {
                $(this).find('li.lazy').trigger('scroll');
            });
        },

        'inplace-find': function (app) {

            if (_.device('smartphone') || !capabilities.has('search')) return;

            app.searchable();

            var find = app.get('find'),
                each = function (obj) {
                    api.pool.add('detail', obj);
                };

            find.on('collectionLoader:created', function (loader) {
                loader.each = each;
            });
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
                return 'ox.appsuite.user.sect.email.gui.html#ox.appsuite.user.sect.email.gui';
            };
        },

        'a11y': function (app) {
            // mail list: focus mail detail view on <enter>
            // mail list: focus folder on <escape>
            app.listView.$el.on('keydown', '.list-item', function (e) {
                if (e.which === 13) app.threadView.$('.list-item.expanded .body').focus();
                if (e.which === 27) { app.folderView.tree.$('.folder.selected').focus(); return false; }
            });
            // detail view: return back to list view via <escape>
            app.threadView.$el.on('keydown', '.list-item', function (e) {
                if (e.which === 27) app.listView.restoreFocus(true);
            });
            // folder tree: focus list view on <enter>
            // folder tree: focus top-bar on <escape>
            app.folderView.tree.$el.on('keydown', '.folder', function (e) {
                // check if it's really the folder - not the contextmenu toggle
                if (!$(e.target).hasClass('folder')) return;
                if (e.which === 13) app.listView.restoreFocus(true);
                if (e.which === 27) $('#io-ox-topbar .active-app > a').focus();
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
        'no-permission': function (app) {
            // use debounce, so errors from folder and app api are only handled once.
            var handleError = _.debounce(function (error) {
                // work with (error) and (event, error) arguments
                if (error && !error.error) {
                    if (arguments[1] && arguments[1].error) {
                        error = arguments[1];
                    } else {
                        return;
                    }
                }
                // only change if folder is currently displayed
                if (error.error_params[0] && String(app.folder.get()) !== String(error.error_params[0])) {
                    return;
                }
                require(['io.ox/core/yell'], function (yell) {
                    yell(error);
                    // try to load the default folder
                    // guests do not have a default folder, so the first visible one is chosen
                    app.folder.setDefault();
                });
            }, 300);

            folderAPI.on('error:FLD-0008', handleError);
            api.on('error:FLD-0008', handleError);
            api.on('error:IMAP-2041', function (e, error) {
                // check if folder is currently displayed
                if (String(app.folder.get()) !== String(error.error_params[1])) {
                    return;
                }
                // see if we can still access the folder, although we are not allowed to view the contents
                // this is important because otherwise we would not be able to change permissions (because the view jumps to the default folder all the time)
                folderAPI.get(app.folder.get(), { cache: false }).fail(function (error) {
                    if (error.code === 'FLD-0003') {
                        handleError(error);
                    }
                });
            });
        },

        'save-draft': function (app) {
            api.on('autosave send', function () {
                var folder = app.folder.get();
                if (folderAPI.is('drafts', folder)) app.listView.reload();
            });
        },

        'metrics': function (app) {
            require(['io.ox/metrics/main'], function (metrics) {
                if (!metrics.isEnabled()) return;

                var nodes = app.getWindow().nodes,
                    node = nodes.outer,
                    toolbar = nodes.body.find('.classic-toolbar-container'),
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
                // detail view actions
                app.getWindow().nodes.main.delegate('.detail-view-header .dropdown-menu a', 'mousedown', function (e) {
                    metrics.trackEvent({
                        app: 'mail',
                        target: 'detail/toolbar',
                        type: 'click',
                        action: $(e.currentTarget).attr('data-action')
                    });
                });
                // toolbar actions
                toolbar.delegate('.io-ox-action-link', 'mousedown', function (e) {
                    metrics.trackEvent({
                        app: 'mail',
                        target: 'toolbar',
                        type: 'click',
                        action: $(e.currentTarget).attr('data-action')
                    });
                });
                // toolbar options dropfdown
                toolbar.delegate('.dropdown-menu a:not(.io-ox-action-link)', 'mousedown', function (e) {
                    var node =  $(e.target).closest('a');
                    if (!node.attr('data-name')) return;
                    metrics.trackEvent({
                        app: 'mail',
                        target: 'toolbar',
                        type: 'click',
                        action: node.attr('data-name'),
                        detail: node.attr('data-value')
                    });
                });
                // folder tree action
                sidepanel.find('.context-dropdown').delegate('li>a', 'mousedown', function (e) {
                    metrics.trackEvent({
                        app: 'mail',
                        target: 'folder/context-menu',
                        type: 'click',
                        action: $(e.currentTarget).attr('data-action')
                    });
                });
                // check for clicks in folder trew
                app.on('folder:change', function (folder) {
                    metrics.trackEvent({
                        app: 'mail',
                        target: 'folder',
                        type: 'click',
                        action: 'select',
                        detail: account.isPrimary(folder) ? 'primary' : 'external'
                    });
                });
                // selection in listview
                app.listView.on({
                    'selection:multiple selection:one': function (list) {
                        metrics.trackEvent({
                            app: 'mail',
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
    app.setLauncher(function () {

        // get window
        var win = ox.ui.createWindow({
            name: 'io.ox/mail',
            title: 'Inbox',
            chromeless: true,
            find: capabilities.has('search')
        });

        if (_.url.hash().mailto) ox.registry.call('mail-compose', 'compose');

        app.setWindow(win);
        app.settings = settings;
        window.mailapp = app;

        commons.addFolderSupport(app, null, 'mail', app.options.folder)
            .always(function always() {
                app.mediate();
                win.show();
            })
            .fail(function fail(result) {
                var errorMsg = (result && result.error) ? result.error + ' ' : '';
                errorMsg += gt('Application may not work as expected until this problem is solved.');
                notifications.yell('error', errorMsg);
            });
    });

    return {
        getApp: app.getInstance
    };
});
