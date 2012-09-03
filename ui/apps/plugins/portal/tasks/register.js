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

define("plugins/portal/tasks/register", ["io.ox/core/extensions",
                                         "io.ox/tasks/api",
                                         'gettext!plugins/portal/tasks',
                                         'io.ox/core/strings',
                                         'io.ox/tasks/util',
                                         'less!plugins/portal/tasks/style.css'], function (ext, taskApi, gt, strings, util) {
    "use strict";
    
    var loadTile = function () {
        var prevDef = new $.Deferred();
        taskApi.getAll().done(function (taskarray) {
                prevDef.resolve(taskarray);
            });
        
        return prevDef;
    },
    
    drawTile = function (taskarray, $node) {
        if (taskarray.length > 0)
            {
            var task = taskarray[0];
            
            for (var i = 0; i < taskarray.length; i++) {
                if (taskarray[i].end_date !== null && taskarray[i].status !== 3) {
                    task = taskarray[i];
                    i = taskarray.length;
                }
            }
            
            task = util.interpretTask(task);
        
            $node.append(
                    $('<div class="io-ox-clear io-ox-portal-preview">').append(
                            $("<span>").text(gt("Next due task") + ': '),
                            $("<span>").text(strings.shorten(task.title, 50) + ' ').addClass("io-ox-portal-tasks-preview-title"),
                            $('<span>').text(gt("Due in") + " " + task.end_date + ' ').addClass("io-ox-portal-tasks-preview-date"),
                            $("<span>").text(strings.shorten(task.note, 100)).addClass("io-ox-portal-tasks-preview-note")
                    )
            );
            
            if (task.end_date === "") {
                $node.find(".io-ox-portal-tasks-preview-date").remove();
            }
        } else {
            $node.append($('<div class="io-ox-clear io-ox-portal-preview">').text(gt("You don't have any tasks.")));
        }
        
    },
    
    load = function () {
        var def = new $.Deferred();
        taskApi.getAll().done(function (taskarray) {
            def.resolve(taskarray);
        });
        return def;
    },
    
    draw = function (tasks) {
        
        var node = $('<div class="io-ox-portal-tasks">').appendTo(this);
        $('<h1>').addClass('clear-title').text(gt("Your tasks")).appendTo(node);
        tasks = util.sortTasks(tasks);
        
        require(['io.ox/tasks/view-grid-template'], function (viewGrid) {
                
                //interpret values for status etc
                for (var i = 0; i < tasks.length; i++) {
                    tasks[i] = util.interpretTask(tasks[i]);
                }
                
                viewGrid.drawSimpleGrid(tasks).appendTo(node);
            });
        
        if (tasks.length === 0) {
            $('<div>').text(gt("You don't have any tasks.")).appendTo(node);
        }
        
        return $.Deferred().resolve();
    };

    ext.point("io.ox/portal/widget").extend({
        id: 'tasks',
        index: 300,
        title: gt('Tasks'),
        load: load,
        draw: draw,
        preview: function () {
            var deferred = $.Deferred();
            loadTile().done(function (getTasks) {
                var $node = $('<div>');
                drawTile(getTasks, $node);
                deferred.resolve($node);
            });
            return deferred;
        }
    });
});