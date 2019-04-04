/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * @author Greg Hill <greg.hill@open-xchange.com>
 *
 * Copyright (C) 2016-2020 OX Software GmbH
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
