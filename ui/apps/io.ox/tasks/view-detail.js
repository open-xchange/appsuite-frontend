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
                                   'gettext!io.ox/tasks',
                                   'less!io.ox/tasks/style.css' ], function (util, gt) {
    "use strict";
    
    var taskDetailView = {
        draw: function (data) {
            
            var task = util.interpretTask(data, true);
            var node = $('<div>').addClass("tasks-detailview").prop("data-cid", task.folder_id + "." + task.id);
            
            var infoPanel = $('<div>').addClass('info-panel');
            if (task.start_date) {
                infoPanel.append(
                        $('<div>').text(gt("Start date") + " " + task.start_date).addClass("start-date")
                );
            }
            
            if (task.end_date) {
                infoPanel.append(
                        $('<br>'),
                        $('<div>').text(gt("Due date") + " " + task.end_date).addClass("end-date")
                );
            }
            
            if (task.alarm) {
                infoPanel.append(
                        $('<br>'),
                        $('<div>').text(gt("Remind date") + " " + task.alarm).addClass("alarm-date")
                );
            }
            infoPanel.append(
                $('<br>'),
                $('<div>').text(task.status).addClass("status " +  task.badge)
            );
            
            if (data.priority === 3) {
                $('<br>').appendTo(infoPanel);
                $('<div>').text("\u2605\u2605\u2605").addClass("priority").appendTo(infoPanel);
            }
            
            //check to see if there is a leading <br> and remove it
            var firstBr = infoPanel.find("br:first");
            if (firstBr.is(infoPanel.find("*:first"))) {
                firstBr.remove();
            }
            infoPanel.appendTo(node);
            
            $('<div>').text(task.title).addClass("title clear-title").appendTo(node);
            
            $('<div>').text(task.note).addClass("note").appendTo(node);
            
            return node;
        }
    };
  
    return taskDetailView;
});