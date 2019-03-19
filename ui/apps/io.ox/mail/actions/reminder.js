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
        require(['io.ox/core/tk/dialogs', 'io.ox/tasks/api', 'io.ox/tasks/util'], function (dialogs, taskAPI, tasksUtil) {
            //create popup dialog

            var titleInput,
                noteInput,
                dateSelector,
                endDate = new Date(),
                popup = new dialogs.ModalDialog({
                    help: 'ox.appsuite.user.sect.email.manage.reminder.html'
                })
                    .addPrimaryButton('create', gt('Create reminder'), 'create')
                    .addButton('cancel', gt('Cancel'), 'cancel');

            //Header
            popup.getHeader().append($('<h4>').text(gt('Remind me')));

            //fill popup body
            var popupBody = popup.getBody(), guid;

            popupBody.append(
                $('<div class="form-group">').append(
                    $('<label>').attr('for', guid = _.uniqueId('form-control-label-')).text(gt('Subject')),
                    titleInput = $('<input>', { class: 'form-control', type: 'text', value: gt('Mail reminder') + ': ' + data.subject, 'aria-labelledby': 'subject', id: guid })
                        .focus(function () { this.select(); })
                ),
                $('<div class="form-group">').append(
                    $('<label>').attr('for', guid = _.uniqueId('form-control-label-')).text(gt('Note')),
                    noteInput = $('<textarea>', { class: 'form-control', rows: '5', value: gt('Mail reminder for') + ': ' + data.subject + ' \n' + gt('From') + ': ' + util.formatSender(data.from[0]), 'aria-labelledby': 'note', id: guid })
                        .focus(function () { this.select(); })
                ),
                $('<div class="form-group">').append(
                    $('<label id="remindme">').attr('for', guid = _.uniqueId('form-control-label-')).text(gt('Remind me')),
                    dateSelector = $('<select>', { class: 'form-control', name: 'dateselect', 'aria-labelledby': 'remindme', id: guid }).append(tasksUtil.buildDropdownMenu({ time: endDate }))
                )
            );

            //ready for work
            var def = popup.show();
            titleInput.focus();
            def.done(function (action) {
                if (action === 'create') {

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
                }
            });
        });
    };
});
