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
    'io.ox/multifactor/deviceAuthenticator',
    'gettext!io.ox/core/boot'
], function (api, deviceAuthenticator, gt) {

    'use strict';

    function failBackup(def, message) {
        notifyFailure(message.value ? message.value : message);
        window.setTimeout(function () {
            def.reject();
        }, 10000);
    }

    function notifyFailure(message) {
        require(['io.ox/core/notifications'], function (notify) {
            $(document.body).append(notify.yell('error', message));  // append to document body rather than core
        });
    }

    function handleLost(authInfo) {
        api.getDevices('BACKUP').then(function (devices) {
            if (devices.length === 0) {
                failBackup(authInfo.def, gt('There are no backup devices available for this account. Please notify support for help.'));
                return;
            }
            var device = devices[0];
            var authDef = $.Deferred();
            authInfo.providerName = device.providerName;
            authInfo.device = device;
            deviceAuthenticator.getAuth(authInfo);
            authDef.then(function (data) {
                if (data) {
                    data.backup = true;  // mark this as a backup / lost action
                    authInfo.def.resolve(data);
                    return;
                }
                failBackup(authInfo.def, gt('Authentication failure. Please reload browser and try again.'));
            }, function (fail) {
                failBackup(authInfo.def, fail);
            });
        });
    }

    return handleLost;
});

