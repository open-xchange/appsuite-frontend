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
 */

define('io.ox/chat/notifications', [
    'io.ox/chat/events',
    'io.ox/chat/data',
    'io.ox/core/active',
    'io.ox/switchboard/presence',
    'settings!io.ox/chat'
], function (events, data, isActive, presence, settings) {

    'use strict';

    function onMessageNew(e) {
        var model = e.message;
        // debug
        if (ox.debug) console.log('new message', model);
        // don't notify on your own messages
        if (model.isMyself()) return;
        // don't notify if the user is currently active and the UI is not hidden
        if (isActive() && !settings.get('hidden')) return;
        // don't notify if busy
        if (presence.getMyAvailability() === 'busy') return;
        // play notification sound
        playSound();
    }

    // Sound
    var playSound = _.throttle((function () {
        var sound, file;
        return function () {
            if (data.userSettings.get('soundEnabled') === false) return;
            if (!sound) {
                file = data.userSettings.get('soundFile') || 'bongo1.mp3';
                sound = new Audio(ox.base + '/apps/io.ox/chat/sounds/' + file);
            }
            sound.play();
        };
    })(), 600);

    // Native notification
    // TBD

    // Look for new messages
    data.session.initialized.then(function () {
        events.on('message:new', onMessageNew);
    });
});
