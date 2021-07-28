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

define('io.ox/switchboard/call/ringtone', ['settings!io.ox/switchboard'], function (settings) {

    'use strict';

    var incoming = new Audio(ox.base + '/apps/io.ox/switchboard/call/ringtones/incoming.mp3');
    // Disabled outgoing tone as we do not have one yet. Maybe we do not need one at all
    // var outgoing = new Audio(ox.base + '/apps/io.ox/switchboard/call/ringtones/outgoing.mp3');
    incoming.volume = 0.3;
    // outgoing.volume = 0.3;

    function useRingtones() {
        return settings.get('call/useRingtones', true);
    }

    return {
        incoming: {
            play: function () {
                if (!useRingtones()) return;
                incoming.play();
            },
            stop: function () {
                incoming.pause();
                incoming.currentTime = 0;
            }
        },
        outgoing: {
            play: function () {
                if (!useRingtones()) return;
                //outgoing.play();
            },
            stop: function () {
                //outgoing.pause();
            }
        }
    };
});
