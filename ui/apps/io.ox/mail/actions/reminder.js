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

define('io.ox/mail/actions/reminder', [
    'gettext!io.ox/mail',
    'io.ox/mail/util',
    'settings!io.ox/core',
    'io.ox/core/notifications'
], function (gt, util, coreSettings, notifications) {

    'use strict';

    return function (baton) {
        var data = [].concat(baton.data)[0];
        require(['io.ox/backbone/views/modal', 'io.ox/tasks/api', 'io.ox/tasks/util'], function (ModalDialog, taskAPI, tasksUtil) {
            //create popup dialog

            var titleInput,
                noteInput,
                dateSelector,
                endDate = new Date();

            new ModalDialog({
                title: gt('Remind me'),
                help: 'ox.appsuite.user.sect.email.manage.reminder.html'
            })
            .addCancelButton()
            .addButton({ label: gt('Create reminder'), action: 'create' })
            .build(function () {
                var guid;
                this.$body.append(
                    $('<div class="form-group">').append(
                        $('<label>').attr('for', guid = _.uniqueId('form-control-label-')).text(gt('Subject')),
                        titleInput = $('<input type="text" class="form-control">').attr('id', guid)
                            .val(gt('Mail reminder') + ': ' + data.subject).focus(function () { this.select(); })
                    ),
                    $('<div class="form-group">').append(
                        $('<label>').attr('for', guid = _.uniqueId('form-control-label-')).text(gt('Note')),
                        noteInput = $('<textarea class="form-control" rows="5">').attr('id', guid)
                            .val(gt('Mail reminder for') + ': ' + data.subject + ' \n' + gt('From') + ': ' + util.formatSender(data.from[0]))
                    ),
                    $('<div class="form-group">').append(
                        $('<label>').attr('for', guid = _.uniqueId('form-control-label-')).text(gt('Remind me')),
                        dateSelector = $('<select class="form-control" name="dateselect">').attr('id', guid).append(
                            tasksUtil.buildDropdownMenu({ time: endDate })
                        )
                    )
                );
            }).on('create', function () {
                //Calculate the right time
                var dates = tasksUtil.computePopupTime(dateSelector.val(), true),
                    note;

                //add mail cid so the task can offer a link
                note = noteInput.val() + '\n--\nmail://' + _.ecid(data);
                taskAPI.create({
                    title: titleInput.val(),
                    folder_id: coreSettings.get('folder/tasks'),
                    alarm: dates.alarmDate,
                    note: note,
                    status: 1,
                    recurrence_type: 0,
                    percent_completed: 0
                })
                .done(function () {
                    notifications.yell('success', gt('Reminder has been created'));
                });
            })
            .open();
        });
    };
});
