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
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 */

define('io.ox/calendar/actions/acceptdeny', [
    'io.ox/calendar/api',
    'io.ox/core/tk/dialogs',
    'io.ox/core/folder/api',
    'io.ox/calendar/util',
    'io.ox/core/notifications',
    'settings!io.ox/calendar',
    'gettext!io.ox/calendar'
], function (calApi, dialogs, folderAPI, util, notifications, settings, gt) {

    'use strict';

    return function (o, options) {
        options = options || {};
        function cont(series) {

            var def = $.Deferred(),
                showReminderSelect = !options.taskmode && util.getConfirmationStatus(o) !== 1,
                message = util.getConfirmationMessage(o),
                appointmentData,
                //use different api if provided (tasks use this)
                api = options.api || calApi,
                folder,
                canModify,
                reminderSelect = $(),
                inputid = _.uniqueId('dialog'),
                defaultReminder = settings.get('defaultReminder', 15),
                apiData = { folder: o.folder_id, id: o.id },
                //appointments check for conflicts by default, tasks don't
                checkConflicts = options.checkConflicts !== undefined ? options.checkConflicts : !options.taskmode;

            if (!options.taskmode && !series && o.recurrence_position) {
                apiData.recurrence_position = o.recurrence_position;
            }

            $.when(api.get(apiData), folderAPI.get(apiData.folder)).then(function (data, folderData) {
                appointmentData = data;
                // check if the response is of type [data, timestamp]
                if (_.isArray(data) && data.length === 2 && _.isNumber(data[1])) {
                    appointmentData = data[0];
                }
                folder = folderData;

                // check if user is allowed to set the reminder time
                // tasks don't have a default reminder
                canModify = options.taskmode ? 0 : folderAPI.bits(folder, 14);
                // only own objects
                if (canModify === 1) {
                    canModify = appointmentData.organizerId === ox.user_id;
                } else {
                    canModify = canModify > 1;
                }

                if (showReminderSelect && canModify) {
                    reminderSelect = $('<div class="form-group">').append(
                        $('<label>').attr('for', 'reminderSelect').text(gt('Reminder')),
                        $('<select id="reminderSelect" class="form-control" data-property="reminder">').append(function () {
                            var self = $(this),
                                reminderOptions = util.getReminderOptions();
                            _(reminderOptions).each(function (label, value) {
                                self.append($('<option>', { value: value }).text(label));
                            });
                        })
                        .val(defaultReminder)
                    );
                }

                return new dialogs.ModalDialog({
                    async: true,
                    help: 'ox.appsuite.user.sect.calendar.manage.changestatus.html'
                })
                    .build(function () {
                        if (!series && o.recurrence_position) {
                            data = api.removeRecurrenceInformation(appointmentData);
                        }

                        var recurrenceString = util.getRecurrenceString(appointmentData),
                            description = $('<b>').text(appointmentData.title),
                            descriptionId = _.uniqueId('confirmation-dialog-description-');

                        if (!options.taskmode) {
                            var strings = util.getDateTimeIntervalMarkup(appointmentData, { output: 'strings' });
                            description = [
                                $('<b>').text(appointmentData.title),
                                $.txt(', '),
                                $.txt(strings.dateStr),
                                $.txt(recurrenceString !== '' ? ' \u2013 ' + recurrenceString : ''),
                                $.txt(' '),
                                $.txt(strings.timeStr)
                            ];
                        }

                        this.getPopup().attr('aria-describedby', descriptionId);
                        this.getHeader().append(
                            $('<h4 id="dialog-title">').text(gt('Change confirmation status'))
                        );
                        this.getContentNode().append(
                            $('<p>').text(
                                gt('You are about to change your confirmation status. Please leave a comment for other participants.')
                            ),
                            $('<p>').attr('id', descriptionId).append(
                                description
                            ),
                            $('<div class="form-group">').css({ 'margin-top': '20px' }).append(
                                $('<label class="control-label">').attr('for', inputid).text(gt('Comment')).append(
                                    $('<span class="sr-only">').text(data.title + ' ' + gt('Please comment your confirmation status.'))
                                ),
                                $('<input type="text" class="form-control" data-property="comment">').attr('id', inputid).val(message),
                                reminderSelect
                            )
                        );
                    })
                    .addSuccessButton('accepted', gt('Accept'), 'accepted')
                    .addWarningButton('tentative', gt('Tentative'), 'tentative')
                    .addDangerButton('declined', gt('Decline'), 'declined')
                    .addAlternativeButton('cancel', gt('Cancel'), 'cancel')
                    .on('cancel', function () {
                        this.close();
                    })
                    .on('accepted tentative declined', function (e) {

                        var action = e.type, dialog = this;

                        function performConfirm() {
                            api.confirm(apiData)
                                .done(function () {
                                    dialog.close();
                                    if (options.callback) options.callback();
                                })
                                .fail(function (e) {
                                    dialog.idle();
                                    notifications.yell(e);
                                });
                        }

                        // add confirmmessage to request body
                        apiData.data = {
                            confirmmessage: $.trim(this.getContentNode().find('[data-property="comment"]').val())
                        };

                        // add current user id in shared or public folder
                        if (folderAPI.is('shared', folder)) {
                            apiData.data.id = folder.created_by;
                        }

                        switch (action) {
                            case 'accepted':
                                apiData.data.confirmation = 1;
                                break;
                            case 'declined':
                                apiData.data.confirmation = 2;
                                break;
                            case 'tentative':
                                apiData.data.confirmation = 3;
                                break;
                            default:
                                return;
                        }

                        // set (default) reminder?
                        if (showReminderSelect && canModify) {
                            apiData.data.alarm = parseInt(reminderSelect.find('select').val(), 10);
                        }

                        if (!options.taskmode && !series && o.recurrence_position) {
                            _.extend(apiData, { occurrence: o.recurrence_position });
                        }

                        var previousConfirmation = _(appointmentData.users).findWhere({ id: ox.user_id });

                        // no conflicts possible if you decline the appointment
                        // no conflicts possible for free appointments
                        // don't check if confirmation status did not change
                        if (action === 'declined' || appointmentData.shown_as === 4 || (previousConfirmation && apiData.data.confirmation === previousConfirmation.confirmation)) {
                            checkConflicts = false;
                        }

                        if (!checkConflicts) return performConfirm();

                        api.checkConflicts(appointmentData)
                            .done(function (conflicts) {

                                if (conflicts.length === 0) return performConfirm();

                                ox.load(['io.ox/calendar/conflicts/conflictList']).done(function (conflictView) {
                                    conflictView.dialog(conflicts)
                                        .on('cancel', function () { dialog.idle(); })
                                        .on('ignore', function () { performConfirm(); });
                                });
                            })
                            .fail(notifications.yell)
                            .fail(dialog.close);
                    })
                    .show(function () {
                        // do not focus on mobiles. No, never, please. It does simply not work!
                        if (_.device('!smartphone')) $(this).find('[data-property="comment"]').focus();
                    });
            });
            return def;
        }

        // series?
        if (!options.taskmode && o.recurrence_type > 0 && o.recurrence_position) {
            return new dialogs.ModalDialog()
                .text(gt('Do you want to confirm the whole series or just one appointment within the series?'))
                .addPrimaryButton('series',
                    //#. Use singular in this context
                    gt('Series'), 'series')
                .addButton('appointment', gt('Appointment'), 'appointment')
                .addButton('cancel', gt('Cancel'), 'cancel')
                .show()
                .then(function (action) {
                    if (action === 'cancel') {
                        return;
                    }
                    _.defer(cont, action === 'series');
                    return;
                });
        }
        return cont();
    };
});
