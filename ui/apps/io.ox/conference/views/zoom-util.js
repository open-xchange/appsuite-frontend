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

define('io.ox/conference/views/zoom-util', [
    'settings!io.ox/switchboard',
    'gettext!io.ox/switchboard'
], function (settings, gt) {

    'use strict';

    var filterCountry = settings.get('zoom/dialin/filterCountry', '');

    return {
        getMeetingDescription: function (meeting) {
            var dialinNumbers = _(meeting.settings.global_dial_in_numbers).filter(function (dialin) {
                if (!filterCountry) return true;
                return filterCountry === dialin.country;
            });
            var description = gt('Join Zoom meeting') + ': ' + meeting.join_url + '\n';
            if (meeting.password) {
            //#. %1$s contains a password
                description += gt('Meeting password: %1$s', meeting.password) + '\n';
            }
            if (dialinNumbers.length) {
                var meetingId = String(meeting.id).replace(/^(\d{3})(\d{4})(\d+)$/, '$1 $2 $3');
                var passcode = meeting.h323_password;
                var onetap = dialinNumbers[0].number + ',,' + meeting.id + '#,,,,,,0#' + (passcode ? ',,' + passcode + '#' : '');
                description += '\n' +
                //#. Zoom offers a special number to automatically provide the meeting ID and passcode
                //#. German: "Schnelleinwahl mobil"
                //#. %1$s is the country, %2$s contains the number
                gt('One tap mobile (%1$s): %2$s', dialinNumbers[0].country_name, onetap) + '\n\n' +
                //#. %1$s contains a numeric zoom meeting ID
                gt('Meeting-ID: %1$s', meetingId) + '\n' +
                //#. %1$s contains a numeric dialin passcode
                (passcode ? gt('Dial-in passcode: %1$d', passcode) + '\n' : '') +
                '\n' +
                gt('Dial by your location') + '\n' +
                dialinNumbers.map(function (dialin) {
                    return '    ' + dialin.country_name + (dialin.city ? ' (' + dialin.city + ')' : '') + ': ' + dialin.number;
                })
                .join('\n') + '\n';
            }
            return description;
        }
    };
});
