/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/tasks/settings/pane', [
    'io.ox/backbone/views/extensible',
    'settings!io.ox/tasks',
    'io.ox/core/extensions',
    'io.ox/core/settings/util',
    'io.ox/core/capabilities',
    'gettext!io.ox/tasks'
], function (ExtensibleView, settings, ext, util, capabilities, gt) {

    'use strict';

    settings.on('change', function () {
        settings.saveAndYell();
    });

    ext.point('io.ox/tasks/settings/detail').extend({
        index: 100,
        id: 'view',
        draw: function () {
            this.append(
                new ExtensibleView({ point: 'io.ox/tasks/settings/detail/view', model: settings })
                .render().$el
            );
        }
    });

    ext.point('io.ox/tasks/settings/detail/view').extend(
        {
            id: 'header',
            index: 100,
            render: function () {
                this.$el.addClass('io-ox-tasks-settings').append(
                    util.header(gt.pgettext('app', 'Tasks'))
                );
            }
        },
        {
            id: 'buttons',
            index: 150,
            render: function (baton) {
                this.$el.append(
                    baton.branch('buttons', null, $('<div class="form-group buttons">'))
                );
            }
        },
        {
            id: 'notifications',
            index: 200,
            render: function () {
                this.$el.append(
                    util.fieldset(
                        gt('Email notifications'),
                        util.checkbox('notifyNewModifiedDeleted', gt('Receive notifications when a task in which you participate is created, modified or deleted'), settings),
                        util.checkbox('notifyAcceptedDeclinedAsCreator', gt('Receive notifications when a participant accepted or declined a task created by you'), settings),
                        util.checkbox('notifyAcceptedDeclinedAsParticipant', gt('Receive notifications when a participant accepted or declined a task in which you participate'), settings)
                    )
                );
            }
        }
    );

    ext.point('io.ox/tasks/settings/detail/view/buttons').extend(
        {
            id: 'shared-tasks',
            index: 50,
            render: function () {
                if (!capabilities.has('edit_public_folders || read_create_shared_folders || caldav')) return;

                function openDialog() {
                    require(['io.ox/core/sub/sharedFolders'], function (subscribe) {
                        subscribe.open({
                            module: 'tasks',
                            help: 'ox.appsuite.user.sect.tasks.folder.subscribeshared.html',
                            title: gt('Subscribe to shared task folders'),
                            point: 'io.ox/core/folder/subscribe-shared-tasks-folders',
                            noSync: !capabilities.has('caldav'),
                            sections: {
                                public: gt('Public tasks folders'),
                                shared: gt('Shared tasks folders'),
                                private: gt('Private'),
                                hidden: gt('Hidden tasks folders')
                            }
                        });
                    });
                }

                this.append(
                    $('<button type="button" class="btn btn-default" data-action="subscribe-shared-tasks-folders">')
                    .append(
                        $.txt(gt('Subscribe to shared tasks folders'))
                    )
                    .on('click', openDialog)
                );
            }
        }
    );
});
