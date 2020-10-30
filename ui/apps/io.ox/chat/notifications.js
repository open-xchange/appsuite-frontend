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
    'io.ox/core/active',
    'io.ox/switchboard/presence',
    'settings!io.ox/chat'
], function (events, isActive, presence, settings) {

    'use strict';
    var sound, current;
    function onMessageNew(e) {
        var model = e.message;
        // debug
        if (ox.debug) console.log('new message', model);
        // don't notify on your own messages
        if (model.isMyself()) return;
        // don't notify if the user is currently active and the UI is not hidden
        if (settings.get('sounds/playWhen') !== 'always' && (isActive() && !settings.get('hidden'))) return;
        // don't notify if busy
        if (presence.getMyAvailability() === 'busy') return;
        // play notification sound
        playSound();
    }
    // load and return audio file
    var getAudio = function (fileName) {
        if (fileName !== current) {
            current = fileName;
            sound = new Audio(ox.base + '/apps/io.ox/chat/sounds/' + fileName);
        }
        return sound;
    };
    // Sound
    var playSound = _.throttle(function () {
        if (!settings.get('sounds/enabled')) return;
        try {
            getAudio(settings.get('sounds/file')).play();
        } catch (e) {
            console.error('Could not play notification sound');
        }
    }, 600);

    // Native notification
    // TBD

    // Look for new messages
    events.on('message:new', onMessageNew);

    // audio preview when changing sounds in settings
    settings.on('change:sounds/file', function () {
        if (_.device('smartphone')) return;
        playSound();
    });
});
