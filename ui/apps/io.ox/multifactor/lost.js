/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Greg Hill <greg.hill@open-xchange.com>
 */

define('io.ox/multifactor/lost', [
    'io.ox/multifactor/api',
    'io.ox/multifactor/deviceAuthenticator'
], function (api, deviceAuthenticator) {

    'use strict';

    function failBackup(def) {
        alert('fail');
        def.reject();
    }

    function handleLost(def) {
        api.getDevices(true).then(function (devices) {
            if (devices.length === 0) {
                failBackup(def);
                return;
            }
            var device = devices[0];
            var authDef = $.Deferred();
            deviceAuthenticator.getAuth(device.provider.name, device.id, authDef);
            authDef.then(function (data) {
                if (data) {
                    api.doAuth(data.provider, data.id, data.response).then(function (data) {
                        def.resolve(data);
                    }, function (fail) {
                        failBackup(def, fail);
                    });
                    return;
                }
                failBackup(def);
            }, function (fail) {
                failBackup(def, fail);
            });
        });
    }

    return handleLost;
});

