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

define('io.ox/calendar/actions/edit', [
    'io.ox/calendar/edit/main',
    'io.ox/calendar/util'
], function (m, util) {

    'use strict';

    return function (data) {
        // allow editing the series on last occurrence. This allows people to prolong the series by changing the rrule
        util.showRecurrenceDialog(data, { allowEditOnLastOccurence: true }).done(function (action) {
            if (action === 'cancel') return;

            if (m.reuse('edit', data, { action: action })) return;
            m.getApp().launch().done(function () {
                this.edit(data, { action: action });
            });
        });
    };
});
