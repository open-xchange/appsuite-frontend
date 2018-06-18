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

    function doDeviceAuth(providerName, deviceId, challengeData, def) {
        switch (providerName) {
            case 'EXAMPLE-MFA':
                require(['io.ox/multifactor/views/exampleProvider'], function (viewer) {
                    viewer.open(providerName, deviceId, challengeData, def);
                });
                break;
            case 'TOTP':
                require(['io.ox/multifactor/views/totpProvider'], function (viewer) {
                    viewer.open(providerName, deviceId, challengeData, def);
                });
                break;
            default:
                def.reject();
        }
    }

    function getAuth(providerName, deviceId, def) {
        api.beginAuth(providerName, deviceId).then(function (data) {
            doDeviceAuth(providerName, deviceId, data, def);
        }, def.reject);
    }

    return {
        getAuth: getAuth
    };

});
