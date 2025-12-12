/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define('com.spamexperts/settings/register', [
    'io.ox/core/extensions',
    'io.ox/core/http',
    'gettext!com.spamexperts/translations',
    'settings!com.spamexperts'
], function (ext, http, gt, settings) {
    'use strict';

    ext.point('io.ox/settings/pane/main/io.ox/mail').extend({
        id: 'com.spamexperts',
        title: settings.get('name'),
        ref: 'com.spamexperts',
        loadSettingPane: false,
        index: 'last'
    });

    ext.point('com.spamexperts/settings/detail').extend({
        draw: function () {
            var self = this;

            http.GET({
                module: 'spamexperts/panel',
                params: {
                    action: 'generate_panel_session',
                    version: 7
                }
            }).done(function (data) {
                $('<iframe>', {
                    src: data.panel_web_ui_url + data.panel_session,
                    frameborder: 0
                }).css({
                    position: 'absolute',
                    width: '100%',
                    minHeight: '100%',
                    top: '50px'
                }).appendTo(self);

                $('<a>', {
                    href: data.panel_web_ui_url + data.panel_session,
                    target: '_blank'
                }).css({
                }).text(gt('If panel does not appear below, click here to open it in a new window'))
                .appendTo(self);
            });


        }
    });
});
