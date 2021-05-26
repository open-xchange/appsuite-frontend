/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define('plugins/portal/tasks/register', [
    'io.ox/core/extensions',
    'io.ox/tasks/api',
    'gettext!plugins/portal',
    'io.ox/tasks/util'
], function (ext, taskAPI, gt, util) {

    'use strict';

    ext.point('io.ox/portal/widget/tasks').extend({

        title: gt('My tasks'),

        initialize: function (baton) {
            taskAPI.on('update create delete', function () {
                //refresh portal
                require(['io.ox/portal/main'], function (portal) {
                    var portalApp = portal.getApp(),
                        portalModel = portalApp.getWidgetCollection()._byId[baton.model.id];
                    if (portalModel) {
                        portalApp.refreshWidget(portalModel, 0);
                    }
                });

            });
        },

        load: function (baton) {
            // super special getAll method
            return taskAPI.getAllMyTasks().done(function (data) {
                baton.data = data;
            });
        },

        summary: function (baton) {

            if (this.find('.summary').length) return;

            this.addClass('with-summary show-summary');

            var tasks = _(baton.data).filter(function (task) {
                    return task.end_time !== null && task.status !== 3;
                }),
                sum = $('<div class="summary">');

            if (tasks.length === 0) {
                sum.text(gt('You don\'t have any tasks that are either due soon or overdue.'));
            } else {
                var task = util.interpretTask(_(tasks).first());

                sum.append(
                    $('<li class="item" tabindex="0">').data('item', task).append(
                        $('<span class="flex-wrapper">').append(
                            $('<span class="bold">').text(_.ellipsis(task.title, { max: 50 })), $.txt(' '),
                            task.end_time === '' ? $() :
                                $('<span class="accent">').text(
                                    //#. Due on date
                                    gt('Due on %1$s', task.end_time)
                                ),
                            $.txt(' ')
                        ),
                        $('<span class="status pull-right">').text(task.status).addClass(task.badge)
                    )
                );

                this.on('tap', 'h2', function (e) {
                    $(e.delegateTarget).toggleClass('show-summary');
                });
            }

            this.append(sum);
        },

        preview: function (baton) {

            var content = $('<ul class="content list-unstyled">'),
                tasks;

            tasks = _(baton.data).filter(function (task) {
                return task.end_time !== null && task.status !== 3;
            });

            if (tasks.length === 0) {
                this.append(
                    content.append(
                        $('<li>').text(gt('You don\'t have any tasks that are either due soon or overdue.'))
                    )

                );
                return;
            }

            _(tasks.slice(0, 10)).each(function (task) {
                task = util.interpretTask(task);
                content.append(
                    $('<li class="item" tabindex="0">').data('item', task).append(
                        $('<span class="flex-wrapper">').append(
                            $('<span class="bold">').text(_.ellipsis(task.title, { max: 50 })), $.txt(' '),
                            task.end_time === '' ? $() :
                                $('<span class="accent">').text(
                                    //#. Due on date
                                    gt('Due on %1$s', task.end_time)
                                ),
                            $.txt(' ')
                        ),
                        $('<span>').text(task.status).addClass(task.badge)
                    )
                );
            });

            this.append(content);
        },

        draw: function (baton) {
            var popup = this.busy();
            require(['io.ox/tasks/view-detail', 'io.ox/tasks/api'], function (view, api) {
                var obj = api.reduce(baton.item);
                api.get(obj).done(function (data) {
                    popup.idle().append(view.draw(data));
                });
            });
        }
    });

    ext.point('io.ox/portal/widget/tasks/settings').extend({
        title: gt('My tasks'),
        type: 'tasks',
        editable: false,
        unique: true
    });
});
