/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
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

define('io.ox/core/boot/login/saml', [
    'io.ox/core/extensions'
], function (ext) {
    'use strict';

    if (!ox.serverConfig.samlLogin) return;

    function RedirectHandler(options) {
        options = options || {};
        function checkReload(uri) {
            _.defer(function () {
                if (window.location.href !== uri) return;
                window.location.reload();
            });
        }

        _.extend(this, options, {
            id: 'saml_redirect',
            handle: function (baton) {
                var uri = baton.data.redirect_uri;
                if (!uri) return;

                baton.handled = $.Deferred();
                if ((/^http/i).test(uri)) {
                    window.location = uri;
                    checkReload(uri);
                } else {
                    var path = uri[0] === '/' ? '' : '/';
                    path += uri;

                    uri = window.location.protocol + '//' + window.location.host + path;
                    window.location = uri;
                    checkReload(uri);
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
            var params = {
                flow: 'login'
            };
            // decode value from location.hash because it already is encoded and would be encoded again
            // before being sent to the MW (through $.param)
            if (!_.isEmpty(location.hash)) params.uriFragment = decodeURIComponent(location.hash.replace(/^#/, ''));
            return $.get([
                ox.apiRoot,
                samlPath,
                '/init?',
                $.param(params)
            ].join('')).then(function (data) {
                var baton = new ext.Baton({ data: data });
                ext.point('io.ox.saml/login').invoke('handle', baton, baton);
                if (baton.handled && baton.handled.catch) {
                    // silently catch errors
                    return baton.handled.catch(_.noop);
                }
            }, function (jqXHR, textStatus, errorThrown) {
                if (ox.serverConfig.samlLoginErrorRedirect) {
                    _.url.redirect(ox.serverConfig.samlLoginErrorRedirectURL +
                        '#&' + _.serialize({ language: ox.locale, statusCode: jqXHR.status || 'undefined', statusText: textStatus, error: errorThrown }));
                }
            });
        },
        relogin: function () {
            var params = {
                flow: 'relogin'
            };
            // decode value from location.hash because it already is encoded and would be encoded again
            // before being sent to the MW (through $.param)
            if (!_.isEmpty(location.hash)) params.uriFragment = decodeURIComponent(location.hash.replace(/^#/, ''));

            return $.get([
                ox.apiRoot,
                samlPath,
                '/init?',
                $.param(params)
            ].join('')).then(function (data) {
                var baton = new ext.Baton({ data: data });
                ext.point('io.ox.saml/relogin').invoke('handle', baton, baton);
                return $.Deferred();
            });
        }
    });

    var def = $.Deferred();
    ox.once('boot:done', def.resolve);
    def.then(function () {
        return require(['io.ox/core/capabilities']);
    }).then(function (capabilities) {
        if (capabilities.has('saml-single-logout') || ox.serverConfig.samlSingleLogout) {
            ext.point('io.ox/core/logout').extend({
                id: 'saml_logout',
                index: 'last',
                logout: function () {
                    var def = $.Deferred();
                    $.get(ox.apiRoot + samlPath + '/init?flow=logout&session=' + ox.session).done(function (data) {
                        var baton = new ext.Baton({ data: data });
                        ext.point('io.ox.saml/logout').invoke('handle', baton, baton);
                    }).fail(def.reject);
                    return def; // stop all further processing. This is never resolved.
                }
            });
        }
    });

});
