/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 */

define('io.ox/calendar/actions/acceptdeny', [
    'io.ox/calendar/api',
    'io.ox/core/tk/dialogs',
    'io.ox/core/folder/api',
    'io.ox/calendar/util',
    'settings!io.ox/calendar',
    'gettext!io.ox/calendar'
], function (calApi, dialogs, folderAPI, util, calSettings, gt) {

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
                reminderSelect = $(),
                inputid = _.uniqueId('dialog'),
                defaultReminder = calSettings.get('defaultReminder', 15),
                apiData = { folder: o.folder_id, id: o.id },
                //appointments check for conflicts by default, tasks don't
                checkConflicts = options.checkConflicts !== undefined ? options.checkConflicts : !options.taskmode;

            if (!options.taskmode && !series && o.recurrence_position) {
                apiData.recurrence_position = o.recurrence_position;
            }

            api.get(apiData).then(function (data) {
                appointmentData = data;
                if (showReminderSelect) {
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
                        help: 'ox.appsuite.user.sect.calendar.manage.changestatus.html#ox.appsuite.user.concept.calendar.changestatus'
                    })
                    .build(function () {
                        if (!series && o.recurrence_position) {
                            data = api.removeRecurrenceInformation(data);
                        }

                        var recurrenceString = util.getRecurrenceString(data),
                            description = $('<b>').text(data.title),
                            descriptionId = _.uniqueId('confirmation-dialog-description-');
                        if (!options.taskmode) {
                            description = [
                                $('<b>').text(data.title),
                                $.txt(', '),
                                $.txt(gt.noI18n(util.getDateInterval(data))),
                                $.txt(gt.noI18n((recurrenceString !== '' ? ' \u2013 ' + recurrenceString : ''))),
                                $.txt(' '),
                                $.txt(util.getTimeInterval(data))
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
                                $('<input type="text" class="form-control" data-property="comment">').attr({ id: inputid, tabindex: 1 }).val(message),
                                reminderSelect
                            )
                        );
                    })
                    .addSuccessButton('accepted', gt('Accept'), 'accepted', { tabIndex: 1 })
                    .addWarningButton('tentative', gt('Tentative'), 'tentative', { tabIndex: 1 })
                    .addDangerButton('declined', gt('Decline'), 'declined', { tabIndex: 1 })
                    .addAlternativeButton('cancel', gt('Cancel'), 'cancel', { tabIndex: 1 })
                    .show(function () {
                        // do not focus on mobiles. No, never, please. It does simply not work!
                        if (_.device('!smartphone')) $(this).find('[data-property="comment"]').focus();
                    })
                    .done(function (action, data, node) {

                        if (action === 'cancel') {
                            def.resolve(action);
                            return;
                        }

                        // add confirmmessage to request body
                        apiData.data = {
                            confirmmessage: $.trim($(node).find('[data-property="comment"]').val())
                        };

                        folderAPI.get(apiData.folder).done(function (folder) {

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
                            if (showReminderSelect) {
                                apiData.data.alarm = parseInt(reminderSelect.find('select').val(), 10);
                            }

                            if (!options.taskmode && !series && o.recurrence_position) {
                                _.extend(apiData, { occurrence: o.recurrence_position });
                            }
                            var performConfirm = function () {
                                api.confirm(apiData).done(function () {
                                    if (options.callback) {
                                        options.callback();
                                    }
                                }).fail(
                                    function fail(e) {
                                        if (ox.debug) console.log('error', e);
                                    }
                                );
                            };

                            var previousConfirmation = 0;
                            for (var i = 0; i < appointmentData.users.length; i++) {
                                if (appointmentData.users[i].id === ox.user_id) {
                                    //confirmed or tentative
                                    previousConfirmation = appointmentData.users[i].confirmation;
                                }
                            }
                            // no conflicts possible if you decline the appointment
                            // no conflicts possible for free appointments
                            // don't check if confirmation status did not change
                            if (action === 'declined' || appointmentData.shown_as === 4 || apiData.data.confirmation === previousConfirmation) {
                                checkConflicts = false;
                            }

                            if (checkConflicts) {
                                var confirmAction = action;
                                api.checkConflicts(appointmentData).done(function (conflicts) {
                                    if (conflicts.length === 0) {
                                        def.resolve(confirmAction);
                                        performConfirm();
                                    } else {
                                        ox.load(['io.ox/calendar/conflicts/conflictList']).done(function (conflictView) {
                                            var dialog = new dialogs.ModalDialog()
                                                .header(conflictView.drawHeader());

                                            dialog.append(conflictView.drawList(conflicts, dialog).addClass('additional-info'));
                                            dialog.addDangerButton('ignore', gt('Ignore conflicts'), 'ignore', { tabIndex: '1' });

                                            dialog.addButton('cancel', gt('Cancel'), 'cancel', { tabIndex: '1' })
                                                .show()
                                                .done(function (action) {
                                                    if (action === 'cancel') {
                                                        def.resolve(action);
                                                        return;
                                                    }
                                                    if (action === 'ignore') {
                                                        def.resolve(confirmAction);
                                                        performConfirm();
                                                    }
                                                });
                                        });
                                    }
                                });
                            } else {
                                def.resolve(action);
                                performConfirm();
                            }
                        });
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
                    gt('Series'), 'series', { tabIndex: 1 })
                .addButton('appointment', gt('Appointment'), 'appointment', { tabIndex: 1 })
                .addButton('cancel', gt('Cancel'), 'cancel', { tabIndex: 1 })
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
