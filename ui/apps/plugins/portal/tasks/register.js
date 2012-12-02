/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2011
 * Mail: info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define("plugins/portal/tasks/register",
    ['io.ox/core/extensions',
     'io.ox/tasks/api',
     'gettext!plugins/portal',
     'io.ox/core/strings',
     'io.ox/tasks/util',
     'io.ox/tasks/view-grid-template',
     'io.ox/core/tk/dialogs',
     'less!plugins/portal/tasks/style.css'
    ], function (ext, taskApi, gt, strings, util, viewGrid, dialogs) {

    "use strict";

    //var for detailView sidepane.Needs to be closed on DetailView delete action
    var sidepane,
    loadTile = function () {
        var prevDef = new $.Deferred();
        taskApi.getAll({}, false).done(function (taskarray) {
                prevDef.resolve(taskarray);
            });

        return prevDef;
    },

    drawTile = function (taskarray) {

        var content = $('<div class="content">');

        if (taskarray.length === 0) {
            this.append(content.text(gt("You don't have any tasks.")));
            return;
        }

        var tasks = [];
        for (var i = 0; i < taskarray.length; i++) {
            if (taskarray[i].end_date !== null && taskarray[i].status !== 3) {
                tasks.push(taskarray[i]);
            }
        }

        _(tasks).each(function (task) {
            var task = util.interpretTask(task);
            content.append(
                $('<div class="item">').append(
                    $('<span class="bold">').text(gt.noI18n(strings.shorten(task.title, 50))), $.txt(' '),
                    task.end_date === '' ? $() :
                        $('<span class="accent">').text(gt('Due in %1$s', _.noI18n(task.end_date))), $.txt(' '),
                    $('<span class="gray">').text(gt.noI18n(strings.shorten(task.note, 100)))
                )
            );
        });

        this.append(content);
    },

    load = function () {
        var def = new $.Deferred();
        taskApi.getAll({}, false).done(function (taskarray) {
            def.resolve(taskarray);
        });
        return def;
    },

    draw = function (tasks) {

        var node;

        this.append(
            node = $('<div class="content">')
        );

        fillGrid(tasks, node);

        //repaint function called on done and delete events
        var repaint = function (e) {
            var dom = e.data.node,
                draw = e.data.draw;

            load().done(function (inputTasks) {
                if (sidepane && draw === false) {
                    sidepane.close();
                }
                dom.find(".portal-tasks-grid").remove();
                dom.find("div").remove();
                if (inputTasks.length === 0) {
                    $('<div>').text(gt("You don't have any tasks.")).appendTo(dom);
                } else {
                    fillGrid(inputTasks, node);
                }
            });
        };

        taskApi.on("refresh.list", {node: node}, repaint)
               .on("delete", {node: node, draw: false}, repaint);

        node.on("dispose", function () {
            taskApi.off("refresh.list", repaint)
                   .off("delete", repaint);
        });

        if (tasks.length === 0) {
            $('<div>').text(gt("You don't have any tasks.")).appendTo(node);
        }
    },

    //method to fill the grid used for initial drawing and refresh
    fillGrid = function (tasks, node) {

        //interpret values for status etc
        tasks = util.sortTasks(tasks);
        for (var i = 0; i < tasks.length; i++) {
            tasks[i] = util.interpretTask(tasks[i]);
        }
        viewGrid.drawSimpleGrid(tasks).addClass("portal-tasks-grid").appendTo(node);

        //detailView Popup
        if (!sidepane) {
            sidepane = new dialogs.SidePopup({ modal: false });
        }
        sidepane.delegate(node, '.vgrid-cell', function (pane, e, target) {
            var data = target.data('object-data'),
                folder = (data.folder_id || data.folder);
            require(['io.ox/tasks/view-detail'], function (viewDetail) {
                // get task and draw detailview
                taskApi.get({folder: folder,
                             id: data.id}).done(function (taskData) {
                    viewDetail.draw(taskData).appendTo(pane);
                });

            });
        });
    };


    ext.point("io.ox/portal/widget").extend({
        id: 'tasks',
        title: gt('Tasks'),
        load: load,
        draw: draw,
        preview: function () {
            var self = this;
            return loadTile().done(function (data) {
                drawTile.call(self, data);
            });
        }
    });
});
