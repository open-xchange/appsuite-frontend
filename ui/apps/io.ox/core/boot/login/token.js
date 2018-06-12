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
            if (!baton.hash.tokenSession && !baton.hash.session) return;
            return tokenLogin().then(function () {
                baton.stopPropagation();
                ox.trigger('login:success');
            }, function () {
                ox.trigger('login:fail');
            });
        }
    });

    var hash = {};

    function tokenLogin() {

        hash = _.url.hash();

        if (hash.tokenSession) {

            util.debug('Token-based login ...', hash.tokenSession);

            return session.redeemToken(hash.tokenSession).then(
                success,
                function fail(e) {
                    util.debug('Token-based FAIL', e);
                }
            );

        }

        util.debug('Session-based login ...', hash.session);
        return success({ session: hash.session });
    }

    function success(data) {

        ox.session = data.session;
        ox.secretCookie = hash.secretCookie === 'true';

        // set store cookie?
        return $.when(
            session.rampup(),
            hash.store === 'true' ? session.store() : $.when()
        )
        .always(function () {
            // fetch user config
            return config.user().then(whoami);
        });
    }

    function whoami() {

        if (hash.user && hash.language && hash.user_id && hash.context_id) {
            hash.locale = hash.language;
            finalize(hash);
        } else {
            return http.GET({
                module: 'system',
                params: { action: 'whoami' }
            })
            .then(finalize);
        }
    }

    function finalize(data) {

        util.debug('Token/session-based login DONE', data);

        // store login data (cause we have all valid languages now)
        session.set({
            locale: data.locale,
            session: data.session,
            user: data.user,
            user_id: parseInt(data.user_id, 10) || 0,
            context_id: data.context_id
        });

        // cleanup url
        _.url.hash({
            context_id: null,
            language: null,
            login_type: null,
            ref: null,
            secretCookie: null,
            session: null,
            store: null,
            token: null,
            user: null,
            user_id: null
        });
    }

    return tokenLogin;
});
