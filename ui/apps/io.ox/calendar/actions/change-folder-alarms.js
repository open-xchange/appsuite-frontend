/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2018 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
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
            focus: _.device('smartphone') ? '' : '[data-property="comment"]',
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
        .addAlternativeButton({ action: 'cancel', label: gt('Cancel') })
        .addButton({ action: 'ok', label: gt('Ok'), className: 'btn-primary' })
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
