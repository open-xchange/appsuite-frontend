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
            if (def.state() === 'pending') def.reject({ reason: 'timeout', oidc_session_listener: listener });
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
                // default extension registers ok button, but we want a different action, here
                this.off('ok');
                this.on('ok', function () {
                    silentRelogin().then(function success() {
                        dialog.trigger('relogin:success');
                    }, function fail() {
                        dialog.trigger('relogin:continue');
                    });
                });
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
                }, function (result) {
                    if (result.reason === 'timeout') {
                        var point = ext.point('io.ox/core/relogin'),
                            action = point.extend;
                        if (point.has('oidc_waitForSessionPropagation')) action = point.replace;
                        // call with point as context, because it operates on "this"
                        action.call(point, {
                            id: 'oidc_waitForSessionPropagation',
                            index: '200',
                            render: function () {
                                var dialog = this;
                                function listener(event) {
                                    if (event.origin !== ox.abs) return;
                                    ox.session = event.data;
                                    dialog.trigger('relogin:success');
                                    dialog.close();
                                }
                                window.addEventListener('message', listener, false);
                                if (_.isFunction(result.oidc_session_listener)) {
                                    window.removeEventListener('message', result.oidc_session_listener);
                                    delete result.oidc_session_listener;
                                }
                                dialog.on('close', function () {
                                    window.removeEventListener('message', listener);
                                });
                            }
                        });
                    }
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
        if (!_.isEmpty(location.hash)) params.uriFragment = location.hash.replace(/^#/, '');

        location.href = oidcUrlFor(params);
        // defer "forever", since we are redirecting
        return $.Deferred();
    }

    return openIdConnectLogin;
});
