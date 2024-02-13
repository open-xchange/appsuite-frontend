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

define('io.ox/tasks/main', [
    'io.ox/tasks/api',
    'io.ox/core/extensions',
    'gettext!io.ox/tasks',
    'io.ox/core/tk/vgrid',
    'io.ox/tasks/view-grid-template',
    'io.ox/core/commons',
    'io.ox/tasks/util',
    'io.ox/tasks/view-detail',
    'settings!io.ox/tasks',
    'io.ox/core/folder/api',
    'io.ox/core/folder/tree',
    'io.ox/core/folder/view',
    'io.ox/core/toolbars-mobile',
    'io.ox/core/page-controller',
    'io.ox/core/capabilities',
    'io.ox/backbone/views/actions/util',
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/tasks/toolbar',
    'io.ox/tasks/mobile-navbar-extensions',
    'io.ox/tasks/mobile-toolbar-actions'
], function (api, ext, gt, VGrid, template, commons, util, viewDetail, settings, folderAPI, TreeView, FolderView, Bars, PageController, capabilities, actionsUtil, Dropdown) {

    'use strict';

    // application object
    var app = ox.ui.createApp({
        name: 'io.ox/tasks',
        id: 'io.ox/tasks',
        title: 'Tasks'
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

            // create 3 pages with toolbars and navbars
            app.pages.addPage({
                name: 'folderTree',
                navbar: new Bars.NavbarView({
                    baton: baton,
                    extension: 'io.ox/tasks/mobile/navbar'
                })
            });

            app.pages.addPage({
                name: 'listView',
                startPage: true,
                navbar: new Bars.NavbarView({
                    baton: baton,
                    extension: 'io.ox/tasks/mobile/navbar'
                }),
                toolbar: new Bars.ToolbarView({
                    baton: baton,
                    page: 'listView',
                    extension: 'io.ox/tasks/mobile/toolbar'
                }),
                secondaryToolbar: new Bars.ToolbarView({
                    baton: baton,
                    // nasty, but saves duplicate code. We reuse the toolbar from detailView for multiselect
                    page: 'detailView',
                    extension: 'io.ox/tasks/mobile/toolbar'
                })
            });

            app.pages.addPage({
                name: 'detailView',
                navbar: new Bars.NavbarView({
                    baton: baton,
                    extension: 'io.ox/tasks/mobile/navbar'
                }),
                toolbar: new Bars.ToolbarView({
                    baton: baton,
                    page: 'detailView',
                    extension: 'io.ox/tasks/mobile/toolbar'

                })
            });

            // important
            // tell page controller about special navigation rules
            app.pages.setBackbuttonRules({
                'listView': 'folderTree'
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
                classes: 'leftside border-right'
            });
            app.pages.addPage({
                name: 'detailView',
                container: app.getWindow().nodes.main,
                classes: 'rightside'
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
                // no title
                .setTitle('')
                .setLeft(
                    //#. Used as button label for a navigation action, like the browser back button
                    gt('Back')
                );

            // TODO restore last folder as starting point
            app.pages.showPage('listView');
        },

        'toolbars-mobile': function (app) {

            if (!_.device('smartphone')) return;

            // tell each page's back button what to do
            app.pages.getNavbar('listView').on('leftAction', function () {
                app.pages.goBack();
            });

            app.pages.getNavbar('detailView').on('leftAction', function () {
                app.pages.goBack();
            });

            // checkbox toggle
            app.pages.getNavbar('listView').on('rightAction', function () {
                if (app.props.get('checkboxes') === true) {
                    // leave multiselect? -> clear selection
                    app.grid.selection.clear();
                    app.grid.showTopbar(false);
                    app.grid.showToolbar(false);
                    app.pages.getNavbar('listView').setRight(gt('Edit')).show('.left');
                } else {
                    // also show sorting options
                    app.grid.showTopbar(true);
                    app.grid.showToolbar(true);
                    app.pages.getNavbar('listView').setRight(gt('Cancel')).hide('.left');
                }
                app.props.set('checkboxes', !app.props.get('checkboxes'));
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
         * Split into left and right pane
         */
        'vsplit': function (app) {
            // replacing vsplit with new pageController
            // TODO: refactor app.left and app.right
            var left = app.pages.getPage('listView'),
                right = app.pages.getPage('detailView');

            app.left = left;
            app.right = right.addClass('default-content-padding f6-target task-detail-container').attr({
                'tabindex': -1,
                'aria-label': gt('Task Details')
            }).scrollable();
        },

        'vgrid': function (app) {

            var grid = app.grid,
                allRequest,
                listRequest,
                savedWidth = app.settings.get('vgrid/width/' + _.display());

            // do not apply on touch devices. it's not possible to change the width there
            if (!_.device('touch') && savedWidth) {
                app.right.parent().css('left', savedWidth + 'px');
                app.left.css('width', savedWidth + 'px');
            }
            app.left.append(app.gridContainer);
            app.left.attr({
                role: 'navigation',
                'aria-label': 'Task list'
            });

            grid.addTemplate(template.main);

            commons.wireGridAndAPI(grid, api);
            commons.wireGridAndWindow(grid, app.getWindow());
            commons.wireFirstRefresh(app, api);
            commons.wireGridAndRefresh(grid, api, app.getWindow());

            if (_.device('smartphone')) {
                // remove some stuff from toolbar once
                app.grid.one('meta:update', function () {
                    app.grid.getToolbar().find('.select-all-toggle, .grid-info').hide();
                });
            }
            //custom requests
            allRequest = function () {
                var datacopy,
                    done = grid.prop('done'),
                    sort = grid.prop('sort'),
                    order = grid.prop('order'),
                    column;

                if (sort !== 'urgency') {
                    column = sort;
                } else {
                    column = 317;
                }
                return api.getAll({ folder: this.prop('folder'), sort: column, order: order }).then(function (data) {
                    if (sort !== 'urgency') {
                        datacopy = _.copy(data, true);
                    } else {
                        datacopy = util.sortTasks(data, order);
                    }

                    if (!done) {
                        datacopy = _(datacopy).filter(function (obj) {
                            return obj.status !== 3;
                        });
                    }
                    return datacopy;
                });
            };

            listRequest = function (ids) {
                return api.getList(ids).then(function (list) {
                    //use compact to eliminate unfound tasks to prevent errors(maybe deleted elsewhere)
                    var listcopy = _.copy(_.compact(list), true);

                    return listcopy;
                });
            };

            grid.setAllRequest(allRequest);
            grid.setListRequest(listRequest);
        },

        'restore-grid-options': function (app) {

            app.getGridOptions = function (folder) {
                var options = app.settings.get(['viewOptions', folder], {});
                return _.extend({ done: true, sort: 'urgency', order: 'asc' }, options);
            };

            function restore(folder) {
                var data = app.getGridOptions(folder);
                app.grid.props.set(data);
            }

            app.on('folder:change', restore);
            restore(app.folder.get());
        },

        'store-grid-options': function (app) {
            app.grid.props.on('change', _.debounce(function () {
                if (app.props.get('find-result')) return;
                var folder = app.folder.get(), data = app.grid.props.toJSON();
                app.settings
                    .set(['viewOptions', folder], { done: data.done, sort: data.sort, order: data.order })
                    .save();
            }, 500));
        },

        'grid-options': function (app) {
            var grid = app.grid;
            function updateGridOptions() {

                var dropdown = grid.getToolbar().find('.grid-options'),
                    props = grid.props;
                if (props.get('order') === 'desc') {
                    dropdown.find('.fa-arrow-down').css('opacity', 1).end()
                        .find('.fa-arrow-up').css('opacity', 0.4);
                } else {
                    dropdown.find('.fa-arrow-up').css('opacity', 1).end()
                        .find('.fa-arrow-down').css('opacity', 0.4);
                }
                //update api property (used cid in api.updateAllCache, api.create)
                api.options.requests.all.sort = props.get('sort') !== 'urgency' ? props.get('sort') : 317;
                api.options.requests.all.order = props.get('order');
            }

            grid.selection.on('change', app.removeButton);

            grid.on('change:prop', function () {
                updateGridOptions();
                //hasDeletePermission = undefined;
            });

            commons.addGridToolbarFolder(app, grid);
            updateGridOptions();
        },

        'show-task': function (app) {
            var showTask, drawTask, drawFail;

            //detailview lfo callbacks
            showTask = function (obj) {
                // be busy
                app.right.busy({ empty: true });
                // cids should also work
                if (_.isString(obj)) obj = _.cid(obj);
                //remove unnecessary information
                obj = { folder: obj.folder || obj.folder_id, id: obj.id };
                api.get(obj)
                    .done(_.lfo(drawTask))
                    .fail(_.lfo(drawFail, obj));
            };

            showTask.cancel = function () {
                _.lfo(drawTask);
                _.lfo(drawFail);
            };

            drawTask = function (data) {
                var baton = ext.Baton({ data: data });
                // since we use a classic toolbar on non-smartphone devices, we disable inline ox.ui.createApps in this case
                baton.disable('io.ox/tasks/detail-inline', 'inline-links');
                app.right.idle().empty().append(viewDetail.draw(baton));
            };

            drawFail = function (obj) {
                app.right.idle().empty().append(
                    $.fail(gt('Couldn\'t load that task.'), function () {
                        showTask(obj);
                    })
                );
            };

            commons.wireGridAndSelectionChange(app.grid, 'io.ox/tasks', showTask, app.right, api);

        },
        /*
         * Always change pages on tap, don't wait for data to load
         */
        'select:task-mobile': function (app) {
            if (_.device('!smartphone')) return;
            app.grid.getContainer().on('click', '.vgrid-cell.selectable', function () {
                if (app.props.get('checkboxes') === true) return;
                // hijack selection event hub to trigger page-change event
                app.grid.selection.trigger('pagechange:detailView');
                app.pages.changePage('detailView');
            });
        },
        /*
         * Folder view support
         */
        'folder-view': function (app) {

            if (_.device('smartphone')) return;

            // tree view
            app.treeView = new TreeView({ app: app, contextmenu: true, flat: true, indent: false, module: 'tasks' });
            FolderView.initialize({ app: app, tree: app.treeView });
            app.folderView.resize.enable();
        },

        'folder-view-mobile': function (app) {

            if (_.device('!smartphone')) return;

            var nav = app.pages.getNavbar('folderTree'),
                page = app.pages.getPage('folderTree');

            nav.on('rightAction', function () {
                app.toggleFolders();
            });

            var tree = new TreeView({ app: app, contextmenu: true, flat: true, indent: false, module: 'tasks' });

            // initialize folder view
            FolderView.initialize({ app: app, tree: tree });
            page.append(tree.render().$el);
        },

        /*
         * Default application properties
         */
        'props': function (app) {
            // introduce shared properties
            app.props = new Backbone.Model({
                'checkboxes': _.device('smartphone') ? false : app.settings.get('showCheckboxes', false),
                'folderEditMode': false
            });
        },

        'vgrid-checkboxes': function (app) {
            // always hide checkboxes on smartphone devices initially
            if (_.device('smartphone')) return;
            var grid = app.getGrid();
            grid.setEditable(app.props.get('checkboxes'));
        },

        /*
         * Set folderview property
         */
        'prop-folderview': function (app) {
            app.props.set('folderview', _.device('smartphone') ? false : app.settings.get('folderview/visible/' + _.display(), true));
        },

        /*
         * Store view options
         */
        'store-view-options': function (app) {
            if (_.device('smartphone')) return;
            app.props.on('change', _.debounce(function () {
                if (app.props.get('find-result')) return;
                var data = app.props.toJSON();
                app.settings
                    .set('showCheckboxes', data.checkboxes)
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

        'change:folder-mobile': function () {
            if (_.device('!smartphone')) return;
            var updateTitle = _.throttle(function () {
                var title;
                if (app.grid.meta.total !== 0) {
                    title = app.grid.meta.title + ' (' + app.grid.meta.total + ')';
                } else {
                    title = app.grid.meta.title;
                }
                app.pages.getNavbar('listView').setTitle(title);
            }, 500);

            // set title and item amount in navbar
            app.grid.on('meta:update', updateTitle);

        },

        /*
         * Respond to change:checkboxes
         */
        'change:checkboxes': function (app) {
            app.props.on('change:checkboxes', function (model, value) {
                var grid = app.getGrid();
                grid.setEditable(value);
            });
        },

        /*
         * Folderview toolbar
         */
        'folderview-toolbar': function (app) {
            if (_.device('smartphone')) return;
            commons.mediateFolderView(app);
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
            api.on('error:TSK-0023', function (e, error) {
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

        /*
         * Drag and Drop support
         */
        'drag-n-drop': function (app) {
            if (_.device('touch')) return;
            app.getWindow().nodes.outer.on('selection:drop', function (e, baton) {
                actionsUtil.invoke('io.ox/tasks/actions/move', baton);
            });
        },

        'create:task': function (app) {
            //jump to newly created items
            api.on('create', function (e, data) {
                app.grid.selection.set(data);
            });
        },

        'move': function (app) {
            if (!_.device('smartphone')) return;
            api.on('move', function () {
                if (app.pages.getCurrentPage().name === 'detailView') {
                    app.pages.goBack();
                }
                app.grid.selection.clear();
            });
        },

        /*
         * Add support for selection:
         */
        'selection-doubleclick': function (app) {
            // detail app does not make sense on small devices
            // they already see tasks in full screen
            if (_.device('smartphone')) return;
            app.grid.selection.on('selection:doubleclick', function (e, key) {
                ox.launch('io.ox/tasks/detail/main', { cid: key });
            });
        },

        /*
         * Handle delete event based on keyboard shortcut
         */
        'selection-delete': function (app) {
            app.grid.selection.on('selection:delete', function (e, list) {
                var baton = ext.Baton({ data: list });
                actionsUtil.invoke('io.ox/tasks/actions/delete', baton);
            });
        },

        /*
         * Handle delete event based on keyboard shortcut
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

            function registerHandler(model, find) {
                find.on({
                    'find:query': function () {
                        // hide sort options
                        app.grid.getToolbar().find('.grid-options:first').hide();
                    },
                    'find:cancel': function () {
                        // show sort options again
                        app.grid.getToolbar().find('.grid-options:first').show();
                    }
                });
            }

            return app.get('find') ? registerHandler(app, app.get('find')) : app.once('change:find', registerHandler);
        },

        'contextual-help': function (app) {
            app.getContextualHelp = function () {
                return 'ox.appsuite.user.sect.tasks.gui.html';
            };
        },

        // reverted for 7.10
        // 'primary-action': function (app) {
        //     app.addPrimaryAction({
        //         point: 'io.ox/tasks/sidepanel',
        //         label: gt('New task'),
        //         action: 'io.ox/tasks/actions/create',
        //         toolbar: 'create'
        //     });
        // },

        'sidepanel': function (app) {
            if (_.device('smartphone')) return;
            ext.point('io.ox/tasks/sidepanel').extend({
                id: 'tree',
                index: 100,
                draw: function (baton) {
                    // add border & render tree and add to DOM
                    this.addClass('border-right').append(baton.app.treeView.$el);
                }
            });

            var node = app.getWindow().nodes.sidepanel;
            ext.point('io.ox/tasks/sidepanel').invoke('draw', node, ext.Baton({ app: app }));
        },

        'metrics': function (app) {

            // hint: toolbar metrics are registery by extension 'metrics-toolbar'
            require(['io.ox/metrics/main'], function (metrics) {
                if (!metrics.isEnabled()) return;

                var nodes = app.getWindow().nodes,
                    sidepanel = nodes.sidepanel;

                function track(target, node) {
                    node = $(node);
                    var isSelect = !!node.attr('data-name'),
                        action = (node.attr('data-action') || '').replace(/^io\.ox\/tasks\/(detail\/)?/, '');
                    metrics.trackEvent({
                        app: 'tasks',
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

                // vgrid toolbar
                nodes.main.find('.vgrid-toolbar').on('mousedown', 'a[data-name], a[data-action]', function (e) {
                    var node = $(e.currentTarget);
                    var action = node.attr('data-name') || node.attr('data-action');
                    if (!action) return;
                    metrics.trackEvent({
                        app: 'tasks',
                        target: 'list/toolbar',
                        type: 'click',
                        action: action
                    });
                });
                // folder tree action
                _.defer(function () {
                    sidepanel.find('.context-dropdown').on('mousedown', 'a', function (e) {
                        metrics.trackEvent({
                            app: 'tasks',
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
                        app: 'tasks',
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
                                app: 'tasks',
                                target: 'folder',
                                type: 'click',
                                action: 'select',
                                detail: list.join('/')
                            });
                        });
                });
                // selection in listview
                app.grid.selection.on({
                    'change': function (event, list) {
                        if (!list.length) return;
                        metrics.trackEvent({
                            app: 'tasks',
                            target: 'list',
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

        var win,
            grid,
            showSwipeButton = false,
            hasDeletePermission;

        // get window
        win = ox.ui.createWindow({
            name: 'io.ox/tasks',
            title: 'Tasks',
            chromeless: true,
            find: capabilities.has('search')
        });

        win.addClass('io-ox-tasks-main');
        app.setWindow(win);
        app.settings = settings;

        var removeButton = function () {
            if (showSwipeButton) {
                var g = grid.getContainer();
                $('.swipeDelete', g).remove();
                showSwipeButton = false;
            }
        };

        app.removeButton = removeButton;

        ext.point('io.ox/tasks/swipeDelete').extend({
            index: 666,
            id: 'deleteButton',
            draw: function (baton) {
                // remove old buttons first
                if (showSwipeButton) {
                    removeButton();
                }
                var div = $('<div class="swipeDelete fadein fast"><i class="fa fa-trash-o trashicon" aria-hidden="true"/></div>');
                this.append(
                    div.on('mousedown', function (e) {
                        // we have to use mousedown as the selection listens to this, too
                        // otherwise we are to late to get the event
                        e.stopImmediatePropagation();
                    })
                    .on('tap', function (e) {
                        e.preventDefault();
                        removeButton();
                        showSwipeButton = false;
                        actionsUtil.invoke('io.ox/tasks/actions/delete', baton);
                    })
                );
                showSwipeButton = true;
            }
        });

        // swipe handler
        var swipeRightHandler = function (e, id, cell) {
            var obj = _.cid(id);
            if (hasDeletePermission === undefined) {
                folderAPI.get(obj.folder_id).done(function (data) {
                    if (folderAPI.can('delete', data)) {
                        hasDeletePermission = true;
                        ext.point('io.ox/tasks/swipeDelete').invoke('draw', cell, obj);
                    }
                });
            } else if (hasDeletePermission) {
                ext.point('io.ox/tasks/swipeDelete').invoke('draw', cell, obj);
            }
        };
        app.gridContainer = $('<div class="border-right">');

        grid = new VGrid(app.gridContainer, {
            settings: settings,
            swipeLeftHandler: swipeRightHandler,
            showToggle: _.device('smartphone'),
            hideTopbar: _.device('smartphone'),
            hideToolbar: _.device('smartphone'),
            // if it's shown, it should be on the top
            toolbarPlacement: 'top',
            templateOptions: { tagName: 'li', defaultClassName: 'vgrid-cell list-unstyled' }
        });
        app.gridContainer.find('.vgrid-toolbar').attr('aria-label', gt('Tasks toolbar'));

        app.grid = grid;

        // workaround: windowmanager not visible so height calculation for grid item fails
        if (!ox.ui.screens.current()) ox.ui.screens.one('show-windowmanager', grid.paint.bind(grid));

        app.getGrid = function () {
            return grid;
        };
        // FIXME: debugging leftover?
        window.tasks = app;

        //ready for show
        commons.addFolderSupport(app, grid, 'tasks', options.folder)
            .always(function () {
                app.mediate();
                win.show();
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

    //extension points
    ext.point('io.ox/tasks/vgrid/toolbar').extend({
        id: 'dropdown',
        index: 1000000000000,
        draw: function () {
            var dropdown = new Dropdown({
                model: app.grid.props,
                tagName: 'div',
                caret: false,
                label: function () {
                    return [$('<i class="fa fa-arrow-down" aria-hidden="true">'), $('<i class="fa fa-arrow-up" aria-hidden="true">'), $('<span class="sr-only">').text(gt('Sort options'))];
                }
            })
                .header(gt('Sort options'))
                .option('sort', 'urgency', gt('Urgency'))
                .option('sort', '300', gt('Status'))
                .option('sort', '317', gt('Due date'))
                .option('sort', '200', gt('Subject'))
                .option('sort', '309', gt('Priority'))
                .divider()
                .header(gt('Order'))
                .option('order', 'asc', gt('Ascending'))
                .option('order', 'desc', gt('Descending'))
                .divider()
                .option('done', true, gt('Show done tasks'))
                .listenTo(app.grid.props, 'change:sort change:order change:done', function () {
                    app.grid.refresh();
                });

            this.append(
                $('<div class="grid-options dropdown">').append(
                    dropdown.render().$el.attr('data-dropdown', 'sort')
                )
            );
        }
    });

    return {
        getApp: app.getInstance
    };
});
