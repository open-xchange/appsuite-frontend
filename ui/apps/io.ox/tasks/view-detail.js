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
                                   'io.ox/core/extensions',
                                   'io.ox/core/extPatterns/links',
                                   'io.ox/tasks/api',
                                   'io.ox/tasks/actions',
                                   'less!io.ox/tasks/style.css' ], function (util, gt, ext, links, api) {
    "use strict";

    var taskDetailView = {
        draw: function (data) {
            if (!data) {
                return $('<div>');
            }

            var task = util.interpretTask(data, true),
                // outer node
                self = this;
            var node = $.createViewContainer(data, api)
                    .on('redraw', function (e, tmp) {
                        node.replaceWith(self.draw(tmp));
                    })
                    .addClass('tasks-detailview'),


                infoPanel = $('<div>').addClass('info-panel');

            if (task.end_date) {
                infoPanel.append(
                        $('<br>'),

                        $('<div>').text(//#. %1$s due date of a task
                                        //#, c-format
                                        gt("Due %1$s", _.noI18n(task.end_date))).addClass("end-date")
                );
            }

            if (task.alarm) {
                infoPanel.append(
                        $('<br>'),

                        $('<div>').text(//#. %1$s reminder date of a task
                                        //#, c-format
                                        gt("Remind date %1$s", _.noI18n(task.alarm))).addClass("alarm-date")
                );
            }
            if (task.percent_completed && task.percent_completed !== 0) {
                infoPanel.append(
                        $('<br>'),

                        $('<div>').text(//#. %1$s how much of a task is completed in percent, values from 0-100
                                        //#, c-format
                                        gt("Progress %1$s %", _.noI18n(task.percent_completed))).addClass("task-progress")
                    );
            }
            infoPanel.append(
                $('<br>'),
                $('<div>').text(task.status).addClass("status " +  task.badge)
            );

            if (data.priority === 3) {
                $('<br>').appendTo(infoPanel);
                $('<div>').text(gt.noI18n("\u2605\u2605\u2605")).addClass("priority").appendTo(infoPanel);
            } else if (data.priority === 1) {
                $('<br>').appendTo(infoPanel);
                $('<div>').append($('<span>').text(gt.noI18n("\u2605\u2605")).css('color', '#aaa'),
                                  $('<span>').text(gt.noI18n("\u2605"))).addClass("priority").appendTo(infoPanel);
            }

            //check to see if there is a leading <br> and remove it
            var firstBr = infoPanel.find("br:first");
            if (firstBr.is(infoPanel.find("*:first"))) {
                firstBr.remove();
            }
            infoPanel.appendTo(node);

            $('<div>').text(gt.noI18n(task.title)).addClass("title clear-title").appendTo(node);
            if (task.number_of_attachments > 0) {
                ext.point("io.ox/tasks/detail-attach").invoke("draw", node, task);
            }

            var inlineLinks = $('<div>').addClass("tasks-inline-links").appendTo(node);
            ext.point("io.ox/tasks/detail-inline").invoke("draw", inlineLinks, data);
            node.append(
                $('<div class="note">').html(
                    gt.noI18n(_.escape($.trim(task.note)).replace(/\n/g, '<br>'))
                )
            );

            return node;
        }
    };

    // inline links for each task
    ext.point('io.ox/tasks/detail-inline').extend(new links.InlineLinks({
        index: 100,
        id: 'inline-links',
        ref: 'io.ox/tasks/links/inline'
    }));

    //attachments
    ext.point('io.ox/tasks/detail-attach').extend({
        index: 100,
        id: 'attachments',
        draw: function (task) {
            var attachmentNode = $('<div>').addClass("attachments-container").appendTo(this);
            $('<span>').text(gt("Attachments \u00A0\u00A0")).addClass("attachments").appendTo(attachmentNode);
            require(['io.ox/core/api/attachment'], function (api) {
                api.getAll({folder_id: task.folder_id, id: task.id, module: 4}).done(function (data) {
                    _(data).each(function (a, index) {
                        // draw
                        buildDropdown(attachmentNode, _.noI18n(a.filename), a);
                    });
                    if (data.length > 1) {
                        buildDropdown(attachmentNode, gt("all"), data);
                    }
                    attachmentNode.delegate("a", "click", function (e) {e.preventDefault(); });
                });
            });
        }
    });

    var buildDropdown = function (container, label, data) {
        new links.DropdownLinks({
                label: label,
                classes: 'attachment-item',
                ref: 'io.ox/tasks/attachment/links'
            }).draw.call(container, data);
    };

    return taskDetailView;
});
