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

define('io.ox/mail/main',
    ['io.ox/mail/util',
     'io.ox/mail/api',
     'io.ox/core/commons',
     'io.ox/mail/listview',
     'io.ox/core/tk/list-control',
     'io.ox/mail/threadview',
     'io.ox/core/extensions',
     'io.ox/core/extPatterns/actions',
     'io.ox/core/api/account',
     'io.ox/core/notifications',
     'io.ox/mail/navbarViews',
     'io.ox/core/commons-folderview',
     'io.ox/core/pageController',
     'gettext!io.ox/mail',
     'settings!io.ox/mail',
     'io.ox/mail/actions',
     'io.ox/mail/toolbar',
     'io.ox/mail/import',
     'less!io.ox/mail/style',
     'io.ox/mail/folderview-extensions'
    ], function (util, api, commons, MailListView, ListViewControl, ThreadView, ext, actions, account, notifications, Bars, FolderView, PageController, gt, settings) {

    'use strict';

    // application object
    var app = ox.ui.createApp({
        name: 'io.ox/mail',
        title: 'Mail'
    });

    app.mediator({

        'pages-mobile': function (app) {
            if (_.device('!small')) return;
            var c = app.getWindow().nodes.main;
            var navbar = $('<div class="mobile-navbar">'),
                toolbar = $('<div class="mobile-toolbar">');
            app.navbar = navbar;
            app.toolbar = toolbar;

            app.pages = new PageController(app);

            app.getWindow()
                .nodes.body.addClass('classic-toolbar-visible').append(navbar, toolbar);
            // create 4 pages
            app.pages.addPage({
                name: 'folderTree',
                container: c,
                navbar: new Bars.NavbarView({
                    app: app
                }),
                toolbar: new Bars.ToolbarView({
                    el: toolbar,
                    app: app,
                    page: 'folderView'
                })
            });

            app.pages.addPage({
                name: 'listView',
                container: c,
                startPage: true,
                navbar: new Bars.NavbarView({
                    app: app
                }),
                toolbar: new Bars.ToolbarView({
                    el: toolbar,
                    app: app,
                    page: 'listView'
                })
            });

            app.pages.addPage({
                name: 'threadView',
                container: c,
                navbar: new Bars.NavbarView({
                    app: app
                }),
                toolbar: new Bars.ToolbarView({
                    el: toolbar,
                    app: app,
                    page: 'threadView'
                })
            });

            app.pages.addPage({
                name: 'detailView',
                container: c,
                navbar: new Bars.NavbarView({
                    app: app
                }),
                toolbar: new Bars.ToolbarView({
                    el: toolbar,
                    app: app,
                    page: 'detailView'
                })
            });

            window.test = app;
        },
        /*
         * Init all nav- and toolbar labels for mobile
         */
        'navbars-mobile': function (app) {

            if (!_.device('small')) return;

            app.pages.getNavbar('listView')
                .setLeft(gt('Folders'))
                .setRight(gt('Edit'))
                .on('actionRight');

            app.pages.getNavbar('folderTree')
                .setTitle(gt('Folders'))
                .setLeft(false)
                .setRight(gt('Edit'));

            app.pages.getNavbar('detailView')
                .setTitle('') // no title
                .setLeft(gt('Back'));

            app.pages.getNavbar('threadView')
                .setTitle(gt('Thread'))
                .setLeft(gt('Back'));

            // TODO restore last folder as starting point
            app.pages.showPage('listView');


        },

        'toolbars-mobile': function () {
            if (!_.device('small')) return;

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
            if (_.device('small')) return;

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
            if (_.device('small')) return;
            // folder tree
            commons.addFolderView(app, { type: 'mail' });
            app.getWindow().nodes.sidepanel.addClass('border-right');

        },

        /*
         * Convenience functin to toggle folder view
         */
        'folder-view-toggle': function (app) {
            if (_.device('small')) return;
            app.getWindow().nodes.main.on('dblclick', '.list-view-control .toolbar', function () {
                app.toggleFolderView();
            });
        },

        /*
         * Default application properties
         */
        'props': function (app) {
            // introduce shared properties
            app.props = new Backbone.Model({
                'layout': app.settings.get('layout', 'vertical'),
                'checkboxes': app.settings.get('showCheckboxes', true),
                'contactPictures': app.settings.get('showContactPictures', false),
                'mobileFolderSelectMode': false
            });
        },

        /*
         * Folder view support
         */
        'folder-view-mobile': function (app) {

            if (_.device('!small')) return;

            app.pages.getNavbar('folderTree')
                .on('actionRight', function () {

                    if (!app.props.get('mobileFolderSelectMode')) {

                        app.props.set('mobileFolderSelectMode', true);
                        app.pages.getNavbar('folderTree').setRight(gt('Cancel'));
                    } else {
                        app.props.set('mobileFolderSelectMode', false);
                        app.pages.getNavbar('folderTree').setRight(gt('Edit'));
                    }
                });


            var view = new FolderView(app, { type: 'mail', container: app.pages.getPage('folderTree') });
            view.handleFolderChange();
            view.load();


            // make folder visible by default
            app.toggleFolderView(true);


            // always change folder on click
            // No way to use tap here since folderselection really messes up the event chain
            app.pages.getPage('folderTree').on('click', '.folder.selectable', function (e) {
                if (app.props.get('mobileFolderSelectMode') === true) return; // do not change page in edit mode
                if ($(e.target).hasClass('fa')) return; // if folder expand, do not change page

                app.pages.changePage('listView');
            });

        },

        /*
         * Edit mode for mobile devices in folderview
         */
        'folder-view-editMode': function () {
            if (!_.device('small')) return;
            app.props.on('change:mobileFolderSelectMode', function () {
                console.log('folder edit mode action');
            });
        },

        /*
         * Split into left and right pane
         */
        'vsplit': function (app) {
            //if (_.device('small')) return;
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
            app.listView = new MailListView({ app: app, ignoreFocus: true });
            app.listView.model.set({ folder: app.folder.get() });
            // for debugging
            app.listView.model.set('thread', true);
            window.list = app.listView;
        },

        'list-view-checkboxes': function (app) {
            // always hide checkboxes on small devices initially
            if (_.device('small')) return;
            app.listView.toggleCheckboxes(app.props.get('checkboxes'));
        },

        'list-view-checkboxes-mobile': function (app) {
            // always hide checkboxes on small devices initially
            if (_.device('!small')) return;
            app.props.set('checkboxes', false);
            app.listView.toggleCheckboxes(false);
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
            app.props.set('folderview', _.device('small') ? false : app.settings.get('folderview/visible/' + _.display(), true));
        },

        /*
         * Respond to changed sort option
         */
        'change:sort': function (app) {
            app.props.on('change:sort', function (model, value) {
                var model = app.listView.model;
                // resolve from-to
                if (value === 'from-to') value = account.is('sent|drafts', model.get('folder')) ? 604 : 603;
                // set proper order first
                model.set('order', (/^(610|608)$/).test(value) ? 'desc' : 'asc', { silent: true });
                app.props.set('order', model.get('order'));
                // turn off conversation mode for any sort order but date (610)
                if (value !== 610) app.props.set('thread', false);
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

        /*
         * Respond to conversation mode changes
         */
        'change:thread': function (app) {
            app.props.on('change:thread', function (model, value) {
                if (value === true) {
                    app.props.set('sort', 610);
                    app.listView.model.set('thread', true);
                } else {
                    app.listView.model.set('thread', false);
                }
            });
        },

        /*
         * Store view options
         */
        'store-view-options': function (app) {
            app.props.on('change', _.debounce(function () {
                var folder = app.folder.get(), data = app.props.toJSON();
                app.settings
                    .set(['viewOptions', folder], { sort: data.sort, order: data.order, thread: data.thread })
                    .set('layout', data.layout)
                    .set('showCheckboxes', data.checkboxes)
                    .set('showContactPictures', data.contactPictures)
                    .save();
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
         * Setup list view control
         */
        'list-view-control': function (app) {
            app.listControl = new ListViewControl({ id: 'io.ox/mail', listView: app.listView, app: app });
            app.left.append(app.listControl.render().$el);
            // make resizable
            app.listControl.resizable();
        },

        /*
         * Setup thread view
         */
        'thread-view': function (app) {
            if (_.device('small')) return;
            app.threadView = new ThreadView.Desktop();
            app.right.append(app.threadView.render().$el);
        },

        'thread-view-mobile': function (app) {
            if (!_.device('small')) return;

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
                $('<div class="io-ox-center selection-message"><div></div></div>')
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
            app.listView.on({
                'selection:change:index': function () {
                    if (app.props.get('layout') !== 'list') return;
                    app.threadView.updatePosition(app.listView.getPosition() + 1);
                    app.threadView.togglePrevious(app.listView.hasPrevious());
                    app.threadView.toggleNext(app.listView.hasNext());
                }
            });
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
         * Change foldername on mobiles in navbar
         */
        'folder:change-mobile': function (app) {
            if (!_.device('small')) return;
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
            if (_.device('small')) return;
            app.showMail = function (cid) {
                app.threadView.show(cid);
            };
        },

           /*
         * Define basic function to show an email
         */
        'show-mail-mobile': function (app) {
            if (!_.device('small')) return;
            app.showMail = function (cid) {
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
                app.threadView.show(cid);
            };
        },


        /*
         * Define basic function to reflect empty selection
         */
        'show-empty': function (app) {
            app.showEmpty = function () {
                app.threadView.empty();
                app.right.find('.selection-message div').text(
                    gt('No message selected')
                );
            };
        },

        /*
         * Define function to reflect multiple selection
         */
        'show-multiple': function (app) {
            app.showMultiple = function (list) {
                app.threadView.empty();
                list = api.threads.resolve(list);
                app.right.find('.selection-message div').text(
                    gt('%1$d messages selected', list.length)
                );
            };
        },

        'selection-mobile': function (app) {

            if (!_.device('small')) return;

            // fertig
            app.listView.on({
                'selection:empty': function () {
                    //react('empty');
                },
                'selection:one': function () {
                    //react('one', list);
                },
                'selection:multiple': function () {
                    //react('multiple');
                    console.log('multi');
                },
                'selection:action': function (list) {
                    // make sure we are not in multi-selection
                    if (app.props.get('checkboxes')) {
                        console.log('multiselect');
                    } else if (app.listView.selection.get().length === 1) {
                        // check for thread
                        var cid = list[0].substr(7),
                            isThread = this.collection.get(cid).get('threadSize') > 1;

                        if (isThread) {
                            app.showThreadOverview(list[0]);
                            app.pages.changePage('threadView');
                        } else {
                            app.showMail(list[0]);
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

            if (_.device('small')) return;

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
                }
            }, 100);

            app.listView.on({
                'selection:empty': function () {
                    react('empty');
                },
                'selection:one': function (list) {
                    react('one', list);
                },
                'selection:multiple': function (list) {
                    react('multiple', list);
                },
                'selection:action': function (list) {
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

            app.applyLayout = function () {

                var layout = app.props.get('layout'), nodes = app.getWindow().nodes, toolbar, className;

                if (layout === 'vertical' || layout === 'compact') {
                    nodes.main.addClass('preview-right').removeClass('preview-bottom preview-none');
                } else if (layout === 'horizontal') {
                    nodes.main.addClass('preview-bottom').removeClass('preview-right preview-none');
                } else if (layout === 'list') {
                    nodes.main.addClass('preview-none').removeClass('preview-right preview-bottom');
                }

                // relocate toolbar
                toolbar = nodes.body.find('.classic-toolbar');
                className = 'classic-toolbar-visible';
                if (layout === 'compact') {
                    nodes.body.removeClass(className);
                    app.right.addClass(className).prepend(toolbar);
                } else {
                    app.right.removeClass(className);
                    nodes.body.addClass(className).prepend(toolbar);
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
            if (_.device('small')) return;

            app.listView.on('first-reset', function () {
                _.defer(function () { // defer to have a visible window
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
            if (!_.device('small')) return;

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
                        var thread = model.get('thread'), i, obj;
                        for (i = thread.length - 1; obj = _.cid(thread[i]); i--) {
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
            api.on('beforedelete', function () {
                app.listView.selection.dodge();
            });
        },

        'before-delete-mobile': function (app) {
            if (!_.device('small')) return;
            api.on('beforedelete', function () {
                if (app.pages.getCurrentPage().name === 'detailView') {
                    app.pages.goBack();
                }
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
                baton.data = api.threads.resolve(baton.data);
                // call action
                actions.invoke('io.ox/mail/actions/move', null, baton);
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
                baton.data = api.threads.resolve(baton.data);
                // call action
                actions.invoke('io.ox/mail/actions/delete', null, baton);
            });
        },

        /*
         * Add support for selection:
         */
        'selection-doubleclick': function (app) {
            // reader does not make sense on small devices
            // they already see emails in full screen
            if (_.device('small')) return;
            app.listView.on('selection:doubleclick', function (list) {
                ox.launch('io.ox/mail/reader/main', { cid: list[0] });
            });
        },

        /*
         * Respond to folder view changes
         */
        'change:folderview': function (app) {
            if (_.device('small')) return;
            app.props.on('change:folderview', function (model, value) {
                app.toggleFolderView(value);
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
            if (_.device('small')) return;
            app.props.on('change:checkboxes', function (model, value) {
                app.listView.toggleCheckboxes(value);
            });
        },

        /*
         * Respond to change:checkboxes on mobiles
         * Set "edit" to "cancel" on button
         */
        'change:checkboxes-mobile': function (app) {
            if (_.device('!small')) return;
            app.props.on('change:checkboxes', function (model, value) {
                app.listView.toggleCheckboxes(value);
                if (value) {
                    app.pages.getNavbar('listView').setRight(gt('Cancel'));
                } else {
                    app.pages.getNavbar('listView').setRight(gt('Edit'));
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
        }
    });

    // launcher
    app.setLauncher(function () {

        // get window
        var win = ox.ui.createWindow({
            name: 'io.ox/mail',
            title: 'Inbox',
            chromeless: true
        });

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
