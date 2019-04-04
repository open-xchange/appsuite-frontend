/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

define('io.ox/core/boot/login/openid', [
    'io.ox/core/boot/util',
    'io.ox/core/session',
    'io.ox/core/extensions'
], function (util, session, ext) {
    'use strict';

    ext.point('io.ox/core/logout').extend({
        id: 'OIDC',
        index: 'last',
        logout: function () {
            var def = $.Deferred();
            if (ox.serverConfig.oidcLogin !== true) return def.resolve();
            location.href = [
                ox.apiRoot,
                ox.serverConfig.oidcPath,
                '/init?',
                $.param({
                    flow: 'logout',
                    redirect: true,
                    client: session.client(),
                    version: session.version(),
                    deeplink: window.location.href,
                    session: ox.session
                })
            ].join('');
            return def;
        }
    });

    if (ox.serverConfig.oidcLogin === true) {
        ext.point('io.ox/core/boot/login').extend({
            id: 'openid_connect',
            after: 'autologin',
            login: function () {
                return openIdConnectLogin({ flow: 'login' });
            },
            relogin: function () {
                return openIdConnectLogin({ flow: 'login' });
            }
        });
    }

    function openIdConnectLogin(options) {
        util.debug('Open ID Login ...');
        options = _.extend({
            flow: 'login'
        }, options);
        var params = {
            flow: options.flow,
            redirect: true,
            client: session.client(),
            version: session.version()
        };
        if (!_.isEmpty(location.hash)) params.hash = location.hash;

        location.href = [
            ox.apiRoot,
            ox.serverConfig.oidcPath,
            '/init?',
            $.param(params)
        ].join('');
        // defer "forever", since we are redirecting
        return $.Deferred();
    }

    return openIdConnectLogin;
});
