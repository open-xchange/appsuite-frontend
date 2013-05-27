/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
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
     'settings!io.ox/tasks'
    ], function (api, ext, actions, gt, VGrid, template, commons, util, viewDetail, settings) {

    'use strict';

    // application object
    var app = ox.ui.createApp({ name: 'io.ox/tasks', title: 'Tasks' }),
        // app window
        win,
        // grid
        grid,
        // nodes
        left,
        right,
        //VGridToolbarOptions
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

        // get window
        win = ox.ui.createWindow({
            name: 'io.ox/tasks',
            title: 'Tasks',
            toolbar: true,
            search: true
        });

        win.addClass('io-ox-tasks-main');
        app.setWindow(win);
        app.settings = settings;

        // folder tree
        commons.addFolderView(app, { type: 'tasks', view: 'FolderList' });

        var vsplit = commons.vsplit(win.nodes.main, app);
        left = vsplit.left.addClass('border-right');
        right = vsplit.right.addClass('default-content-padding').attr('tabindex', 1).scrollable();

        // grid
        grid = new VGrid(left, {settings: settings});

        grid.addTemplate(template.main);

        commons.wireGridAndAPI(grid, api);
        commons.wireGridAndSearch(grid, win, api);

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
                return api.getAll({folder: this.prop('folder'), sort: column, order: order}, false).pipe(function (data) {
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
                return api.getList(ids, false).pipe(function (list) {
                    var listcopy = _.copy(_.compact(list), true),//use compact to eliminate unfound tasks to prevent errors(maybe deleted elsewhere)
                        i = 0;
                    for (; i < listcopy.length; i++) {
                        listcopy[i] = util.interpretTask(listcopy[i]);
                    }

                    return listcopy;
                });
            },
            searchAllRequest = function () {
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
                return api.search({pattern: win.search.query, folder: this.prop('folder')}, {sort: column, order: order}).pipe(function (data) {
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
            };

        grid.setAllRequest(allRequest);
        grid.setListRequest(listRequest);

        // search: all request
        grid.setAllRequest('search', searchAllRequest);
        // search: list request
        grid.setListRequest('search', listRequest);

        var showTask, drawTask, drawFail;

        //detailview lfo callbacks
        showTask = function (obj) {
            // be busy
            right.busy(true);
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
            right.idle().empty().append(viewDetail.draw(data));
        };

        drawFail = function (obj) {
            right.idle().empty().append(
                $.fail(gt("Couldn't load that task."), function () {
                    showTask(obj);
                })
            );
        };

        commons.wireGridAndSelectionChange(grid, 'io.ox/tasks', showTask, right, api);
        commons.wireGridAndWindow(grid, win);
        commons.wireFirstRefresh(app, api);
        commons.wireGridAndRefresh(grid, api, win);

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
            list.find('i').attr('class', 'icon-none');
            // check right options
            list.find(
                    '[data-option="' + props.sort + '"], ' +
                    '[data-option="' + props.order + '"], ' +
                    '[data-option="' + (props.done ? 'done' : '~done') + '"]'
                ).find('i').attr('class', 'icon-ok');
            // order
            if (props.order === 'desc') {
                dropdown.find('.icon-arrow-down').css('opacity', 1).end()
                    .find('.icon-arrow-up').css('opacity', 0.4);
            } else {
                dropdown.find('.icon-arrow-up').css('opacity', 1).end()
                    .find('.icon-arrow-down').css('opacity', 0.4);
            }
        }

        grid.on('change:prop', updateGridOptions);
        updateGridOptions();

        commons.addGridToolbarFolder(app, grid);

        // drag & drop
        win.nodes.outer.on('selection:drop', function (e, baton) {
            actions.invoke('io.ox/tasks/actions/move', null, baton);
        });

        //ready for show
        commons.addFolderSupport(app, grid, 'tasks', options.folder)
            .done(commons.showWindow(win, grid));
    });

    //extension points
    ext.point('io.ox/tasks/vgrid/toolbar').extend({
        id: 'dropdown',
        index: 100,
        draw: function () {
            this.prepend(
                $('<div>').addClass('grid-options dropdown').css({ display: 'inline-block', 'float': 'right' })
                .append(
                    $('<a>', { href: '#' })
                    .attr('data-toggle', 'dropdown')
                    .append($('<i class="icon-arrow-down">'), $('<i class="icon-arrow-up">'))
                    .dropdown(),
                    $('<ul>').addClass('dropdown-menu')
                    .append(
                        $('<li>').append($("<a data-option='state'>").text(gt('Status')).prepend($('<i>'))), // state becomes Bundesland :)
                        $('<li>').append($("<a data-option='202'>").text(gt('Due date')).prepend($('<i>'))),
                        $('<li>').append($("<a data-option='200'>").text(gt('Subject')).prepend($('<i>'))),
                        $('<li>').append($("<a data-option='309'>").text(gt('Priority')).prepend($('<i>'))),
                        $('<li class="divider">'),
                        $('<li>').append($("<a data-option='asc'>").text(gt('Ascending')).prepend($('<i>'))),
                        $('<li>').append($("<a data-option='desc'>").text(gt('Descending')).prepend($('<i>'))),
                        $('<li class="divider">'),
                        $('<li>').append($("<a data-option='done'>").text(gt('Show done tasks')).prepend($('<i>')))
                    ).on('click', 'a', { grid: grid }, taskToolbarOptions)
                )
            );
        }
    });

    return {
        getApp: app.getInstance
    };
});
