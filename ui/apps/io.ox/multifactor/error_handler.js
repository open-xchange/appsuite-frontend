/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2018 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

define('io.ox/multifactor/error_handler', [
], function () {

    'use strict';

    ox.on('http:error:MFA-0001 http:error:MFA-0015', function (err) {
        //do not yell
        err.handled = true;
        ox.trigger('offline');
        require(['io.ox/multifactor/auth'], function (auth) {
            auth.doAuthentication().then(function () {
                // TODO: retry the failing request
                // (should be provided as parameter to the error handler)

                ox.trigger('online');
            }, function () {
                if ((/^MFA-0001/i).test(err.code)) {
                    console.error('MF login failed, reload required');
                    ox.session = '';
                    ox.relogin();
                    location.reload();

                    return;
                }
                ox.trigger('online');
            });
        });
        return;
    });
});
