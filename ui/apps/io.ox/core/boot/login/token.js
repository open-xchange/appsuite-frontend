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

define('io.ox/core/boot/login/token', [
    'io.ox/core/boot/util',
    'io.ox/core/boot/config',
    'io.ox/core/extensions',
    'io.ox/core/session',
    'io.ox/core/http'
], function (util, config, ext, session, http) {

    'use strict';

    ext.point('io.ox/core/boot/login').extend({
        id: 'token',
        index: 200,
        login: function (baton) {
            if (!baton.hash.serverToken && !baton.hash.clientToken) return;
            return tokenLogin(baton.hash)
            .then(function (result) {
                var data = result.data;
                baton.stopPropagation();
                ox.session = data.session;
                // we always have a secret cookie, so autologin should work for this session
                ox.secretCookie = true;

                session.set(data);
                // cleanup url
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
                ox.trigger('login:success', data);

                util.debug('Session-based login SUCCESS', data);
            }, function () {
                util.debug('Session-based login FAILED', baton.hash.session);
                ox.trigger('login:fail:session-based', baton);
            });
        }
    });

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
