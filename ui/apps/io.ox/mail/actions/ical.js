/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
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

define('io.ox/mail/actions/ical', [
    'settings!io.ox/core',
    'settings!io.ox/calendar',
    'io.ox/core/notifications',
    'gettext!io.ox/mail'
], function (coreSettings, calendarSettings, notifications, gt) {

    'use strict';

    return function (baton) {
        var attachment = _.isArray(baton.data) ? _.first(baton.data) : baton.data;

        require(['io.ox/core/api/conversion']).done(function (conversionAPI) {
            conversionAPI.convert(
                {
                    identifier: 'com.openexchange.mail.ical',
                    args: [
                        { 'com.openexchange.mail.conversion.fullname': attachment.parent.folder_id },
                        { 'com.openexchange.mail.conversion.mailid': attachment.parent.id },
                        { 'com.openexchange.mail.conversion.sequenceid': attachment.id }
                    ]
                },
                {
                    identifier: 'com.openexchange.chronos.ical',
                    args: [
                        { 'com.openexchange.groupware.calendar.folder': calendarSettings.get('chronos/defaultFolderId') },
                        { 'com.openexchange.groupware.task.folder': coreSettings.get('folder/tasks') }
                    ]
                }
            )
            .done(function () {
                notifications.yell('success', gt('The appointment has been added to your calendar'));
            })
            .fail(notifications.yell);
        });
    };
});
