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

define("io.ox/tasks/main", ["io.ox/tasks/api",
                            'io.ox/core/extensions',
                            'gettext!io.ox/tasks',
                            'io.ox/core/tk/vgrid',
                            'io.ox/tasks/view-grid-template',
                            "io.ox/core/commons",
                            'io.ox/tasks/util',
                            'io.ox/tasks/view-detail'], function (api, ext, gt, VGrid, template, commons, util, viewDetail) {

    "use strict";

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
    app.setLauncher(function () {
        // get window
        win = ox.ui.createWindow({
            name: 'io.ox/tasks',
            title: "Tasks",
            toolbar: true,
            search: true
        });

        win.addClass('io-ox-tasks-main');
        app.setWindow(win);

        // folder tree
        commons.addFolderView(app, { type: 'tasks', view: 'FolderList' });

        var vsplit = commons.vsplit(win.nodes.main);
        left = vsplit.left.addClass('border-right');
        right = vsplit.right.addClass('default-content-padding').scrollable();

        // grid
        grid = new VGrid(left);

        grid.addTemplate(template.main);

        commons.wireGridAndAPI(grid, api);

        grid.setAllRequest(function () {
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
        });

        grid.setListRequest(function (ids) {
            return api.getList(ids, false).pipe(function (list) {
                var listcopy = _.copy(list, true),
                    i = 0;
                for (; i < listcopy.length; i++) {
                    listcopy[i] = util.interpretTask(listcopy[i]);
                }

                return listcopy;
            });
        });

        var showTask, drawTask, drawFail;

        //detailview lfo callbacks
        showTask = function (obj) {
            // be busy
            right.busy(true);
            api.get(obj)
                .done(_.lfo(drawTask))
                .fail(_.lfo(drawFail, obj));
        };

        drawTask = function (data) {
            right.idle().empty().append(viewDetail.draw(data));
        };

        drawFail = function (obj) {
            right.idle().empty().append(
                $.fail(gt("Oops, couldn't load that task."), function () {
                    showTask(obj);
                })
            );
        };

        commons.wireGridAndSelectionChange(grid, 'io.ox/task', showTask, right);
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

        ext.point('io.ox/tasks/vgrid/toolbar').invoke('draw', grid.getToolbar());

        //ready for show
        commons.addFolderSupport(app, grid, 'tasks')
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
                    $('<ul>').addClass("dropdown-menu")
                    .append(
                        $('<li>').append("<a data-option='state'><i/> " + gt('Status') + "</a>"), // state becomes Bundesland :)
                        $('<li>').append("<a data-option='202'><i/> " + gt('Due date') + "</a>"),
                        $('<li>').append("<a data-option='200'><i/> " + gt('Subject') + "</a>"),
                        $('<li>').append("<a data-option='309'><i/> " + gt('Priority') + "</a>"),
                        $('<li class="divider">'),
                        $('<li>').append("<a data-option='asc'><i/> " + gt('Ascending') + "</a>"),
                        $('<li>').append("<a data-option='desc'><i/> " + gt('Descending') + "</a>"),
                        $('<li class="divider">'),
                        $('<li>').append("<a data-option='done'><i/> " + gt('Show done tasks') + "</a>")
                    ).on('click', 'a', { grid: grid }, taskToolbarOptions)
                )
            );
        }
    });

    return {
        getApp: app.getInstance
    };
});
