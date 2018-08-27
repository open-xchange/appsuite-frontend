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
        notifyFailure((message instanceof String) ? message : message.value);
        window.setTimeout(function () {
            def.reject();
        }, 10000);
    }

    function notifyFailure(message) {
        require(['io.ox/core/notifications'], function (notify) {
            notify.yell('error', message);
            $('#io-ox-core').show();  // May be hidden in login
        });
    }

    function handleLost(def, error) {
        api.getDevices(true).then(function (devices) {
            if (devices.length === 0) {
                failBackup(def, gt('There are no backup devices available for this account.  Please notify support for help.'));
                return;
            }
            var device = devices[0];
            var authDef = $.Deferred();
            deviceAuthenticator.getAuth(device.provider.name, device, authDef, error);
            authDef.then(function (data) {
                if (data) {
                    data.backup = true;  // mark this as a backup / lost action
                    def.resolve(data);
                }
                failBackup(def, gt('Authentication failure.  Please reload browser and try again.'));
            }, function (fail) {
                failBackup(def, fail);
            });
        });
    }

    return handleLost;
});

