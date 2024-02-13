/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
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

define('io.ox/core/tk/sounds-util', [
    'io.ox/core/extensions',
    'gettext!plugins/notifications',
    'settings!io.ox/mail'
], function (ext, gt, settings) {

    'use strict';

    var SOUND_VOLUME = 0.3, // volume of push notification sound
        path = ox.base + '/apps/themes/default/sounds/', // soundfiles are located in the theme
        sound,
        type = _.device('!windows && !macos && !ios && !android') ? '.ogg' : '.mp3', // linux frickel uses ogg
        soundList = [
            { label: gt('Bell'), value: 'bell' },
            { label: gt('Marimba'), value: 'marimba' },
            { label: gt('Wood'), value: 'wood' },
            { label: gt('Chimes'), value: 'chimes' }
        ];

    // load a soundfile
    function loadSound(sound) {
        var d = $.Deferred();
        // make sure, that sound is one of the values in sound list (see Bug 51473)
        sound = _(soundList).find({ value: sound }) ? sound : 'bell';
        sound = new Audio(path + sound + type);
        sound.volume = SOUND_VOLUME;
        sound.addEventListener('canplaythrough', function () {
            d.resolve(sound);
        });
        return d;
    }

    // ensure we do not play a sound twice until the first sound has finished
    var playSound = _.throttle(function () {
        if (_.device('smartphone')) return;
        if (sound) {
            try {
                sound.play();
            } catch (error) {
                console.error(error);
            }
        }
    }, 2000);

    settings.on('change:notificationSoundName', function () {
        if (_.device('smartphone')) return;
        var s = settings.get('notificationSoundName');
        loadSound(s).done(function (s) {
            // preview the selected sound by playing it on change
            if (s) {
                try {
                    s.play();
                } catch (e) {
                    console.error('Error playing sound', e);
                }
                sound = s;
            }
        });
    });

    // get and load stored sound
    if (_.device('!smartphone')) {
        loadSound(settings.get('notificationSoundName')).done(function (s) {
            sound = s;
        });
    }

    // TODO too mail specific, either a general aproach or a second setting for events has to be introduced. tbd
    ext.point('io.ox/mail/settings/detail/view').extend({
        index: 250,
        id: 'sounds_extend',
        render: function () {
            // just publish the array
            this.getSoundOptions = function () {
                return soundList;
            };
        }
    });

    return {
        playSound: playSound
    };
});
