/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define('io.ox/core/tk/iframe', [
    'io.ox/core/http',
    'io.ox/core/notifications',
    'gettext!io.ox/core/tk/iframe'
], function (http, notifications, gt) {

    'use strict';

    function createIframeApp(o) {

        var app = ox.ui.createApp({ name: o.name, title: o.title });

        app.setLauncher(function () {

            var win = ox.ui.createWindow({
                name: o.name,
                chromeless: true
            });

            app.setWindow(win);

            win.setTitle(o.pageTitle);

            if (o.acquireToken) {

                return http.GET({
                    module: 'token',
                    params: {
                        action: 'acquireToken'
                    }
                }).done(function (data) {
                    if (data && data.token) {
                        initWindowAndShow(win, data);
                    } else {
                        notifications.yell('error', gt('An error occurred. There is no valid token available.'));
                        initWindowAndShow(win, data);
                    }
                });
            }
            initWindowAndShow(win);

        });

        function initWindowAndShow(win, data) {
            var url = o.url,
                iframe =   $('<iframe>', { src: url, frameborder: 0 }),
                urlWithOxToken;
            iframe.css({
                width: '100%',
                height: '100%'
            });

            win.nodes.main.append(iframe);

            if (data && data.token) {

                urlWithOxToken = /[?]/.test(url) ? url + '&ox_token=' + data.token : url + '?ox_token=' + data.token;

                iframe.attr('src', urlWithOxToken);
            }

            win.show();
        }

        return {
            getApp: app.getInstance
        };
    }

    return createIframeApp;

});
