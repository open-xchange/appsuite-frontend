/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/tasks/view-detail', [
    'io.ox/tasks/util',
    'io.ox/calendar/util',
    'gettext!io.ox/tasks',
    'io.ox/core/extensions',
    'io.ox/tasks/api',
    'io.ox/participants/detail',
    'io.ox/core/tk/attachments',
    'io.ox/backbone/views/toolbar',
    'io.ox/backbone/views/action-dropdown',
    'io.ox/core/locale',
    'io.ox/tasks/actions',
    'less!io.ox/tasks/style'
], function (util, calendarUtil, gt, ext, api, ParticipantsView, attachments, ToolbarView, ActionDropdownView, locale) {

    'use strict';

    var taskDetailView = {

        draw: function (baton) {

            // make sure we have a baton
            baton = ext.Baton.ensure(baton);
            var data = baton.data;
            if (!data) return $('<div>');

            var task = util.interpretTask(data),
                self = this,
                node = $.createViewContainer(data, api)
                    .on('redraw', function (e, tmp) {
                        baton.data = tmp;
                        node.replaceWith(self.draw(baton));
                    })
                    .addClass('tasks-detailview');

            baton.interpretedData = task;
            ext.point('io.ox/tasks/detail-inline').invoke('draw', node, baton);
            ext.point('io.ox/tasks/detail-view').invoke('draw', node, baton);
            return node;
        }
    };

    // inline links
    ext.point('io.ox/tasks/detail-inline').extend({
        index: 10,
        id: 'inline-links',
        draw: function (baton) {
            new ToolbarView({ el: this, point: 'io.ox/tasks/links/inline', inline: true })
                .setSelection(baton.array(), { data: baton.array() });
        }
    });

    // detail-view
    ext.point('io.ox/tasks/detail-view').extend({
        index: 100,
        id: 'header',
        draw: function (baton) {
            var infoPanel = $('<div class="info-panel">'),
                task = baton.interpretedData,
                title = $('<h1 class="title clear-title">').append(
                    // lock icon
                    // TODO - A11y: Clean this up
                    baton.data.private_flag ? $('<i class="fa fa-lock private-flag" aria-hidden="true">').attr({
                        title: gt('Private'),
                        'data-placement': 'bottom',
                        'data-animation': 'false'
                    }).tooltip() : [],
                    // priority
                    $('<span class="priority">').append(
                        util.getPriority(task)
                    ),
                    // title
                    $.txt(task.title)
                );
            this.append(
                $('<div class="task-header">').append(
                    _.device('smartphone') ? [title, infoPanel] : [infoPanel, title]
                )
            );
            ext.point('io.ox/tasks/detail-view/infopanel').invoke('draw', infoPanel, task);
        }
    });

    ext.point('io.ox/tasks/detail-view').extend({
        index: 200,
        id: 'details',
        draw: function (baton) {
            var task = baton.interpretedData,
                fields = {
                    status: gt('Status'),
                    percent_completed: gt('Progress'),
                    end_time: gt('Due'),
                    start_time: gt('Start date'),
                    note: gt('Description'),
                    target_duration: gt('Estimated duration in minutes'),
                    actual_duration: gt('Actual duration in minutes'),
                    target_costs: gt('Estimated costs'),
                    actual_costs: gt('Actual costs'),
                    trip_meter: gt('Distance'),
                    billing_information: gt('Billing information'),
                    companies: gt('Companies'),
                    date_completed: gt('Date completed')
                },
                $details = $('<dl class="task-details dl-horizontal">');

            if (task.recurrence_type) {
                $details.append(
                    $('<dt class="detail-label">').text(gt('This task recurs')),
                    $('<dd class="detail-value">').text(calendarUtil.getRecurrenceString(baton.data))
                );
            }

            _(fields).each(function (label, key) {
                // 0 is valid; skip undefined, null, and ''
                var value = task[key];
                if (!value && value !== 0) return;
                var $dt = $('<dt class="detail-label">').text(label);
                var $dd = $('<dd class="detail-value">');
                switch (key) {
                    case 'status':
                        $dd.append(
                            $('<div>').text(task.status).addClass('state ' + task.badge)
                        );
                        break;
                    case 'end_time':
                    case 'start_time':
                        var diff = task[key + '_diff'] ? ' (' + task[key + '_diff'] + ')' : '';
                        $dd.text(value + diff);
                        break;
                    case 'percent_completed':
                        $dd.append(
                            //#. %1$s how much of a task is completed in percent, values from 0-100
                            //#, c-format
                            $('<div>').text(gt('%1$s %', task.percent_completed)),
                            $('<div class="progress" aria-hidden="true">').append(
                                $('<div class="progress-bar">').width(task.percent_completed + '%')
                            )
                        );
                        break;
                    case 'target_costs':
                    case 'actual_costs':
                        value = task.currency ? locale.currency(value, task.currency) : locale.number(value, 2);
                        $dd.text(value);
                        break;
                    case 'note':
                        var note = calendarUtil.getNote(task, 'note');
                        note = util.checkMailLinks(note);
                        if (note) $dd.html(note);
                        break;
                    default:
                        $dd.text(value);
                        break;
                }
                $details.append($dt, $dd);
            });

            if ($details.children().length) {
                this.append(
                    $('<fieldset class="details">').append($details)
                );
            }
        }
    });

    ext.point('io.ox/tasks/detail-view').extend({
        index: 300,
        id: 'attachments',
        draw: function (baton) {
            var task = baton.interpretedData;
            if (api.uploadInProgress(_.ecid(baton.data))) {
                var progressview = new attachments.progressView({ cid: _.ecid(task) });
                this.append(
                    $('<div class="attachments-container">').append(
                        progressview.render().$el
                    )
                );
            } else if (task.number_of_attachments > 0) {
                ext.point('io.ox/tasks/detail-attach').invoke('draw', this, task);
            }
        }
    });

    ext.point('io.ox/tasks/detail-view').extend({
        index: 500,
        id: 'participants',
        draw: function (baton) {
            if (2 > 1) return;
            var pView = new ParticipantsView(baton);
            this.append(pView.draw());
        }
    });

    ext.point('io.ox/tasks/detail-view/infopanel').extend({
        index: 100,
        id: 'infopanel',
        draw: function (task) {
            // if (task.end_time) {
            //     this.append(
            //         $('<div>').addClass('end-date').text(
            //             //#. %1$s due date of a task
            //             //#, c-format
            //             gt('Due %1$s', task.end_time)
            //         )
            //     );
            // }
            //alarm makes no sense if reminders are disabled
            if (task.alarm) {
                this.append(
                    $('<div>').addClass('alarm-date').text(
                        //#. %1$s reminder date of a task
                        //#, c-format
                        gt('Reminder date %1$s', task.alarm)
                    )
                );
            }
            // if (task.percent_completed && task.percent_completed !== 0) {
            //     this.append(
            //         $('<div>').addClass('task-progress').text(
            //             //#. %1$s how much of a task is completed in percent, values from 0-100
            //             //#, c-format
            //             gt('Progress %1$s %', task.percent_completed)
            //         )
            //     );
            // }
            // this.append(
            //     // status
            //     $('<div>').text(task.status).addClass('state ' + task.badge)
            // );
        }
    });

    //attachments
    ext.point('io.ox/tasks/detail-attach').extend({
        index: 100,
        id: 'attachments',
        draw: function (task) {
            var attachmentNode;
            // if attachmentrequest fails the container is already there
            if (this.hasClass('attachments-container')) {
                attachmentNode = this;
            } else {
                attachmentNode = $('<div class="attachments-container">').appendTo(this);
            }
            // TODO: Use io.ox/core/tk/attachments here!
            $('<span class="attachments">').text(gt('Attachments')).appendTo(attachmentNode);
            require(['io.ox/core/api/attachment'], function (api) {
                api.getAll({ folder_id: task.folder_id, id: task.id, module: 4 }).done(function (data) {
                    _(data).each(function (a) {
                        buildDropdown(attachmentNode, a.filename, a);
                    });
                    if (data.length > 1) {
                        buildDropdown(attachmentNode, gt('All attachments'), data);
                    }
                    attachmentNode.on('click', 'a', function (e) { e.preventDefault(); });
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

    var buildDropdown = function (container, title, data) {
        var dropdown = new ActionDropdownView({ point: 'io.ox/core/tk/attachment/links', data: data, title: title });
        container.append(dropdown.$el);
        // no inline style for mobile
        if (_.device('smartphone')) dropdown.$el.css('display', 'block');
    };

    return taskDetailView;
});
