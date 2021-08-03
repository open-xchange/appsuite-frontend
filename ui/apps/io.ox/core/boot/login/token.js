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

define('io.ox/core/boot/login/token', [
    'io.ox/core/boot/util',
    'io.ox/core/extensions',
    'io.ox/core/session',
    'io.ox/core/http'
], function (util, ext, session, http) {

    'use strict';

    ext.point('io.ox/core/boot/login').extend({
        id: 'token',
        index: 200,
        login: function (baton) {
            if (!baton.hash.serverToken || !baton.hash.clientToken) return;
            return tokenLogin(baton.hash)
            .then(function (result) {
                var data = result.data;
                baton.stopPropagation();
                ox.session = data.session;
                // we always have a secret cookie, so autologin should work for this session
                ox.secretCookie = true;

                session.set(data);
                cleanup();
                ox.trigger('login:success', data);
                util.debug('TokenLogin SUCCESS', data);
            }, function () {
                util.debug('TokenLogin login FAILED', baton.hash.session);
            });
        }
    });

    ext.point('io.ox/core/boot/login').extend({
        id: 'sessionToken',
        index: 201,
        login: function (baton) {
            console.log(baton.hash);
            if (!baton.hash.session) return;

            ox.session = baton.hash.session;
            ox.secretCookie = (baton.hash.secretCookie || _.getCookie('secretCookie')) === 'true';

            return whoami(baton.hash)
                .then(function (data) {
                    session.set(data);
                    cleanup();
                    ox.trigger('login:success', data);
                    util.debug('Session-based login SUCCESS', data);
                }, function (data) {
                    util.debug('TokenLogin login FAILED', data);
                    ox.trigger('login:fail:session-based', baton);
                });
        }
    });

    function whoami(hash) {

        if (hash.user && hash.language && hash.user_id && hash.context_id) {
            hash.locale = hash.language;
            return hash;
        }
        return http.GET({
            module: 'system',
            params: { action: 'whoami' }
        });
    }

    function cleanup() {
        _.url.hash({
            context_id: null,
            language: null,
            locale: null,
            login_type: null,
            ref: null,
            secretCookie: null,
            session: null,
            token: null,
            user: null,
            user_id: null,
            jsessionid: null,
            serverToken: null,
            clientToken: null,
            'token.autologin': null
        });
    }

    function tokenLogin(data) {
        return http.POST({
            module: 'login',
            jsessionid: data.jsessionid,
            appendColumns: false,
            appendSession: false,
            processResponse: false,
            data: {
                action: 'tokens',
                client: session.client(),
                version: session.version(),
                serverToken: data.serverToken,
                clientToken: data.clientToken
            }
        });
    }

    return tokenLogin;
});
