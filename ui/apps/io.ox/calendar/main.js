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
    'settings!io.ox/calendar',
    'gettext!io.ox/calendar',
    'io.ox/core/tk/list-control',
    'io.ox/calendar/list/listview',
    'io.ox/core/toolbars-mobile',
    'io.ox/core/page-controller',
    'io.ox/calendar/api',
    'io.ox/calendar/mobile-navbar-extensions',
    'io.ox/calendar/mobile-toolbar-actions',
    'io.ox/calendar/toolbar',
    'io.ox/calendar/actions',
    'less!io.ox/calendar/style',
    'io.ox/calendar/week/view'
], function (commons, ext, capabilities, folderAPI, TreeView, FolderView, settings, gt, ListViewControl, CalendarListView, Bars, PageController, api) {

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

            app.pages = new PageController({ appname: app.options.name });

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

            app.pages.addPage({
                name: 'listView',
                classes: 'leftside'
            });

            app.pages.addPage({
                name: 'detailView',
                classes: 'rightside'
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

        /*
         * Folder view support
         */
        'folder-view': function (app) {

            app.treeView = new TreeView({ app: app, contextmenu: true, flat: true, indent: false, module: 'calendar' });
            FolderView.initialize({ app: app, tree: app.treeView });
            app.folderView.resize.enable();
            app.folderView.tree.$el.attr('aria-label', gt('Calendars'));
        },

        'multi-folder-selection': function (app) {
            var folders = settings.get('selectedFolders', ['cal://0/' + folderAPI.getDefaultFolder('calendar')]);
            app.folders = {
                getData: function () {
                    return $.when.apply($, folders.map(function (folder) {
                        return folderAPI.get(folder);
                    })).then(function () {
                        var data = _(arguments).toArray();
                        return _.object(folders, data);
                    });
                },
                isSelected: function (id) {
                    if (_.isObject(id)) id = id.id;
                    return folders.indexOf(id) >= 0;
                },
                list: function () {
                    return folders;
                },
                add: function (folder) {
                    folders = [].concat(folders);
                    folders.push(folder);
                    app.trigger('folders:change');
                    settings.set('selectedFolders', folders);
                },
                remove: function (folder) {
                    var index = folders.indexOf(folder);
                    if (index >= 0) {
                        folders = [].concat(folders);
                        folders.splice(index, 1);
                        app.trigger('folders:change');
                        settings.set('selectedFolders', folders);
                    }
                }
            };
        },

        'toggle-folder-view': function (app) {
            app.toggleFolderView = function (e) {
                e.preventDefault();
                app.folderView.toggle(e.data.state);
            };

            ext.point('io.ox/calendar/sidepanel').extend({
                id: 'toggle-folderview',
                index: 1000,
                draw: function () {
                    if (_.device('smartphone')) return;
                    this.addClass('bottom-toolbar').append(
                        $('<div class="generic-toolbar bottom visual-focus">').append(
                            $('<a href="#" class="toolbar-item" role="button" data-action="close-folder-view">').attr('aria-label', gt('Close folder view'))
                            .append(
                                $('<i class="fa fa-angle-double-left" aria-hidden="true">').attr('title', gt('Close folder view'))
                            )
                            .on('click', { state: false }, app.toggleFolderView)
                        )
                    );
                }
            });
        },

        'listview': function (app) {
            app.listView = new CalendarListView({ app: app, draggable: false, pagination: false, labels: true, ignoreFocus: true });
            app.listView.model.set({ view: 'list' });
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
            var view = settings.get('viewView') || 'week:week';
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
            if (_.device('smartphone')) return;
            app.props.on('change:checkboxes', function (model, value) {
                app.listView.toggleCheckboxes(value);
                app.listControl.$('.select-all').toggle('value');
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
         * change to default folder on no permission or folder not found errors
         */
        'folder-error': function (app) {
            app.folder.handleErrors();
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

            app.once('change:find', function (model, find) {
                // additional handler: switch to list perspective (and back)
                find.on({
                    'find:query': function () {
                        // switch to supported perspective
                        lastPerspective = lastPerspective || app.props.get('layout') || _.url.hash('perspective');
                        if (lastPerspective !== SEARCH_PERSPECTIVE) {
                            // fluent option: do not write to user settings
                            app.props.set('layout', SEARCH_PERSPECTIVE, { fluent: true });
                            // cancel search when user changes view
                            app.props.on('change', find.cancel);
                        }
                    },
                    'find:cancel': function () {
                        // switch back to perspective used before
                        var currentPerspective = _.url.hash('perspective') || app.props.get('layout');
                        if (lastPerspective && lastPerspective !== currentPerspective) {
                            app.props.set('layout', lastPerspective);
                        }
                        // disable
                        app.props.off('change', find.cancel);
                        // reset
                        lastPerspective = undefined;
                    }
                });
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
                app.pages.getNavbar('week').setLeft(app.refDate.format('MMMM'));
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

        'contextual-help': function (app) {
            app.getContextualHelp = function () {
                return 'ox.appsuite.user.sect.calendar.gui.html#ox.appsuite.user.sect.calendar.gui';
            };
        },

        'sidepanel': function (app) {

            ext.point('io.ox/calendar/sidepanel').extend({
                id: 'tree',
                index: 100,
                draw: function (baton) {
                    // add border & render tree and add to DOM
                    this.addClass('border-right').append(baton.app.treeView.$el);
                }
            });

            var node = app.getWindow().nodes.sidepanel;
            ext.point('io.ox/calendar/sidepanel').invoke('draw', node, ext.Baton({ app: app }));
        },

        'metrics': function (app) {

            require(['io.ox/metrics/main'], function (metrics) {
                if (!metrics.isEnabled()) return;

                var nodes = app.getWindow().nodes,
                    toolbar = nodes.body.find('.classic-toolbar-container'),
                    sidepanel = nodes.sidepanel;
                // toolbar actions
                toolbar.on('mousedown', '.io-ox-action-link:not(.dropdown-toggle)', function (e) {
                    metrics.trackEvent({
                        app: 'calendar',
                        target: 'toolbar',
                        type: 'click',
                        action: $(e.currentTarget).attr('data-action')
                    });
                });
                // toolbar options dropdown
                toolbar.on('mousedown', '.dropdown a:not(.io-ox-action-link)', function (e) {
                    var node =  $(e.target).closest('a'),
                        isToggle = node.attr('data-toggle') === 'true';
                    if (!node.attr('data-name')) return;
                    metrics.trackEvent({
                        app: 'calendar',
                        target: 'toolbar',
                        type: 'click',
                        action: node.attr('data-action') || node.attr('data-name'),
                        detail: isToggle ? !node.find('.fa-check').length : node.attr('data-value')
                    });
                });
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
                // detail view
                nodes.outer.on('mousedown', '.participants-view .io-ox-action-link', function (e) {
                    metrics.trackEvent({
                        app: 'calendar',
                        target: 'detail/toolbar',
                        type: 'click',
                        action: $(e.currentTarget).attr('data-action')
                    });
                });
                // detail view as sidepopup
                nodes.outer.on('mousedown', '.io-ox-sidepopup .io-ox-action-link', function (e) {
                    metrics.trackEvent({
                        app: 'calendar',
                        target: 'detail/toolbar',
                        type: 'click',
                        action: $(e.currentTarget).attr('data-action')
                    });
                });
                // folder tree action
                sidepanel.find('.context-dropdown').on('mousedown', 'a', function (e) {
                    metrics.trackEvent({
                        app: 'calendar',
                        target: 'folder/context-menu',
                        type: 'click',
                        action: $(e.currentTarget).attr('data-action')
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
        // TODO change core settings so the default folder isnt just a number
        var defaultFolder  = options.folder || ('cal://0/' + folderAPI.getDefaultFolder('calendar'));
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
            addFolderSupport(defaultFolder);
        }

        function addFolderSupport(folder) {
            commons.addFolderSupport(app, null, 'calendar', folder)
                .always(function () {
                    app.mediate();
                    win.show();
                })
                .done(function () {

                    // app perspective
                    var lastPerspective = options.perspective || _.url.hash('perspective') || app.props.get('layout');

                    if (_.device('smartphone') && _.indexOf(['week:workweek', 'week:week', 'calendar'], lastPerspective) >= 0) {
                        lastPerspective = 'week:day';
                    } else if (lastPerspective === 'calendar') {
                        // corrupt data fix
                        lastPerspective = 'week:workweek';
                    }
                    ox.ui.Perspective.show(app, lastPerspective, { disableAnimations: true });
                    app.props.set('layout', lastPerspective);
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
                var perspective = options.perspective;
                if (_.device('smartphone') && _.indexOf(['week:workweek', 'week:week', 'calendar'], perspective) >= 0) {
                    perspective = 'week:day';
                } else if (perspective === 'calendar') {
                    // corrupt data fix
                    perspective = 'week:workweek';
                }
                defs.push(app.props.set('layout', perspective));
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
