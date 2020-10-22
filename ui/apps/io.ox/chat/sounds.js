
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

define('io.ox/chat/sounds', [
    'io.ox/chat/events',
    'io.ox/chat/data'
], function (events, chatData) {

    'use strict';

    chatData.session.initialized.then(function () {
        var soundFile = chatData.userSettings.get('soundFile') || 'bongo1.mp3';
        var sound = new Audio(ox.base + '/apps/io.ox/chat/sounds/' + soundFile);
        var play = _.throttle(function () {
            if (chatData.userSettings.get('soundEnabled') === false) return;
            sound.play();
        }, 600);
        events.on('sound:play:incoming', play);
    });
});
