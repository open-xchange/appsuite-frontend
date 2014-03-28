/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
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
     'less!io.ox/tasks/style'
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
            baton.interpretedData = task;
            // inline links
            ext.point('io.ox/tasks/detail-inline').invoke('draw', node, baton);
            //content
            ext.point('io.ox/tasks/detail-view').invoke('draw', node, baton);

            return node;
        }
    };

    // detail-view
    ext.point('io.ox/tasks/detail-view').extend({
        index: 100,
        id: 'header',
        draw: function (baton) {
            var infoPanel,
                task = baton.interpretedData;
            this.append(
                $('<header>').append(
                    infoPanel = $('<div>').addClass('info-panel'),
                    $('<h1 class="title clear-title">').append(
                        // lock icon
                        baton.data.private_flag ? $('<i class="fa fa-lock private-flag">') : [],
                        // priority
                        $('<span class="priority">').append(
                            util.getPriority(task)
                        ),
                        // title
                        $.txt(gt.noI18n(task.title))
                    )
                )
            );
            ext.point('io.ox/tasks/detail-view/infopanel').invoke('draw', infoPanel, task);
        }
    });
    
    ext.point('io.ox/tasks/detail-view').extend({
        index: 200,
        id: 'attachments',
        draw: function (baton) {
            var task = baton.interpretedData;
            if (api.uploadInProgress(_.ecid(baton.data))) {
                this.append($('<div>').addClass('attachments-container')
                    .append(
                        $('<span>').text(gt('Attachments') + ' \u00A0\u00A0').addClass('attachments'),
                        $('<div>').css({width: '70px', height: '12px', display: 'inline-block'}).busy()));
            } else if (task.number_of_attachments > 0) {
                ext.point('io.ox/tasks/detail-attach').invoke('draw', this, task);
            }
        }
    });
    ext.point('io.ox/tasks/detail-view').extend({
        index: 300,
        id: 'note',
        draw: function (baton) {
            this.append(
                $('<div class="note">').html(
                    gt.noI18n(_.escape($.trim(baton.interpretedData.note)).replace(/\n/g, '<br>'))
                )
            );
        }
    });
    ext.point('io.ox/tasks/detail-view').extend({
        index: 400,
        id: 'details',
        draw: function (baton) {
            var task = baton.interpretedData,
                fields = {
                    start_date: gt('Start date'),
                    target_duration: gt('Estimated duration in minutes'),
                    actual_duration: gt('Actual duration in minutes'),
                    target_costs: gt('Estimated costs'),
                    actual_costs: gt('Actual costs'),
                    trip_meter: gt('Distance'),
                    billing_information: gt('Billing information'),
                    companies: gt('Companies'),
                    date_completed: gt('Date completed')
                },
                $details = $('<dl class="task-details dl-horizontal">'),
                hasDetails = false;

            if (task.recurrence_type) {
                $details.append(
                    $('<dd class="detail-value">').text(gt('This task recurs')),
                    $('<dd class="detail-value">').text(calendarUtil.getRecurrenceString(baton.data)));
                hasDetails = true;
            }

            _(fields).each(function (label, key) {
                if (task[key] !== undefined && task[key] !== null && task[key] !== '') {//0 is valid
                    $details.append($('<dt class="detail-label">').text(label));
                    if ((key === 'target_costs' || key === 'actual_costs') && task.currency) {
                        $details.append($('<dd class="detail-value">').text(gt.noI18n(task[key]) + ' ' + task.currency));
                    } else {
                        $details.append($('<dd class="detail-value">').text(gt.noI18n(task[key])));
                    }
                    hasDetails = true;
                }
            });

            if (hasDetails) {
                this.append($details);
            }
        }
    });

    ext.point('io.ox/tasks/detail-view').extend({
        index: 500,
        id: 'participants',
        draw: function (baton) {
            var task = baton.interpretedData,
                self = this;
            if (task.participants && task.participants.length > 0) {
                require(['io.ox/core/api/user'], function (userAPI) {
                    var states = [
                            ['unconfirmed', ''],
                            ['accepted', '<i class="fa fa-check">'],
                            ['declined', '<i class="fa fa-times">'],
                            ['tentative', '<i class="fa fa-question-circle">']
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
                            if (userInformation) {
                                table.append($('<li class="halo-link participant">')
                                    .data(_.extend(userInformation, { display_name: name, email1: userInformation.email1 }))
                                    .append(
                                        $('<a href="#">').addClass('person ' + states[participant.confirmation || 0][0]).text(gt.noI18n(name)),
                                        // has confirmation icon?
                                        participant.confirmation !== '' ? $('<span>').addClass('status ' + states[participant.confirmation || 0][0]).append($(states[participant.confirmation || 0][1])) : '',
                                        // has confirmation comment?
                                        participant.confirmmessage !== '' ? $('<div>').addClass('comment').text(gt.noI18n(participant.confirmmessage)) : ''
                                    )
                                );
                            } else {
                                table.append($('<li class="halo-link participant">')
                                        .data(_.extend(participant, { display_name: name, email1: participant.mail }))
                                        .append(
                                            $('<a href="#">').addClass('person ' + states[participant.confirmation || 0][0]).text(gt.noI18n(name)),
                                            // has confirmation icon?
                                            participant.confirmation !== '' ? $('<span>').addClass('status ' + states[participant.confirmation || 0][0]).append($(states[participant.confirmation || 0][1])) : '',
                                            // has confirmation comment?
                                            participant.confirmmessage !== '' ? $('<div>').addClass('comment').text(gt.noI18n(participant.confirmmessage)) : ''
                                        )
                                    );
                            }
                        },
                        failedToLoad = function (node, table, participant) {
                            node.append(
                                $.fail(gt('Could not load all participants for this task.'), function () {
                                    lookupParticipant(node, table, participant);
                                })
                            );
                        },
                        participantsWrapper = $('<div class="participants">'),
                        list,
                        legend,
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
                        //draw markup
                        participantsWrapper.append($('<fieldset>').append(
                            legend = $('<legend class="io-ox-label">').text(gt('Participants')),
                            list = $('<ul class="participant-list list-inline">')
                        ));
                        _(intParticipants).each(function (participant) {
                            lookupParticipant(list, list, participant);
                        });
                    }
                    if (extParticipants.length > 0) {
                        //draw markup
                        participantsWrapper.append($('<fieldset>').append(
                            $('<legend class="io-ox-label">').text(gt('External participants')),
                            list = $('<ul class="participant-list list-inline">')
                        ));
                        _(extParticipants).each(function (participant) {
                            lookupParticipant(list, list, participant);
                        });
                    }
                    //summary
                    var confirmations = calendarUtil.getConfirmations({users: task.users, confirmations: extParticipants}),
                        sumData = calendarUtil.getConfirmationSummary(confirmations);
                    if (sumData.count > 3) {
                        var sum = $('<div>').addClass('summary');
                        _.each(sumData, function (res) {
                            if (res.count > 0) {
                                sum.append(
                                    $('<a>')
                                        .attr({
                                            href: '#',
                                            title: gt(res.css)
                                        })
                                        .addClass('countgroup')
                                        .text(res.count)
                                        .prepend(
                                            $('<span>')
                                                .addClass('status ' + res.css)
                                                .append(res.icon)
                                        )
                                        .on('click', function (e) {
                                            e.preventDefault();
                                            if ($(this).hasClass('badge')) {
                                                $(this).removeClass('badge');
                                                $('.participant', participantsWrapper)
                                                    .show();
                                            } else {
                                                $('.participant', participantsWrapper)
                                                    .show()
                                                    .find('a.person:not(.' + res.css + ')')
                                                    .parent()
                                                    .toggle();
                                                $('.countgroup', participantsWrapper).removeClass('badge');
                                                $(this).addClass('badge');
                                            }
                                        })
                                );
                            }
                        });
                        legend.append(sum);
                    }
                    if (list) {
                        self.append(participantsWrapper);
                    }
                });
            }
        }
    });

    ext.point('io.ox/tasks/detail-view/infopanel').extend({
        index: 100,
        id: 'infopanel',
        draw: function (task) {
            if (task.end_date) {
                this.append(
                        $('<div>').addClass('end-date').text(
                            //#. %1$s due date of a task
                            //#, c-format
                            gt('Due %1$s', _.noI18n(task.end_date))
                        )
                );
            }

            if (task.alarm && !_.device('small')) {//alarm makes no sense if reminders are disabled
                this.append(
                        $('<div>').addClass('alarm-date').text(
                            //#. %1$s reminder date of a task
                            //#, c-format
                            gt('Reminder date %1$s', _.noI18n(task.alarm))
                        )
                );
            }
            if (task.percent_completed && task.percent_completed !== 0) {
                this.append(
                        $('<div>').addClass('task-progress').text(
                            //#. %1$s how much of a task is completed in percent, values from 0-100
                            //#, c-format
                            gt('Progress %1$s %', _.noI18n(task.percent_completed))
                        )
                    );
            }
            this.append(
                // status
                $('<div>').text(task.status).addClass('state ' +  task.badge)
            );
        }
    });

    // inline links
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
            if (this.hasClass('attachments-container')) {//if attachmentrequest fails the container is already there
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
