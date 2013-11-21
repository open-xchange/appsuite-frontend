/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2012
 * Mail: info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/tasks/view-detail',
    ['io.ox/tasks/util',
     'io.ox/calendar/util',
     'gettext!io.ox/tasks',
     'io.ox/core/extensions',
     'io.ox/core/extPatterns/links',
     'io.ox/tasks/api',
     'io.ox/tasks/actions',
     'less!io.ox/tasks/style.less'
    ], function (util, calendarUtil, gt, ext, links, api) {

    'use strict';

    var taskDetailView = {

        draw: function (baton) {

            // make sure we have a baton
            var baton = ext.Baton.ensure(baton),
                data = baton.data;

            if (!data) return $('<div>');

            var task = util.interpretTask(data, true), self = this;

            var node = $.createViewContainer(data, api)
                .on('redraw', function (e, tmp) {
                    node.replaceWith(self.draw(tmp));
                })
                .addClass('tasks-detailview');

            // inline links
            ext.point('io.ox/tasks/detail-inline').invoke('draw', node, baton);

            var header = $('<header>');

            var infoPanel = $('<div>').addClass('info-panel');

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

            if (task.alarm && !_.device('small')) {//alarm makes no sense if reminders are disabled
                infoPanel.append(
                        $('<br>'),
                        $('<div>').addClass('alarm-date').text(
                            //#. %1$s reminder date of a task
                            //#, c-format
                            gt('Reminder date %1$s', _.noI18n(task.alarm))
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
                // status
                $('<div>').text(task.status).addClass('status ' +  task.badge)
            );

            //check to see if there is a leading <br> and remove it
            var firstBr = infoPanel.find('br:first');
            if (firstBr.is(infoPanel.find('*:first'))) {
                firstBr.remove();
            }

            node.append(
                header.append(
                    infoPanel,
                    $('<div class="title clear-title">').append(
                        // lock icon
                        data.private_flag ? $('<i class="icon-lock private-flag">') : [],
                        // title
                        $.txt(gt.noI18n(task.title)),
                        // priority
                        $('<span class="priority">').append(
                            util.getPriority(task)
                        )
                    )
                )
            );

            if (api.uploadInProgress(_.ecid(data))) {
                $('<div>').addClass('attachments-container')
                    .append(
                        $('<span>').text(gt('Attachments') + ' \u00A0\u00A0').addClass('attachments'),
                        $('<div>').css({width: '70px', height: '12px', display: 'inline-block'}).busy())
                    .appendTo(node);
            } else if (task.number_of_attachments > 0) {
                ext.point('io.ox/tasks/detail-attach').invoke('draw', node, task);
            }

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
                trip_meter: gt('Distance'),
                billing_information: gt('Billing information'),
                companies: gt('Companies'),
                date_completed: gt('Date completed')
            };

            var $details = $('<div class="task-details">'), hasDetails = false;

            //add recurrence sentence, use calendarfunction to avoid code duplicates
            if (task.recurrence_type) {
                $details.append($('<div class="detail-item">').append($('<label class="detail-label">').text(gt('This task recurs')),
                                $('<div class="detail-value">').text(calendarUtil.getRecurrenceString(data))));
            }
            var temp;
            _(fields).each(function (label, key) {
                if (task[key] !== undefined && task[key] !== null) {//0 is valid
                    $details.append(temp = $('<div class="detail-item">').append($('<label class="detail-label">').text(label)));
                    if ((key === 'target_costs' || key === 'actual_costs') && task.currency) {
                        temp.append($('<div class="detail-value">').text(gt.noI18n(task[key]) + ' ' + task.currency));
                    } else {
                        temp.append($('<div class="detail-value">').text(gt.noI18n(task[key])));
                    }
                    hasDetails = true;
                }
            });

            if (hasDetails) {
                node.append($details);
            }

            if (task.participants && task.participants.length > 0) {
                require(['io.ox/core/api/user'], function (userAPI) {
                    var table,
                        states = [
                            [gt('Not yet confirmed'), 'gray'],
                            [gt('Confirmed'), 'green'],
                            [gt('Declined'), 'red'],
                            [gt('Tentative'), 'yellow']
                        ],
                        lookupParticipant = function (node, table, participant) {
                            if (participant.id) {//external participants don't have an id but the display name is already given
                                userAPI.get({id: participant.id}).done(function (userInformation) {
                                        drawParticipant(table, participant, userInformation.display_name, userInformation);
                                    }).fail(function () {
                                        failedToLoad(node, table, participant);
                                    });
                            } else {
                                participant.display_name = participant.display_name || participant.mail.split('@')[0] || '';
                                drawParticipant(table, participant, $.trim(participant.display_name + ' <' + participant.mail + '>'));
                            }
                        },
                        drawParticipant = function (table, participant, name, userInformation) {
                            var row;
                            if (userInformation) {
                                table.append(row = $('<div class="task-participant">').append(
                                    $('<span class="halo-link participants-table-name">').data(_.extend(userInformation, { display_name: name, email1: userInformation.email1 })).append($('<a href="#">').text(name)))
                                );
                            } else {
                                table.append(row = $('<div class="task-participant">').append(
                                    $('<span class="halo-link participants-table-name">').data(_.extend(participant, { display_name: name, email1: participant.mail })).append($('<a href="#">').text(name)))
                                );
                            }
                            row.append(
                                $('<span>').addClass('participants-table-colorsquare').css('background-color', states[participant.confirmation || 0][1]),
                                $('<span>').text(states[participant.confirmation || 0][0])
                                );
                            if (participant.confirmmessage) {
                                row.append($('<span>').addClass('participants-table-confirmmessage').text(_.noI18n(participant.confirmmessage)));
                            }
                        },
                        failedToLoad = function (node, table, participant) {
                            node.append(
                                $.fail(gt('Could not load all participants for this task.'), function () {
                                    lookupParticipant(node, table, participant);
                                })
                            );
                        },
                        intParticipants = [],
                        extParticipants = [];


                    //divide participants into internal and external users

                    _(task.participants).each(function (participant) {
                        if (participant.type === 5) {
                            extParticipants.push(participant);
                        } else {
                            intParticipants.push(participant);
                        }
                    });
                    if (intParticipants.length > 0) {
                        node.append($('<label class="detail-label">').text(gt('Participants')),
                                table = $('<div class="task-participants-table">'));
                        _(intParticipants).each(function (participant) {
                            lookupParticipant(node, table, participant);
                        });
                    }
                    if (extParticipants.length > 0) {
                        node.append($('<label class="detail-label">').text(gt('External participants')),
                                table = $('<div class="task-participants-table">'));
                        _(extParticipants).each(function (participant) {
                            lookupParticipant(node, table, participant);
                        });
                    }
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
            $('<span>').text(gt('Attachments') + ' \u00A0\u00A0').addClass('attachments').appendTo(attachmentNode);
            require(['io.ox/core/api/attachment'], function (api) {
                api.getAll({folder_id: task.folder_id, id: task.id, module: 4}).done(function (data) {
                    _(data).each(function (a) {
                        // draw
                        buildDropdown(attachmentNode, _.noI18n(a.filename), a);
                    });
                    if (data.length > 1) {
                        buildDropdown(attachmentNode, gt('All attachments'), data).find('a').removeClass('attachment-item');
                    }
                    attachmentNode.delegate('a', 'click', function (e) {e.preventDefault(); });
                }).fail(function () {
                    attachmentFail(attachmentNode, task);
                });
            });
        }
    });

    var attachmentFail = function (container, task) {
        container.empty().append(
                $.fail(gt('Could not load attachments for this task.'), function () {
                    ext.point('io.ox/tasks/detail-attach').invoke('draw', container, task);
                })
            );
    };

    var buildDropdown = function (container, label, data) {
        var bla = new links.DropdownLinks({
                label: label,
                classes: 'attachment-item',
                ref: 'io.ox/tasks/attachment/links'
            }).draw.call(container, data);

        if (_.device('small')) {//no inline style for mobile
            $(bla).css('display', 'block');
        }
        return bla;
    };

    return taskDetailView;
});
