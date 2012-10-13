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

define('io.ox/tasks/view-grid-template',
    ['io.ox/core/tk/vgrid',
     'less!io.ox/tasks/style.css'], function (VGrid) {

    'use strict';


    //grid-based list for portal
    var gridTemplate = {
         // main grid template
            main: {
                build: function () {
                    var title, status, end_date, user, progress;
                    this.addClass('tasks').append(
                        $('<div class="first-row">').append(
                            end_date = $('<span>').addClass('end_date'),
                            title = $('<div>').addClass('title')
                        ),
                        $('<div class="second-row">').append(
                            status = $('<span>').addClass('status'),
                            user = $('<i class="participants icon-user">').hide(),
                            progress = $('<div class="progress"><div class="bar" style="width: 0%;"></div></div>').hide()
                        )
                    );

                    return { title: title, end_date: end_date, status: status, user: user, progress: progress };
                },

                set: function (data, fields, index) {
//                    if (data.priority === 3) {
//                        fields.priority.text("\u2605\u2605\u2605");
//                    } else {
//                        fields.priority.html("&nbsp");
//                    }
                    fields.title.text($.trim(data.title));
                    fields.end_date.text(data.end_date);
                    fields.status.attr('class', 'status ' + data.badge) //important. with addClass old classes aren't removed correctly
                        .text($.trim(data.status) || '\u00A0');
                    fields.user[data.participants.length ? 'show' : 'hide']();
                    if (data.percent_completed > 0 && data.percent_completed < 100) {
                        fields.progress.find('.bar').css('width', data.percent_completed + '%').end().show();
                    } else {
                        fields.progress.hide();
                    }
                    this.attr('data-index', index);
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