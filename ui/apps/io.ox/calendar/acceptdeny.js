/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 */

define('io.ox/calendar/acceptdeny',
    ['io.ox/calendar/api',
     'io.ox/core/tk/dialogs',
     'io.ox/core/api/folder',
     'io.ox/calendar/util',
     'settings!io.ox/calendar',
     'gettext!io.ox/calendar'
    ], function (api, dialogs, folderAPI, util, calSettings, gt) {

    'use strict';

    return function (o) {

        var showReminderSelect = util.getConfirmationStatus(o) !== 1,
            message = util.getConfirmationMessage(o),
            reminderSelect = $(),
            inputid = _.uniqueId('dialog'),
            defaultReminder = calSettings.get('defaultReminder', 15);

        o = { folder: o.folder_id, id: o.id };

        return api.get(o).then(function (data) {

            if (showReminderSelect) {
                reminderSelect = $('<div>')
                    .addClass('controls')
                    .css({'margin-right': '10px'})
                    .append(
                        $('<select id="reminderSelect" data-property="reminder">').append(function () {
                            var self = $(this),
                                options = util.getReminderOptions();
                            _(options).each(function (label, value) {
                                self.append($('<option>', {value: value}).text(label));
                            });
                        })
                        .val(defaultReminder)
                    ).before(
                        $('<label>').addClass('control-label').attr('for', 'reminderSelect').text(gt('Reminder'))
                    );
            }

            return new dialogs.ModalDialog()
                .build(function () {

                    var recurrenceString = util.getRecurrenceString(data);

                    this.getHeader().append(
                        $('<h4>').text(gt('Change confirmation status'))
                    );
                    this.getContentNode().append(
                        $('<p>').text(
                            gt('You are about to change your confirmation status. Please leave a comment for other participants.')
                        ),
                        $('<p>').append(
                            $('<b>').text(data.title),
                            $.txt(', '),
                            $.txt(gt.noI18n(util.getDateInterval(data))),
                            $.txt(gt.noI18n((recurrenceString !== '' ? ' \u2013 ' + recurrenceString : ''))),
                            $.txt(' '),
                            $.txt(util.getTimeInterval(data))
                        ),
                        $('<div class="row-fluid">').css({'margin-top': '20px'}).append(
                            $('<div class="control-group span12">').css({'margin-bottom': '0px'}).append(
                                $('<label class="control-label">').attr('for', inputid).text(gt('Comment')),
                                $('<div class="controls">').css({'margin-right': '10px'}).append(
                                    $('<input type="text" data-property="comment">')
                                        .attr({ id: inputid })
                                        .css({ width: '100%' })
                                        .val(message)
                                )
                            ),
                            reminderSelect
                        )
                    );
                })
                .addAlternativeButton('cancel', gt('Cancel'))
                .addDangerButton('declined', gt('Decline'))
                .addWarningButton('tentative', gt('Tentative'))
                .addSuccessButton('accepted', gt('Accept'))
                .show(function () {
                    $(this).find('[data-property="comment"]').focus();
                })
                .done(function (action, data, node) {

                    if (action === 'cancel') return;

                    // add confirmmessage to request body
                    o.data = {
                        confirmmessage: $.trim($(node).find('[data-property="comment"]').val())
                    };

                    folderAPI.get({ folder: o.folder }).done(function (folder) {

                        // add current user id in shared or public folder
                        if (folderAPI.is('shared', folder)) {
                            o.data.id = folder.created_by;
                        }

                        switch (action) {
                        case 'accepted':
                            o.data.confirmation = 1;
                            break;
                        case 'declined':
                            o.data.confirmation = 2;
                            break;
                        case 'tentative':
                            o.data.confirmation = 3;
                            break;
                        default:
                            return;
                        }

                        api.confirm(o).then(
                            function success() {
                                if (showReminderSelect) {
                                    var reminder = parseInt(reminderSelect.find('select').val(), 10);
                                    delete o.data;
                                    o.alarm = reminder;
                                    api.update(o);
                                }
                            },
                            function fail(e) {
                                if (ox.debug) console.log('error', e);
                            }
                        );
                    });
                });
        });
    };
});
