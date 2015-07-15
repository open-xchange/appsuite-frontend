/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/tasks/view-grid-template', [
    'io.ox/core/tk/vgrid',
    'io.ox/tasks/util',
    'gettext!io.ox/tasks',
    'less!io.ox/tasks/style'
], function (VGrid, util, gt) {

    'use strict';

    //grid-based list for portal
    var gridTemplate = {
        // main grid template
        main: {
            build: function () {
                var title, status, end_time, user, progress, private_flag, userMessage, progressMessage, private_flagMessage, end_timeMessage;
                this.addClass('tasks').append(
                    $('<div class="first-row">').append(
                        title = $('<div>').addClass('title'),
                        end_timeMessage = $('<span class="sr-only">'),
                        end_time = $('<span aria-hidden="true">').addClass('end_date'),
                        private_flagMessage = $('<span class="sr-only">').text(gt('private')).hide(),
                        private_flag = $('<i class="fa fa-lock private-flag" aria-hidden="true">').hide()
                    ),
                    $('<div class="second-row">').append(
                        status = $('<span>').addClass('status'),
                        userMessage = $('<span class="sr-only">').text(gt('has participants')).hide(),
                        user = $('<i class="participants fa fa-user" aria-hidden="true">').hide(),
                        progressMessage = $('<span class="sr-only">').hide(),
                        progress = $('<div class="progress" aria-hidden="true"><div class="progress-bar" style="width: 0%;"></div></div>').hide()
                    )
                );

                return { title: title, private_flag: private_flag, end_time: end_time, status: status, user: user, progress: progress,
                         userMessage: userMessage, progressMessage: progressMessage, private_flagMessage: private_flagMessage, end_timeMessage: end_timeMessage };
            },

            set: function (task, fields, index, prev, grid) {

                var data = task;
                if (!data.badge && data.badge !== '') {
                    // check for empty string also to avoid double processing (see bug 36610)
                    // data needs to be processed first
                    data = util.interpretTask(task, { noOverdue: grid.prop('sort') !== 'urgency' });
                }

                fields.title.text(_.noI18n(data.title));
                if (!task.full_time) {
                    fields.title.addClass('not-fulltime');
                }
                fields.end_time.text(_.noI18n(data.end_time));
                fields.end_timeMessage.text( !task.end_time ? '' : util.getSmartEnddate(task));
                //important. with addClass old classes aren't removed correctly
                fields.status.attr('class', 'status ' + data.badge)
                    .text(data.status || _.noI18n('\u00A0'));
                if (data.participants && data.participants.length) {
                    fields.user.show();
                    fields.userMessage.show();
                } else {
                    fields.user.hide();
                    fields.userMessage.hide();
                }

                if (data.private_flag) {
                    fields.private_flag.show();
                    fields.private_flagMessage.show();
                } else {
                    fields.private_flag.hide();
                    fields.private_flagMessage.hide();
                }

                if (data.percent_completed > 0 && data.percent_completed < 100) {
                    fields.progress.find('.progress-bar').css('width', data.percent_completed + '%').end().show();
                    fields.progressMessage.text(
                        //#. %1$s how much of a task is completed in percent, values from 0-100
                        //#, c-format
                        gt('Progress %1$s %', _.noI18n(data.percent_completed))).show();
                }
                this.attr({
                    'data-index': index
                });
            }
        },

        drawSimpleGrid: function (taskList) {

            // use template
            var tmpl = new VGrid.Template(),
            $div = $('<div>');

            // add template
            tmpl.add(gridTemplate.main);

            _(taskList).each(function (data, i) {
                var clone = tmpl.getClone();
                clone.update(data, i);
                clone.appendTo($div).node
                .css('position', 'relative')
                .data('object-data', data)
                .addClass('hover');
            });

            return $div;
        }
    };
    return gridTemplate;
});
