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

define('io.ox/calendar/settings/defaults', function () {

    'use strict';

    var settingsDefaults = {
        interval: 30,
        startTime: 8,
        endTime: 18,
        defaultReminder: 15,
        viewView: 'week:workweek',
        showDeclinedAppointments: true,
        markFulltimeAppointmentsAsFree: false,
        notifyNewModifiedDeleted: true,
        notifyAcceptedDeclinedAsCreator: false,
        notifyAcceptedDeclinedAsParticipant: false,
        deleteInvitationMailAfterAction: true,
        numDaysWorkweek: 5,
        workweekStart: 1, // 0 = sunday, 1 = monday ...
        showPastReminders: true
    };

    return settingsDefaults;
});
