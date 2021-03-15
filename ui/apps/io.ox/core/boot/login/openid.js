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

    function oidcUrlFor(params) {
        return [
            ox.apiRoot,
            ox.serverConfig.oidcPath,
            '/init?',
            $.param(params)
        ].join('');
    }

    function waitForResponse() {
        var def = new $.Deferred();
        function listener(event) {
            if (event.origin !== ox.abs) return;
            ox.session = event.data;
            def.resolve(event.data);
            window.removeEventListener('message', listener);
        }
        window.addEventListener('message', listener, false);
        window.setTimeout(function () {
            window.removeEventListener('message', listener);
            if (def.state() === 'pending') def.reject({ reason: 'timeout' });
        }, 10000);
        return def;
    }

    function silentRelogin() {
        var params = {
            flow: 'login',
            redirect: false,
            client: session.client(),
            version: session.version(),
            uriFragment: '#login_type=propagateSession'
        };
        var url = oidcUrlFor(params);
        var frame = $('<iframe>').appendTo('body');
        return $.ajax(url).then(function (res) {
            var def = $.Deferred();
            frame.one('load', _.debounce(function () {
                // try to fail early
                try {
                    if (frame[0].contentDocument.body.innerHTML.length === 0) def.reject({ reason: 'relogin:failed' });
                } catch (e) {
                    def.reject(e);
                }
            }, 500));
            frame.attr('src', res.redirect);
            waitForResponse()
                .then(def.resolve, def.reject)
                .always(function () {
                    frame.remove();
                });
            return def;
        });
    }

    if (ox.serverConfig.oidcLogin === true) {
        ext.point('io.ox/core/relogin').extend({
            id: 'openid_connect_retry',
            after: 'default',
            render: function () {
                var dialog = this;
                function retry() {
                    silentRelogin().then(function () {
                        if (!dialog || dialog.disposed) return;
                        dialog.trigger('relogin:success');
                        dialog.close();
                    }, function (result) {
                        // bind retry to lifetime of dialog, e.g. 'abortWithSuccess' does close the dialog
                        if (!dialog || dialog.disposed) return;
                        if (result.reason === 'timeout') retry();
                    });
                }

                // retry forever when running into timeout
                retry();
            }
        });
        ext.point('io.ox/core/boot/login').extend({
            id: 'openid_connect',
            after: 'autologin',
            login: function () {
                return openIdConnectLogin({ flow: 'login' });
            },
            relogin: function (baton) {
                return silentRelogin().then(function () {
                    baton.stopPropagation();
                    baton.preventDefault();
                    baton.data.reloginState = 'success';
                    return { reason: 'relogin:success' };
                }, function () {
                    // let some other extension handle this
                    return $.when({ reason: 'relogin:continue' });
                });
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
        if (!_.isEmpty(location.hash)) params.uriFragment = decodeURIComponent(location.hash.replace(/^#/, ''));

        location.href = oidcUrlFor(params);
        // defer "forever", since we are redirecting
        return $.Deferred();
    }

    return openIdConnectLogin;
});
