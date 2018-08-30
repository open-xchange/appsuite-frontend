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
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

define('io.ox.saml/login/register', ['io.ox/core/extensions'], function (ext) {
    'use strict';

    if (!ox.serverConfig.samlLogin) return;

    function RedirectHandler(options) {
        options = options || {};

        _.extend(this, options, {
            id: 'saml_redirect',
            handle: function (baton) {
                var uri = baton.data.redirect_uri;
                if (uri) {
                    baton.handled = $.Deferred();
                    if ((/^http/i).test(uri)) {
                        window.location = uri;
                        _.defer(function () {
                            if (window.location.href !== uri) return;
                            window.location.reload();
                        });
                    } else {
                        var path = '';
                        if (uri.indexOf('/') === 0) {
                            path = uri;
                        } else {
                            path = '/' + uri;
                        }

                        var proto = window.location.protocol,
                            host = window.location.host;
                        uri = proto + '//' + host + path;
                        window.location = uri;
                        _.defer(function () {
                            if (window.location.href !== uri) return;
                            window.location.reload();
                        });
                    }
                }
            }
        });
    }

    ext.point('io.ox.saml/relogin').extend(new RedirectHandler());
    ext.point('io.ox.saml/logout').extend(new RedirectHandler());
    ext.point('io.ox.saml/login').extend(new RedirectHandler());

    //we want to handle session based errors ourselves
    ox.off('login:fail:session-based');

    var samlPath = '/saml';
    if (ox.serverConfig.samlPath) {
        samlPath = '/saml/' + ox.serverConfig.samlPath;
    }

    ext.point('io.ox/core/boot/login').extend({
        id: 'saml',
        after: 'autologin',
        login: function () {
            var def = $.when();
            def = $.Deferred();
            $.get(ox.apiRoot + samlPath + '/init?flow=login').done(function (data) {
                var baton = new ext.Baton({ data: data });
                ext.point('io.ox.saml/login').invoke('handle', baton, baton);
                if (baton.handled && baton.handled.always) {
                    baton.handled.always(def.resolve);
                } else {
                    def.resolve();
                }
            }).fail(function (jqXHR, textStatus, errorThrown) {
                if (ox.serverConfig.samlLoginErrorRedirect) {
                    _.url.redirect(ox.serverConfig.samlLoginErrorRedirectURL +
                        '#&' + _.serialize({ language: ox.language, statusCode: jqXHR.status || 'undefined', statusText: textStatus, error: errorThrown }));
                } else {
                    def.resolve();
                }
            });
            if (ox.serverConfig.samlLoginErrorPage === true) {
                setTimeout(function () {
                    ox.trigger('server:down');
                    $('body').addClass('down');
                    $('#io-ox-login-container').empty().append(
                        $('<div class="alert alert-info">').append(
                            $('<div><b>Connection error</b></div> The service is not available right now. <a href="#">Retry</a>')
                        )
                        .on('click', function (e) { e.preventDefault(); location.reload(); })
                    );
                    $('#background-loader').fadeOut(250);
                    console.warn('Server is down.');
                }, 250);
            }
            return def;
        }
    });

    var def = ox.once('boot:done', def.resolve);
    def.then(function () {
        return require(['io.ox/core/capabilities']);
    }).then(function (caps) {
        ox.on('relogin:required', function () {
            return $.get(ox.apiRoot + samlPath + '/init?flow=relogin').done(function (data) {
                var baton = new ext.Baton({ data: data });
                ext.point('io.ox.saml/relogin').invoke('handle', baton, baton);
            });
        });

        if (caps.has('saml-single-logout') || ox.serverConfig.samlSingleLogout) {
            ext.point('io.ox/core/logout').extend({
                id: 'saml_logout',
                index: 'last',
                logout: function () {
                    var def = $.Deferred();
                    $.get(ox.apiRoot + samlPath + '/init?flow=logout&session=' + ox.session).done(function (data) {
                        var baton = new ext.Baton({ data: data });
                        ext.point('io.ox.saml/logout').invoke('handle', baton, baton);
                    }).fail(def.reject);
                    return def; // Hack to stop all further processing. This is never resolved.
                }
            });
        }
    });

});
