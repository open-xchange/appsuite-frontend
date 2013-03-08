/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2012
 * Mail: info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/tasks/view-detail', ['io.ox/tasks/util',
                                   'gettext!io.ox/tasks',
                                   'io.ox/core/extensions',
                                   'io.ox/core/extPatterns/links',
                                   'io.ox/tasks/api',
                                   'io.ox/tasks/actions',
                                   'less!io.ox/tasks/style.css' ], function (util, gt, ext, links, api) {
    'use strict';
    
    var attachmentsBusy = false; //check if attachments are uploding atm
    var taskDetailView = {

        draw: function (data) {
            if (!data) {
                return $('<div>');
            }
            
            api.off('AttachmentHandlingInProgress:' + encodeURIComponent(_.cid(data)), setAttachmentsbusy);
            api.on('AttachmentHandlingInProgress:' + encodeURIComponent(_.cid(data)), setAttachmentsbusy);
            
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
                        $('<div>').addClass('end-date').text(
                            //#. %1$s due date of a task
                            //#, c-format
                            gt('Due %1$s', _.noI18n(task.end_date))
                        )
                );
            }

            if (task.alarm) {
                infoPanel.append(
                        $('<br>'),
                        $('<div>').addClass('alarm-date').text(
                            //#. %1$s reminder date of a task
                            //#, c-format
                            gt('Remind date %1$s', _.noI18n(task.alarm))
                        )
                );
            }
            if (task.percent_completed && task.percent_completed !== 0) {
                infoPanel.append(
                        $('<br>'),
                        $('<div>').addClass('task-progress').text(
                            //#. %1$s how much of a task is completed in percent, values from 0-100
                            //#, c-format
                            gt('Progress %1$s %', _.noI18n(task.percent_completed))
                        )
                    );
            }
            infoPanel.append(
                $('<br>'),
                $('<div>').text(task.status).addClass('status ' +  task.badge)
            );

            var blackStars,
                greyStars;

            switch (data.priority) {
            case 1:
                blackStars = '\u2605';
                greyStars = '\u2605\u2605';
                break;
            case 2:
                blackStars = '\u2605\u2605';
                greyStars = '\u2605';
                break;
            case 3:
                blackStars = '\u2605\u2605\u2605';
                greyStars = '';
                break;
            }
            $('<br>').appendTo(infoPanel);
            $('<div>').append($('<span>').text(gt.noI18n(greyStars)).css('color', '#aaa'),
                              $('<span>').text(gt.noI18n(blackStars))).addClass('priority').appendTo(infoPanel);
            blackStars = greyStars = null;

            //check to see if there is a leading <br> and remove it
            var firstBr = infoPanel.find('br:first');
            if (firstBr.is(infoPanel.find('*:first'))) {
                firstBr.remove();
            }
            infoPanel.appendTo(node);

            if (data.private_flag) {
                $('<i>').addClass('icon-lock private-flag').appendTo(node);
            }

            $('<div>').text(gt.noI18n(task.title)).addClass('title clear-title').appendTo(node);

            if (attachmentsBusy) {
                $('<div>').addClass('attachments-container')
                    .append(
                        $('<span>').text(gt('Attachments \u00A0\u00A0')).addClass('attachments'),
                        $('<div>').css({width: '70px', height: '12px', display: 'inline-block'}).busy())
                    .appendTo(node);
            } else if (task.number_of_attachments > 0) {
                ext.point('io.ox/tasks/detail-attach').invoke('draw', node, task);
            }

            var inlineLinks = $('<div>').addClass('tasks-inline-links').appendTo(node);
            ext.point('io.ox/tasks/detail-inline').invoke('draw', inlineLinks, data);
            node.append(
                $('<div class="note">').html(
                    gt.noI18n(_.escape($.trim(task.note)).replace(/\n/g, '<br>'))
                )
            );

            var fields = {
                start_date: gt('Start date'),
                target_duration: gt('Estimated duration in minutes'),
                actual_duration: gt('Actual duration in minutes'),
                target_costs: gt('Estimated costs'),
                actual_costs: gt('Actual costs'),
                currency: gt('Currency'),
                trip_meter: gt('Distance'),
                billing_information: gt('Billing information'),
                company: gt('Company')
            };

            var $details = $('<div class="task-details">'), hasDetails = false;

            _(fields).each(function (label, key) {
                if (task[key]) {
                    $details.append(
                        $('<label class="detail-label">').text(label),
                        $('<div class="detail-value">').text(gt.noI18n(task[key]))
                    );
                    hasDetails = true;
                }
            });

            if (hasDetails) {
                node.append($details);
            }

            if (task.participants.length > 0) {
                require(['io.ox/core/api/user'], function (userApi) {
                    var table,
                        states = [
                            [gt('Not yet confirmed'), 'grey'],
                            [gt('Confirmed'), 'green'],
                            [gt('Declined'), 'red'],
                            [gt('Tentative'), 'yellow']
                        ],
                        lookupParticipant = function (node, table, participant) {
                            if (participant.id) {//external participants dont have an id but the display name is already given
                                userApi.getName(participant.id).done(function (name) {
                                        drawParticipant(table, participant, name);
                                    }).fail(function () {
                                        failedToLoad(node, table, participant);
                                    });
                            } else {
                                drawParticipant(table, participant, participant.display_name + ' <' + participant.mail + '>');
                            }
                        },
                        drawParticipant = function (table, participant, name) {
                            var row;
                            table.append(row = $('<tr>').append(
                                $('<td class="participants-table-name">').text(name))
                            );
                            row.append(
                                $('<td>').text(states[participant.confirmation || 0][0]),
                                $('<td>').append($('<div>').addClass('participants-table-colorsquare').css('background-color', states[participant.confirmation || 0][1]))
                                );
                            if (participant.confirmmessage) {
                                row.append($('<td>').text(_.noI18n(participant.confirmmessage)));
                            }
                            if (participant.type === 5) { //external participant
                                row.append(
                                        $('<td>').append($('<div>').addClass('badge participants-external').text(gt('External')))
                                        );
                            }
                        },
                        failedToLoad = function (node, table, participant) {
                            node.append(
                                $.fail(gt('Could not load all participants for this task.'), function () {
                                    lookupParticipant(node, table, participant);
                                })
                            );
                        };
                    node.append($('<label class="detail-label">').text(gt('Participants')),
                                table = $("<table class='task-participants-table'>"));

                    _(task.participants).each(function (participant) {
                        lookupParticipant(node, table, participant);
                    });
                });
            }

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
            var attachmentNode;
            if (this.hasClass('attachments-container')) {//if attachmentrequest fails the container is allready there
                attachmentNode = this;
            } else {
                attachmentNode = $('<div>').addClass('attachments-container').appendTo(this);//else build new
            }
            $('<span>').text(gt('Attachments \u00A0\u00A0')).addClass('attachments').appendTo(attachmentNode);
            require(['io.ox/core/api/attachment'], function (api) {
                api.getAll({folder_id: task.folder_id, id: task.id, module: 4}).done(function (data) {
                    _(data).each(function (a, index) {
                        // draw
                        buildDropdown(attachmentNode, _.noI18n(a.filename), a);
                    });
                    if (data.length > 1) {
                        buildDropdown(attachmentNode, gt('all'), data);
                    }
                    attachmentNode.delegate('a', 'click', function (e) {e.preventDefault(); });
                }).fail(function () {
                    attachmentFail(attachmentNode, task);
                });
            });
        }
    });
    
    function setAttachmentsbusy(e, state) {
        attachmentsBusy = state;
    }

    var attachmentFail = function (container, task) {
        container.empty().append(
                $.fail(gt('Could not load attachments for this task.'), function () {
                    ext.point('io.ox/tasks/detail-attach').invoke('draw', container, task);
                })
            );
    };

    var buildDropdown = function (container, label, data) {
        new links.DropdownLinks({
                label: label,
                classes: 'attachment-item',
                ref: 'io.ox/tasks/attachment/links'
            }).draw.call(container, data);
    };

    return taskDetailView;
});
