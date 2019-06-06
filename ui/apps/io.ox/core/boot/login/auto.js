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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/boot/login/auto', [
    'io.ox/core/boot/util',
    'io.ox/core/boot/config',
    'io.ox/core/session',
    'io.ox/core/extensions'
], function (util, config, session, ext) {

    'use strict';

    ext.point('io.ox/core/boot/login').extend({
        id: 'autologin',
        index: 400,
        login: function () {
            return autoLogin().then(_.identity, function () {
                // catch the error and normally resume in the pipeline
                // error should have been handled by 'login:fail' error handlers
                return $.Deferred().resolve();
            });
        }
    });

    function autoLogin() {
        util.debug('Auto login ...');

        // try auto login!?
        return session.autoLogin()
            .then(function (data) {
                // log
                util.debug('Auto login DONE.', data);
                // now we're sure the server is up
                ox.trigger('server:up');
                // set user language - see bug #31433
                ox.locale = data.locale;
                _.setCookie('locale', ox.locale);
                // event
                ox.trigger('login:success', data);
            }, function failAutoLogin(error) {
                // log
                util.debug('Auto login FAIL', error);
                // special autologin error handling. redirect user to an
                // external page defined in the error params
                if (error && error.code === 'LGI-0016' && (error.error_params || []).length === 1) {
                    _.url.redirect(error.error_params[0]);
                } else {
                    ox.trigger('login:fail', error);
                }
            });
    }

    return autoLogin;
});
