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
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/tasks/common-extensions', [
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/tasks/util',
    'io.ox/tasks/api',
    'gettext!io.ox/tasks'
], function (Dropdown, util, api, gt) {

    'use strict';

    var extensions = {

        dueDate: (function () {

            function onClick(e) {

                e.preventDefault();
                var data = e.data.data,
                    finderId = $(e.target).val();

                ox.load(['io.ox/backbone/views/modal', 'io.ox/core/notifications']).done(function (ModalDialog, notifications) {

                    var endTime = util.computePopupTime(finderId).endDate,
                        modifications = {
                            end_time: endTime,
                            id: data.id,
                            folder_id: data.folder_id || data.folder
                        };

                    //check if startDate is still valid with new endDate, if not, show dialog
                    if (data.start_time && data.start_time > endTime) {
                        new ModalDialog({
                            title: gt('Inconsistent dates'),
                            //#. If the user changes the duedate of a task, it may be before the start date, which is not allowed
                            //#. If this happens the user gets the option to change the start date so it matches the due date
                            description: gt('The due date cannot be before start date. Adjust start date?')
                        })
                            .addCancelButton()
                            .addButton({ label: gt('Adjust start date'), action: 'datechange' })
                            .on('cancel', function () { notifications.yell('info', gt('Canceled')); })
                            .on('datechange', function () {
                                modifications.start_time = modifications.end_time;
                                api.update(modifications).done(function () {
                                    notifications.yell('success', gt('Changed due date'));
                                });
                            })
                            .open();
                    } else {
                        api.update(modifications).done(function () {
                            notifications.yell('success', gt('Changed due date'));
                        });
                    }
                });
            }

            return function (baton) {

                var data = baton.first();

                var $ul = $('<ul class="dropdown-menu" role="menu">')
                    .append(
                        util.buildDropdownMenu({ bootstrapDropdown: true, daysOnly: true })
                    )
                    .on('click', 'li > a:not([data-action="close-menu"])', { data: data }, onClick);

                this.attr({
                    'aria-haspopup': 'true',
                    'data-action': 'change-due-date',
                    'data-toggle': 'dropdown'
                });

                this.append($('<i class="fa fa-caret-down" aria-hidden="true">'));

                new Dropdown({
                    el: this.parent(),
                    $toggle: this,
                    $ul: $ul
                }).render();

                this.parent().addClass('dropdown');
            };
        }())
    };

    return extensions;
});
