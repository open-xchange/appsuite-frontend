/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/boot/login/auto', [
    'io.ox/core/boot/util',
    'io.ox/core/boot/config',
    'io.ox/core/session'
], function (util, config, session) {

    'use strict';

    return function autoLogin() {

        util.debug('Auto login ...');

        // try auto login!?
        return session.autoLogin()
            .then(function (data) {
                // log
                util.debug('Auto login DONE.', data);
                // now we're sure the server is up
                ox.trigger('server:up');
                // set user language - see bug #31433
                ox.language = data.locale;
                _.setCookie('language', ox.language);
                // event
                ox.trigger('login:success', data);
            })
            .fail(function (error) {
                // log
                util.debug('Auto login FAIL', error);
                // special autologin error handling. redirect user to an
                // external page defined in the error params
                if (error && error.code === 'LGI-0016' && (error.error_params || []).length === 1) {
                    window.location.href = error.error_params[0];
                } else {
                    ox.trigger('login:fail', error);
                }
            });
    };
});
