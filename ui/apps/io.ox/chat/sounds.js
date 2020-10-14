
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

define('io.ox/chat/sounds', ['settings!io.ox/chat'], function (settings) {

    'use strict';
    var soundFile = settings.get('sounds/soundFile', 'bongo1.mp3');
    var sound = new Audio(ox.base + '/apps/io.ox/chat/sounds/' + soundFile);
    return {
        play: _.throttle(function () {
            if (settings.get('sounds/enabled', true) === false) return;
            sound.play();
        }, 1000)
    };
});
