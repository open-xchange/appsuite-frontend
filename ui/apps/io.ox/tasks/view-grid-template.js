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
                var title, status, end_time, user, progress, private_flag;
                this.addClass('tasks').append(
                    $('<div class="first-row">').append(
                        title = $('<div aria-hidden="true">').addClass('title'),
                        end_time = $('<span aria-hidden="true">').addClass('end_date'),
                        private_flag = $('<i class="fa fa-lock private-flag" aria-hidden="true">').hide()
                    ),
                    $('<div class="second-row">').append(
                        status = $('<span aria-hidden="true">').addClass('status'),
                        user = $('<i class="participants fa fa-user" aria-hidden="true">').hide(),
                        progress = $('<div class="progress" aria-hidden="true"><div class="progress-bar" style="width: 0%;"></div></div>').hide()
                    )
                );

                return { title: title, private_flag: private_flag, end_time: end_time, status: status, user: user, progress: progress };
            },

            set: function (task, fields, index, prev, grid) {

                var data = task, ariaLabel = _.noI18n(data.title);
                if (!data.badge && data.badge !== '') {
                    // check for empty string also to avoid double processing (see bug 36610)
                    // data needs to be processed first
                    data = util.interpretTask(task, { noOverdue: grid.prop('sort') !== 'urgency' });
                }

                //important. with addClass old classes aren't removed correctly
                fields.status.attr('class', 'status ' + data.badge)
                    .text(data.status || _.noI18n('\u00A0'));
                ariaLabel = ariaLabel + ', ' + data.status;

                fields.title.text(_.noI18n(data.title));
                if (!task.full_time) {
                    fields.title.addClass('not-fulltime');
                }
                fields.end_time.text(_.noI18n(data.end_time));

                if (task.end_time) {
                    //#. followed by date or time to mark the enddate of a task
                    ariaLabel = ariaLabel + ', ' + gt('ends:') + ' ' + util.getSmartEnddate(task);
                }

                if (data.participants && data.participants.length) {
                    fields.user.show();
                    //#. message for screenreaders in case selected task has participants
                    ariaLabel = ariaLabel + ', ' + gt('has participants');
                } else {
                    fields.user.hide();
                }

                if (data.private_flag) {
                    fields.private_flag.show();
                    ariaLabel = ariaLabel + ', ' + gt('private');
                } else {
                    fields.private_flag.hide();
                }

                if (data.percent_completed > 0 && data.percent_completed < 100) {
                    fields.progress.find('.progress-bar').css('width', data.percent_completed + '%').end().show();
                    //#. %1$s how much of a task is completed in percent, values from 0-100
                    //#, c-format
                    ariaLabel = ariaLabel + ', ' + gt('Progress %1$s %', _.noI18n(data.percent_completed));
                } else {
                    fields.progress.find('.progress-bar').css('width', 0 + '%').end().hide();
                }

                this.attr({
                    'data-index': index,
                    'aria-label': ariaLabel + '.'
                });
            }
        },

        drawSimpleGrid: function (taskList) {

            // use template
            var tmpl = new VGrid.Template({
                    tagName: 'li',
                    defaultClassName: 'vgrid-cell list-unstyled'
                }),
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
