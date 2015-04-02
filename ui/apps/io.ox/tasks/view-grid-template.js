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
    'less!io.ox/tasks/style'
], function (VGrid, util) {

    'use strict';

    //grid-based list for portal
    var gridTemplate = {
        // main grid template
        main: {
            build: function () {
                var title, status, end_date, user, progress, private_flag;
                this.addClass('tasks').append(
                    $('<div class="first-row">').append(
                        end_date = $('<span>').addClass('end_date'),
                        private_flag = $('<i class="fa fa-lock private-flag">').hide(),
                        title = $('<div>').addClass('title')
                    ),
                    $('<div class="second-row">').append(
                        status = $('<span>').addClass('status'),
                        user = $('<i class="participants fa fa-user">').hide(),
                        progress = $('<div class="progress"><div class="progress-bar" style="width: 0%;"></div></div>').hide()
                    )
                );

                return { title: title, private_flag: private_flag, end_date: end_date, status: status, user: user, progress: progress };
            },

            set: function (task, fields, index, prev, grid) {
                var data = task;
                if (!data.badge && data.badge !== '') {
                    // check for empty string also to avoid double processing (see bug 36610)
                    // data needs to be processed first
                    data = util.interpretTask(task, { noOverdue: grid.prop('sort') !== 'urgency' });
                }

                var a11yLabel = '';
                fields.title.text(a11yLabel = _.noI18n(data.title));
                fields.end_date.text(_.noI18n(data.end_date));
                //important. with addClass old classes aren't removed correctly
                fields.status.attr('class', 'status ' + data.badge)
                    .text(data.status || _.noI18n('\u00A0'));
                fields.user[data.participants && data.participants.length ? 'show' : 'hide']();
                if (data.private_flag) {
                    fields.private_flag.show();
                } else {
                    fields.private_flag.hide();
                }
                if (data.percent_completed > 0 && data.percent_completed < 100) {
                    fields.progress.find('.progress-bar').css('width', data.percent_completed + '%').end().show();
                } else {
                    fields.progress.hide();
                }
                this.attr({
                    'data-index': index,
                    'aria-label': a11yLabel
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
