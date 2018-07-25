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
            case 'BACKUP_STRING':
                require(['io.ox/multifactor/views/backupProvider'], function (viewer) {
                    viewer.open(providerName, device, challengeData, def, error);
                });
                break;
            default:
                def.reject();
        }
    }

    function getAuth(providerName, device, def, error) {
        api.beginAuth(providerName, device.id).then(function (data) {
            doDeviceAuth(providerName, device, data, def, error);
        }, def.reject);
    }

    return {
        getAuth: getAuth
    };

});
