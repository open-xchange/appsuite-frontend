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
    'io.ox/multifactor/api'
], function (api) {
    'use strict';

    var lastDev, count, lastData;

    function doDeviceAuth(providerName, device, challengeData, def, error) {
        switch (providerName) {
            case 'EXAMPLE-MFA':
                require(['io.ox/multifactor/views/exampleProvider'], function (viewer) {
                    viewer.open(providerName, device, challengeData, def, error);
                });
                break;
            case 'TOTP':
                require(['io.ox/multifactor/views/totpProvider'], function (viewer) {
                    viewer.open(providerName, device, challengeData, def, error);
                });
                break;
            case 'SMS':
                require(['io.ox/multifactor/views/smsProvider'], function (viewer) {
                    viewer.open(providerName, device, challengeData, def, error);
                });
                break;
            case 'U2F':
                require(['io.ox/multifactor/views/u2fProvider'], function (viewer) {
                    viewer.open(providerName, device, challengeData, def, error);
                });
                break;
            case 'WEB-AUTH':
                require(['io.ox/multifactor/views/webAuthProvider'], function (viewer) {
                    viewer.open(providerName, device, challengeData, def, error);
                });
                break;
            case 'BACKUP_STRING':
                require(['io.ox/multifactor/views/backupProvider'], function (viewer) {
                    viewer.open(providerName, device, challengeData, def, error);
                });
                break;
            default:
                def.reject();
        }
    }

    // Determine if a new code should be sent.
    function checkNew(error, providerName, device) {
        if (providerName !== 'SMS') {  // At this time, only applies to SMS
            return true;
        }
        if (!error) {
            lastDev = device;
            count = 0;
            return true;
        }
        if (device.id === lastDev.id) {
            count++;
            if (count < 3) return false;  // Give them a couple attempts, then start anew
        }
        lastDev = device;
        count = 0;
        return true;
    }

    function getAuth(providerName, device, def, error) {
        if (checkNew(error, providerName, device)) {  // Check if new code should be sent
            api.beginAuth(providerName, device.id).then(function (data) {
                lastData = data;
                doDeviceAuth(providerName, device, data, def, error);
            }, def.reject);
        } else {
            error.repeat = true;
            doDeviceAuth(providerName, device, lastData, def, error);
        }

    }

    return {
        getAuth: getAuth
    };

});
