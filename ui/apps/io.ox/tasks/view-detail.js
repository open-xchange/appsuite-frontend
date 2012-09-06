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

define("io.ox/tasks/view-detail", ['io.ox/tasks/util',
                                   'less!io.ox/tasks/style.css'], function (util) {
    "use strict";
    
    var taskDetailView = {
        draw: function (data) {
            var task = util.interpretTask(data);
            console.log("Die Lottozahlen fuer heute sind: ");
            console.log(data);
            
            var node = $('<div>').addClass("tasks-detailview");
            
            
            
            var infoPanel = $('<div>').addClass('info-panel').append(
                $('<div>').text(task.end_date).addClass("end-date"),
                $('<br>'),
                $('<div>').text(task.status).addClass("status " +  task.badge)
            );
            if (data.priority === 3) {
                $('<br>').appendTo(infoPanel);
                $('<div>').text("\u2605\u2605\u2605").addClass("priority").appendTo(infoPanel);
            }
            infoPanel.appendTo(node);
            
            $('<div>').text(task.title).addClass("title clear-title").appendTo(node);
            
            $('<div>').text(task.note).addClass("note").appendTo(node);
            
            return node;
        }
    };
  
    return taskDetailView;
});