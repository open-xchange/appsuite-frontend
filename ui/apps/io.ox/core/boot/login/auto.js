/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
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
                    //wait forever (until redirected, that means)
                    return $.Deferred();
                }
                ox.trigger('login:fail', error);
            });
    }

    return autoLogin;
});
