/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2020 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Alexander Quast <alexander.quast@open-xchange.com>
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
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
