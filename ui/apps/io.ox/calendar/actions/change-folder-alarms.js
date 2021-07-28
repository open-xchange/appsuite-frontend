/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define('io.ox/calendar/actions/change-folder-alarms', [
    'io.ox/backbone/views/modal',
    'io.ox/backbone/mini-views/alarms',
    'gettext!io.ox/calendar',
    'io.ox/core/folder/api'
], function (ModalDialog, AlarmsView, gt, api) {

    'use strict';

    return function (folderData) {

        var alarmsviewDate = new AlarmsView.linkView({ model: new Backbone.Model({ alarms: folderData['com.openexchange.calendar.config'].defaultAlarmDate || [] }) }),
            alarmsviewDateTime = new AlarmsView.linkView({ model: new Backbone.Model({ alarms: folderData['com.openexchange.calendar.config'].defaultAlarmDateTime || [] }) });

        new ModalDialog({
            title: gt('Change reminders')
        })
        .build(function () {
            var descriptionId = _.uniqueId('alarms-dialog-description-');

            this.$el.attr('aria-describedby', descriptionId);

            this.$body.append(
                $('<p>').attr('id', descriptionId).append(
                    //#. %1$s:  is the calendar's name
                    $.txt(gt('Edit all reminders for calendar: %1$s', folderData.display_title || folderData.title))
                ),
                // only fullday appointments in birthday calendar
                (folderData['com.openexchange.calendar.provider'] === 'birthdays' ? '' : $('<fieldset>').append(
                    $('<legend class="confirm-dialog-legend">').text(gt('Default reminder')),
                    alarmsviewDateTime.render().$el
                )),
                $('<fieldset>').append(
                    $('<legend class="confirm-dialog-legend">').text(folderData['com.openexchange.calendar.provider'] === 'birthdays' ? gt('Default reminder for appointments in birthday calendar') : gt('Default reminder for all-day appointments')),
                    alarmsviewDate.render().$el
                )
            );
        })
        .addCancelButton()
        //#. 'Change' as text for an apply button to set a reminder of an appointment alert.
        .addButton({ action: 'ok', label: gt('Change'), className: 'btn-primary' })
        .on('ok', function () {
            if (folderData['com.openexchange.calendar.provider'] === 'birthdays') {
                require(['settings!io.ox/calendar'], function (settings) {
                    settings.set('birthdays/defaultAlarmDate', alarmsviewDate.model.get('alarms')).save();
                });
            }
            api.update(folderData.id, {
                // empty object as first parameter is needed to prevent folderData Object from being changed accidentally
                'com.openexchange.calendar.config': _.extend({}, folderData['com.openexchange.calendar.config'], {
                    defaultAlarmDate: alarmsviewDate.model.get('alarms'),
                    defaultAlarmDateTime: alarmsviewDateTime.model.get('alarms')
                })
            });
        })
        .open();
    };
});
