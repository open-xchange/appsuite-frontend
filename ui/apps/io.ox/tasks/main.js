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
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/tasks/main',
    ['io.ox/tasks/api',
     'io.ox/core/extensions',
     'io.ox/core/extPatterns/actions',
     'gettext!io.ox/tasks',
     'io.ox/core/tk/vgrid',
     'io.ox/tasks/view-grid-template',
     'io.ox/core/commons',
     'io.ox/tasks/util',
     'io.ox/tasks/view-detail',
     'settings!io.ox/tasks',
     'io.ox/core/api/folder',
     'io.ox/core/commons-folderview',
     'io.ox/core/toolbars-mobile',
     'io.ox/core/page-controller',
     'io.ox/tasks/toolbar',
     'io.ox/tasks/mobile-navbar-extensions'
     //'io.ox/tasks/mobile-toolbar-actions',
    ], function (api, ext, actions, gt, VGrid, template, commons, util, viewDetail, settings, folderAPI, FolderView, Bars, PageController) {

    'use strict';

    // application object
    var app = ox.ui.createApp({
        name: 'io.ox/tasks',
        title: 'Tasks'
    });

    // a bit too global vars
    var grid, taskToolbarOptions;

    app.mediator({
        /*
         * Init pages for mobile use
         * Each View will get a single page with own
         * toolbars and navbars. A PageController instance
         * will handle the page changes and also maintain
         * the state of the toolbars and navbars
         */
        'pages-mobile': function (app) {
            if (_.device('!small')) return;
            var c = app.getWindow().nodes.main;
            var navbar = $('<div class="mobile-navbar">'),
                toolbar = $('<div class="mobile-toolbar">');
            app.navbar = navbar;
            app.toolbar = toolbar;

            app.pages = new PageController(app, {container: c});

            app.getWindow().nodes.body.addClass('classic-toolbar-visible').append(navbar, toolbar);

            // create 3 pages with toolbars and navbars
            app.pages.addPage({
                name: 'folderTree',
                navbar: new Bars.NavbarView({
                    app: app,
                    extension: 'io.ox/tasks/mobile/navbar'
                })
            });

            app.pages.addPage({
                name: 'listView',
                startPage: true,
                navbar: new Bars.NavbarView({
                    app: app,
                    extension: 'io.ox/tasks/mobile/navbar'
                }),
                toolbar: new Bars.ToolbarView({
                    app: app,
                    page: 'listView',
                    extension: 'io.ox/tasks/mobile/toolbar'
                }),
                secondaryToolbar: new Bars.ToolbarView({
                    app: app,
                    page: 'detailView', // nasty, but saves duplicate code. We reuse the toolbar from detailView for multiselect
                    extension: 'io.ox/tasks/mobile/toolbar'
                })
            });

            app.pages.addPage({
                name: 'detailView',
                navbar: new Bars.NavbarView({
                    app: app,
                    extension: 'io.ox/tasks/mobile/navbar'
                }),
                toolbar: new Bars.ToolbarView({
                    app: app,
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
         * Init all nav- and toolbar labels for mobile
         */
        'navbars-mobile': function (app) {

            if (!_.device('small')) return;

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
                .setTitle('') // no title
                .setLeft(
                    //#. Used as button label for a navigation action, like the browser back button
                    gt('Back')
                );

            // TODO restore last folder as starting point
            app.pages.showPage('listView');
        },

       'toolbars-mobile': function (app) {
            if (!_.device('small')) return;

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
                }
                app.props.set('checkboxes', !app.props.get('checkboxes'));
            });

            app.pages.getNavbar('folderTree').on('rightAction', function () {
                app.toggleFolders();
            });

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
            app.right = right.addClass('default-content-padding f6-target task-detail-container')
            .attr({
                'tabindex': 1,
                'role': 'complementary',
                'aria-label': gt('Task Details')
            })
            .scrollable();
        },

        'vgrid': function (app) {

            var grid = app.grid;

            app.left.append(app.gridContainer);

            grid.addTemplate(template.main);

            commons.wireGridAndAPI(grid, api);
            commons.wireGridAndWindow(grid, app.getWindow());
            commons.wireFirstRefresh(app, api);
            commons.wireGridAndRefresh(grid, api, app.getWindow());
            //custom requests
            var allRequest = function () {
                    var datacopy,
                        done = grid.prop('done'),
                        sort = grid.prop('sort'),
                        order = grid.prop('order'),
                        column;
                    if (sort !== 'state') {
                        column = sort;
                    } else {
                        column = 202;
                    }
                    return api.getAll({folder: this.prop('folder'), sort: column, order: order}).pipe(function (data) {
                        if (sort !== 'state') {
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
                },
                listRequest = function (ids) {
                    return api.getList(ids).pipe(function (list) {
                        var listcopy = _.copy(_.compact(list), true),//use compact to eliminate unfound tasks to prevent errors(maybe deleted elsewhere)
                            i = 0;
                        for (; i < listcopy.length; i++) {
                            listcopy[i] = util.interpretTask(listcopy[i]);
                        }

                        return listcopy;
                    });
                };

            grid.setAllRequest(allRequest);
            grid.setListRequest(listRequest);
        },

        'show-contact': function (app) {
            var showTask, drawTask, drawFail;

            //detailview lfo callbacks
            showTask = function (obj) {
                // be busy
                app.right.busy(true);
                obj = {folder: obj.folder || obj.folder_id, id: obj.id};//remove unnecessary information
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
                // since we use a classic toolbar on non-small devices, we disable inline links in this case
                if (_.device('!small')) baton.disable('io.ox/tasks/detail-inline', 'inline-links');
                app.right.idle().empty().append(viewDetail.draw(baton));
            };

            drawFail = function (obj) {
                app.right.idle().empty().append(
                    $.fail(gt('Couldn\'t load that task.'), function () {
                        showTask(obj);
                    })
                );
            };

            commons.wireGridAndSelectionChange(app.grid, 'io.ox/tasks', showTask, app.right, api, true);

        },
        /*
         * Always change pages on tap, don't wait for data to load
         */
        'select:contact-mobile': function (app) {
            if (_.device('!small')) return;

            app.grid.getContainer().on('tap', '.vgrid-cell.selectable', function () {
                //if (app.props.get('checkboxes') === true) return;
                // hijack selection event hub to trigger page-change event
                app.grid.selection.trigger('pagechange:detailView');
                app.pages.changePage('detailView');
            });
        },
        /*
         * Folder view support
         */
        'folder-view': function (app) {
            // folder tree
            commons.addFolderView(app, { type: 'tasks', view: 'FolderList' });
            app.getWindow().nodes.sidepanel.addClass('border-right');
        },

        'folder-view-mobile': function (app) {

            if (_.device('!small')) return;

            var view = new FolderView(app, {
                type: 'tasks',
                container: app.pages.getPage('folderTree')
            });
            view.handleFolderChange();
            view.load();

            // bind action for edit button
            //app.bindFolderChange();

            // make folder visible by default
            //app.toggleFolderView(true);

        },

        /*
         * Default application properties
         */
        'props': function (app) {
            // introduce shared properties
            app.props = new Backbone.Model({
                'checkboxes': app.settings.get('showCheckboxes', true)
            });
        },

        'vgrid-checkboxes': function (app) {
            // always hide checkboxes on small devices initially
            if (_.device('small')) return;
            var grid = app.getGrid();
            grid.setEditable(app.props.get('checkboxes'));
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
                    .set('showCheckboxes', data.checkboxes)
                    .save();
            }, 500));
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
                var grid = app.getGrid();
                grid.setEditable(value);
            });
        },

        /*
         * Folderview toolbar
         */
        'folderview-toolbar': function (app) {
            if (_.device('small')) return;
            commons.mediateFolderView(app);
        }
    });

    // application object
    var app = ox.ui.createApp({ name: 'io.ox/tasks', title: 'Tasks' }),

    // VGridToolbarOptions
    taskToolbarOptions = function (e) {
        e.preventDefault();
        var option = $(this).attr('data-option'),
            grid = e.data.grid;
        if (option === 'asc' || option === 'desc') {
            grid.prop('order', option).refresh();
        } else if (option !== 'done') {
            grid.prop('sort', option).refresh();
        } else if (option === 'done') {
            grid.prop(option, !grid.prop(option)).refresh();
        }
    };

    // launcher
    app.setLauncher(function (options) {

        var // app window
            win,
            // grid
            grid,
            // nodes
            //left,
            //right,
            showSwipeButton = false,
            hasDeletePermission;

        // get window
        win = ox.ui.createWindow({
            name: 'io.ox/tasks',
            title: 'Tasks',
            chromeless: _.device('!small')
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

        ext.point('io.ox/tasks/swipeDelete').extend({
            index: 666,
            id: 'deleteButton',
            draw: function (baton) {
                // remove old buttons first
                if (showSwipeButton) {
                    removeButton();
                }

                this.append(
                    $('<div class="cell-button swipeDelete fadein fast">')
                        .text(gt('Delete'))
                        .on('mousedown', function (e) {
                            // we have to use mousedown as the selection listens to this, too
                            // otherwise we are to late to get the event
                            e.stopImmediatePropagation();
                        }).on('tap', function (e) {
                            e.preventDefault();
                            removeButton();
                            showSwipeButton = false;
                            actions.invoke('io.ox/tasks/actions/delete', null, baton);
                        })
                );
                showSwipeButton = true;
            }
        });

        // swipe handler
        var swipeRightHandler = function (e, id, cell) {
            var obj = _.cid(id);
            if (hasDeletePermission === undefined) {
                folderAPI.get({folder: obj.folder_id}).done(function (data) {
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
          // grid
        var grid = new VGrid(app.gridContainer, {
            settings: settings,
            swipeRightHandler: swipeRightHandler,
            showToggle: _.device('small')
        });
        app.grid = grid;


        app.getGrid = function () {
            return grid;
        };

        // add grid options
        grid.prop('done', true);
        grid.prop('sort', 'state');
        grid.prop('order', 'asc');

        function updateGridOptions() {
            var dropdown = grid.getToolbar().find('.grid-options'),
                list = dropdown.find('ul'),
                props = grid.prop();
            // uncheck all
            list.find('i').attr('class', 'fa fa-fw');
            // check right options
            list.find(
                    '[data-option="' + props.sort + '"], ' +
                    '[data-option="' + props.order + '"], ' +
                    '[data-option="' + (props.done ? 'done' : '~done') + '"]'
                ).find('i').attr('class', 'fa fa-check');
            // order
            if (props.order === 'desc') {
                dropdown.find('.fa-arrow-down').css('opacity', 1).end()
                    .find('.fa-arrow-up').css('opacity', 0.4);
            } else {
                dropdown.find('.fa-arrow-up').css('opacity', 1).end()
                    .find('.fa-arrow-down').css('opacity', 0.4);
            }
            //update api property (used cid in api.updateAllCache, api.create)
            api.options.requests.all.sort = props.sort !== 'state' ? props.sort : 202;
            api.options.requests.all.order = props.order;
        }
        grid.selection.on('change', removeButton);

        grid.on('change:prop', function () {
            updateGridOptions();
            removeButton();
            hasDeletePermission = undefined;
        });
        updateGridOptions();

        commons.addGridToolbarFolder(app, grid);

        // drag & drop
        win.nodes.outer.on('selection:drop', function (e, baton) {
            actions.invoke('io.ox/tasks/actions/move', null, baton);
        });

        //jump to newly created items
        api.on('create', function (e, data) {
            grid.selection.set(data);
        });
        window.tasks = app;
        //ready for show
        commons.addFolderSupport(app, grid, 'tasks', options.folder)
            .always(function () {
                app.mediate();
                win.show();
            });
    });

    //extension points
    ext.point('io.ox/tasks/vgrid/toolbar').extend({
        id: 'dropdown',
        index: 'last',
        draw: function () {
            this.append(
                $('<div class="grid-options dropdown">')
                .append(
                    $('<a href="#" tabindex="1" data-toggle="dropdown" role="menuitem" aria-haspopup="true">').attr('aria-label', gt('Sort options'))
                    .append($('<i class="fa fa-arrow-down">'), $('<i class="fa fa-arrow-up">'))
                    .dropdown(),
                    $('<ul class="dropdown-menu" role="menu">')
                    .append(
                        $('<li>').append($('<a href="#" data-option="state">').text(gt('Status')).prepend($('<i>'))), // state becomes Bundesland :)
                        $('<li>').append($('<a href="#" data-option="202">').text(gt('Due date')).prepend($('<i>'))),
                        $('<li>').append($('<a href="#" data-option="200">').text(gt('Subject')).prepend($('<i>'))),
                        $('<li>').append($('<a href="#" data-option="309">').text(gt('Priority')).prepend($('<i>'))),
                        $('<li class="divider">'),
                        $('<li>').append($('<a href="#" data-option="asc">').text(gt('Ascending')).prepend($('<i>'))),
                        $('<li>').append($('<a href="#" data-option="desc">').text(gt('Descending')).prepend($('<i>'))),
                        $('<li class="divider">'),
                        $('<li>').append($('<a href="#" data-option="done">').text(gt('Show done tasks')).prepend($('<i>')))
                    ).on('click', 'a', { grid: grid }, taskToolbarOptions)
                )
            );
        }
    });

    return {
        getApp: app.getInstance
    };
});
