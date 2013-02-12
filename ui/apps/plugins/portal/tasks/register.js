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

define("plugins/portal/tasks/register",
    ['io.ox/core/extensions',
     'io.ox/tasks/api',
     'gettext!plugins/portal',
     'io.ox/core/strings',
     'io.ox/tasks/util'
    ], function (ext, taskApi, gt, strings, util) {

    "use strict";

    ext.point("io.ox/portal/widget/tasks").extend({

        title: gt('Tasks'),

        action: function (baton) {
            ox.launch('io.ox/tasks/main');
        },

        load: function (baton) {
            return taskApi.getAllFromAllFolders().done(function (data) { //super special getAll method
                baton.data = data;
            });
        },

        preview: function (baton) {

            var content = $('<div class="content">');

            var tasks = _(baton.data).filter(function (task) {
                return task.end_date !== null && task.status !== 3;
            });

            if (tasks.length === 0) {
                this.append(content.text(gt("You don't have any tasks that are due soon.")));
                return;
            }

            _(tasks).each(function (task) {
                task = util.interpretTask(task);
                content.append(
                    $('<div class="item">').data('item', task).append(
                        $('<span class="bold">').text(gt.noI18n(strings.shorten(task.title, 50))), $.txt(' '),
                        task.end_date === '' ? $() :
                            $('<span class="accent">').text(
                                //#. Due on date
                                gt('Due on %1$s', _.noI18n(task.end_date))
                            ),
                        $.txt(' '),
                        $('<span class="gray">').text(gt.noI18n(strings.shorten(task.note, 100)))
                    )
                );
            });
            this.append(content);
        },

        draw: function (baton) {
            var popup = this.busy(),
                content;

            require(['io.ox/tasks/view-detail', 'io.ox/tasks/api'], function (view, api) {

                function contentCheck(e) {
                    popup.parent().parent().find('button').trigger('click');
                    popup = null;
                    api.off('removePopup', contentCheck);

                }
                var obj = api.reduce(baton.item);
                api.get(obj).done(function (data) {
                    popup.idle().append(content = view.draw(data));
                    api.on('removePopup', contentCheck);
                });
            });
        }
    });

    ext.point('io.ox/portal/widget/tasks/settings').extend({
        title: gt('Tasks'),
        type: 'tasks',
        editable: false,
        unique: true
    });
});
