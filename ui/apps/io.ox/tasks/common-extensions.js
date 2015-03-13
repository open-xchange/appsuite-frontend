/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/tasks/common-extensions', [
    'io.ox/tasks/util',
    'io.ox/mail/util',
    'io.ox/tasks/api',
    'io.ox/core/strings',
    'gettext!io.ox/tasks'
], function (util, mailUtil, api, strings, gt) {

    'use strict';

    var extensions = {

        date: function (baton, options) {
            var data = baton.data, t = data.end_date || data.start_date || data.last_modified;
            if (!_.isNumber(t)) return;
            this.append(
                $('<time class="date">')
                .attr('datetime', moment(t).format('YYYY-MM-DD HH:mm'))
                .text(_.noI18n(mailUtil.getDateTime(t, options)))
            );
        },

        smartdate: function (baton) {
            extensions.date.call(this, baton, { fulldate: false, smart: true });
        },

        fulldate: function (baton) {
            extensions.date.call(this, baton, { fulldate: true, smart: false });
        },

        compactdate: function (baton) {
            extensions.date.call(this, baton, { fulldate: false, smart: false });
        },

        title: function (baton) {
            this.append(
                $('<div class="title">').append(
                    baton.data.title
                )
            );
        },

        status: function (baton) {
            this.append(
                $('<div class="status">').append(
                    baton.data.status
                )
            );
        },

        progress: function (baton) {
            this.append(
                $('<div class="prog">').append(
                    gt('Progress') + ': ' + (baton.data.percent_completed || 0) + '%'
                )
            );
        },

        dueDate: (function () {

            function onClick(e) {

                e.preventDefault();
                var data = e.data.data,
                    finderId = $(e.target).val();

                ox.load(['io.ox/core/tk/dialogs', 'io.ox/core/notifications']).done(function (dialogs, notifications) {

                    var endDate = util.computePopupTime(finderId).endDate,
                        modifications = {
                            end_date: endDate,
                            id: data.id,
                            folder_id: data.folder_id || data.folder
                        };

                    //check if startDate is still valid with new endDate, if not, show dialog
                    if (data.start_date && data.start_date > endDate) {

                        var popup = new dialogs.ModalDialog()
                            .addButton('cancel', gt('Cancel'), 'cancel', { tabIndex: 1 })
                            .addPrimaryButton('change', gt('Adjust start date'), 'changechange', { tabIndex: 1 });
                        //text
                        popup.getBody().append(
                            $('<h4>').text(gt('Inconsistent dates')),
                            $('<div>').text(
                                //#. If the user changes the duedate of a task, it may be before the start date, which is not allowed
                                //#. If this happens the user gets the option to change the start date so it matches the due date
                                gt('The due date cannot be before start date. Adjust start date?')
                            )
                        );
                        popup.show().done(function (action) {
                            if (action === 'cancel') {
                                notifications.yell('info', gt('Canceled'));
                            } else {
                                modifications.start_date = modifications.end_date;
                                api.update(modifications).done(function () {
                                    notifications.yell('success', gt('Changed due date'));
                                });
                            }
                        });
                    } else {
                        api.update(modifications).done(function () {
                            notifications.yell('success', gt('Changed due date'));
                        });
                    }
                });
            }

            return function (baton) {

                this.attr({
                    'aria-haspopup': 'true',
                    'data-action': 'change-due-date',
                    'data-toggle': 'dropdown',
                    'tabindex': '1'
                });

                this.append($('<i class="fa fa-caret-down">'));

                this.after(
                    $('<ul class="dropdown-menu pull-right" role="menu">').append(
                        util.buildDropdownMenu({ bootstrapDropdown: true, daysOnly: true })
                    )
                    .on('click', 'li > a:not([data-action="close-menu"])', { data: baton.data }, onClick)
                );

                this.parent().addClass('dropdown');
            };
        }())
    };

    return extensions;
});
