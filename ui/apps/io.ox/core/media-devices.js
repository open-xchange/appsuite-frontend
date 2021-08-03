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

define('io.ox/core/media-devices', [
    'gettext!io.ox/core'
], function (gt) {

    'use strict';

    var MESSAGES = {
        'unavailable': gt('There are currently no compatible media devices available on your device.'),
        'permission-denied': gt('Access to your media devices has been denied. Please refer to your browser help pages for how to reset authorization.'),
        // https://sites.google.com/a/chromium.org/dev/Home/chromium-security/deprecating-powerful-features-on-insecure-origins
        'non-secure': gt('This feature isn\'t available for non-secure connections.')
    };

    var isDeprecatedAPI = !navigator.mediaDevices,
        typeCounter = {};

    function enumerateDevices() {
        // use jquery deferred instead of native promise for convenience
        var def = $.Deferred();
        navigator.mediaDevices.enumerateDevices().then(def.resolve, def.reject);
        return def;
    }

    function getLabel(device) {
        typeCounter[device.kind] = (typeCounter[device.kind] || 0) + 1;
        //#. %1$s a natural number
        if (device.kind === 'audioinput') return gt('Microphone %1$s', typeCounter[device.kind]);
        //#. %1$s a natural number
        if (device.kind === 'videoinput') return gt('Camera %1$s', typeCounter[device.kind]);
        //#. %1$s a natural number
        //#. This text is used to describe an unknown device (camera / microphone etc)
        return gt('Unknown %1$s', typeCounter[device.kind]);
    }

    return {

        isSupported: function () {
            return !isDeprecatedAPI;
        },

        getDevices: function (type) {

            if (isDeprecatedAPI) return $.Deferred().reject({ type: 'Unsupported', message: gt('Unfortunately your browser doesn\'t support listing available media devices.') });

            // https://developer.mozilla.org/en-US/docs/Web/API/MediaDeviceInfo
            return enumerateDevices().then(function (devices) {
                // reset for label fallback
                typeCounter = {};
                return _.chain(devices)
                        .map(function (device) {
                            if (type && device.kind.indexOf(type) !== 0) return;
                            return {
                                id: device.deviceId,
                                value: device.deviceId,
                                // on missing permission label is empty
                                label: device.label || getLabel(device),
                                type: device.kind.replace('input', ''),
                                physicalDevice: device.groupId
                            };
                        })
                        .compact()
                        .value();
            });
        },

        getStream: function (constraints) {
            // use jquery deferred instead of native promise for convenience
            var def = $.Deferred();

            function onError(e) {
                var message = e.message;
                // more explanatory custom messages
                if (/^(PermissionDeniedError|Permission denied|NotAllowedError)$/.test(e.name || e.message)) message = MESSAGES['permission-denied'];
                if (/(DevicesNotFoundError)$/.test(e.name || e.message)) message = MESSAGES.unavailable;
                if (/(secure origins)/.test(e.message)) message = MESSAGES['non-secure'];

                def.reject({ type: e.name, message: message, original_message: e.message });
            }

            try {
                // https://developer.mozilla.org/en-US/docs/Web/API/MediaStream
                if (isDeprecatedAPI) {
                    navigator.getUserMedia(constraints, def.resolve.bind(def), onError);
                } else {
                    navigator.mediaDevices.getUserMedia(constraints).then(def.resolve, onError);
                }
            } catch (e) {
                onError(e);
            }

            return def.promise();
        }
    };
});
