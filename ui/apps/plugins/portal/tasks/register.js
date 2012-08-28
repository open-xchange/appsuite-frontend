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
                                         'io.ox/tasks/util'], function (ext, taskApi, gt, strings, util) {
    "use strict";
    
    var loadTile = function ()
    {
        var prevDef = new $.Deferred();
        taskApi.getAll().done(function (taskarray)
                {
                prevDef.resolve(taskarray);
            });
        
        return prevDef;
    };
    
    var drawTile = function (taskarray, $node)
    {
        if (taskarray.length > 0)
            {
            var task = taskarray[0];
            task = util.interpretTask(task);
        
            $node.append(
                    $('<div class="io-ox-clear io-ox-portal-preview">').append(
                            $("<span>").text(gt("You have ") + taskarray.length + gt(" tasks")),
                            $("<br>"),
                            $("<b>").text(strings.shorten(task.title, 40)),
                            $('<br>'),
                            $('<span>').text(task.end_date),
                            $('<span>').addClass("priority"),
                            $("<br>"),
                            $("<span>").text(strings.shorten(task.note, 100))
                    )
            );
            var prio = $node.find(".priority");
        
            if (task.priority === 3)
            {
                prio.text("\u2605\u2605\u2605");
            }
        } else
            {
            $node.append($('<div class="io-ox-clear io-ox-portal-preview">').text(gt("You don't have any tasks.")));
        }
        
    };
    
    var load = function () {
        var def = new $.Deferred();
        taskApi.getAll().done(function (taskarray)
                {
            def.resolve(taskarray);
        });
        return def;
    };
    
    var draw = function (tasks) {
        
        var node = $('<div class="io-ox-portal-tasks">').appendTo(this);
        $('<h1 class="clear-title">').text(gt("Your tasks")).appendTo(node);
        
        require(['io.ox/tasks/view-grid-template'], function (viewGrid)
                {
                
                //interpret values for status etc
                for (var i = 0; i < tasks.length; i++)
                {
                    tasks[i] = util.interpretTask(tasks[i]);
                }
                
                viewGrid.drawSimpleGrid(tasks).appendTo(node);
            });
        
        if (tasks.length === 0)
            {
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
            loadTile().done(function (appointments) {
                var $node = $('<div>');
                drawTile(appointments, $node);
                deferred.resolve($node);
            });
            return deferred;
        }
    });
});