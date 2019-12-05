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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
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
