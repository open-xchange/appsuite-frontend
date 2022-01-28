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

define('io.ox/core/tk/iframe', [
    'io.ox/core/http',
    'io.ox/core/notifications',
    'gettext!io.ox/core/tk/iframe'
], function (http, notifications, gt) {

    'use strict';

    function createIframeApp(o) {

        var app = ox.ui.createApp(o);

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

                urlWithOxToken = /[?]/.test(url) ? url + '&ox_token=' + encodeURIComponent(data.token) : url + '?ox_token=' + encodeURIComponent(data.token);

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
