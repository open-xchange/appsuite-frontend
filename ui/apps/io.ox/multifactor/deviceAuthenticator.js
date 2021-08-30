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

define('io.ox/multifactor/deviceAuthenticator', [
    'io.ox/multifactor/api',
    'io.ox/core/extensions',
    'io.ox/multifactor/views/constants'
], function (api, ext, constants) {
    'use strict';

    var lastDev, count, lastData;

    function doDeviceAuth(data, authInfo) {
        var challengeData = data.challenge;
        switch (authInfo.providerName) {
            case constants.TOTP:
                require(['io.ox/multifactor/views/totpProvider'], function (viewer) {
                    viewer.open(challengeData, authInfo);
                });
                break;
            case constants.SMS:
                require(['io.ox/multifactor/views/smsProvider'], function (viewer) {
                    viewer.open(challengeData, authInfo);
                });
                break;
            case constants.U2F:
                require(['io.ox/multifactor/views/u2fProvider'], function (viewer) {
                    viewer.open(challengeData, authInfo);
                });
                break;
            case 'WEB-AUTH':
                require(['io.ox/multifactor/views/webAuthProvider'], function (viewer) {
                    viewer.open(challengeData, authInfo);
                });
                break;
            case constants.BACKUP:
                require(['io.ox/multifactor/views/backupProvider'], function (viewer) {
                    viewer.open(challengeData, authInfo);
                });
                break;
            default:
                var baton = new ext.Baton({ data: { challengeData: challengeData, authInfo: authInfo } });
                var point = ext.point('io.ox/multifactor/device/' + authInfo.providerName).invoke('auth', this, baton);
                if (!point.any()) authInfo.def.reject();
        }
    }

    // Determine if a new code should be sent.
    function checkNew(authInfo) {
        if (authInfo.providerName !== constants.SMS) {  // At this time, only applies to SMS
            return true;
        }
        if (!authInfo.error) {
            lastDev = authInfo.device;
            count = 0;
            return true;
        }
        if (authInfo.device.id === lastDev.id) {
            count++;
            if (count < 3) return false;  // Give them a couple attempts, then start anew
        }
        lastDev = authInfo.device;
        count = 0;
        return true;
    }

    function getAuth(authInfo) {
        if (checkNew(authInfo)) {  // Check if new code should be sent
            api.beginAuth(authInfo.providerName, authInfo.device.id).then(function (data) {
                lastData = data;
                doDeviceAuth(data, authInfo);
            }, authInfo.def.reject);
        } else {
            authInfo.error.repeat = true;
            doDeviceAuth(lastData, authInfo);
        }

    }

    return {
        getAuth: getAuth
    };

});
