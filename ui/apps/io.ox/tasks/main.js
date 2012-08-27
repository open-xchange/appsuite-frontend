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
                            'gettext!io.ox/tasks',
                            "io.ox/core/date"], function (api, gt, date) {

    "use strict";

    // application object
    var app = ox.ui.createApp({ name: 'io.ox/tasks', title: 'Tasks' }),
        // app window
        win;
    // launcher
    app.setLauncher(function () {
        // get window
        win = ox.ui.createWindow({
            name: 'io.ox/tasks',
            title: "Tasks",
            toolbar: true,
            search: true
        });
        
        api.getAll().done(function (alltasks)
                {
            fill(alltasks);
        });
        
        var fill = function (tasks)
        {
            
            var content = win.nodes.main;
            content.append("div").text("This is just a placeholder taskapp").addClass("default-content-padding abs scrollable");
            
            var node = $('<div class="io-ox-portal-tasks">').appendTo(content);
            $('<h1 class="clear-title">').text(gt("Your tasks")).appendTo(node);
            
            require(['io.ox/tasks/view-grid-template'], function (viewGrid)
                    {
                    
                    //interpret values for status etc
                    for (var i = 0; i < tasks.length; i++)
                    {
                        tasks[i] = interpretTask(tasks[i]);
                    }
                    
                    viewGrid.drawSimpleGrid(tasks).appendTo(node);
                });
            
            if (tasks.length === 0)
                {
                $('<div>').text(gt("You don't have any tasks.")).appendTo(node);
            }
        };
        
        var interpretTask = function (task)
        {
            
            switch (task.status)
            {
            case 2:
                task.status = gt("In progress");
                break;
            case 3:
                task.status = gt("Done");
                break;
            case 4:
                task.status = gt("Waiting");
                break;
            case 5:
                task.status = gt("Deferred");
                break;
            default:
                task.status = gt("Not started");
                break;
            }
            
            task.end_date = new date.Local(task.end_date).format(date.DATE);
            
            return task;
        };
        
        
        app.setWindow(win);

        // Let's define some event handlers on our window
        win.on("show", function () {
        });
        
        win.on("hide", function () {
            // Gets called whenever the window is hidden
        });
        
        win.show();
    });

    return {
        getApp: app.getInstance
    };
});
