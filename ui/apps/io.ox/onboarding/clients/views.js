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

define('io.ox/onboarding/clients/views', [
    'io.ox/onboarding/clients/extensions',
    'io.ox/core/extensions'
], function (extensions, ext) {

    'use strict';

    var POINT = 'io.ox/onboarding/clients/views',
        views = {
            list: function (data) {
                var view = new extensions.ActionsListView(data);
                this.append(view.render().$el);
            },
            download: function (action, baton) {
                var view = new extensions.DownloadActionView(action, { baton: baton });
                this.append(view.render().$el);
            },
            shortmessage: function (action, baton) {
                var view = new extensions.ShortMessageActionView(action, { baton: baton });
                this.append(view.render().$el);
            },
            email: function (action, baton) {
                var view = new extensions.EmailActionView(action, { baton: baton });
                this.append(view.render().$el);
            },
            display: function (action, baton) {
                var view = new extensions.DisplayActionView(action, { baton: baton });
                this.append(view.render().$el);
            },
            client: function (action, baton) {
                var view = new extensions.ClientActionView(action, { baton: baton });
                this.append(view.render().$el);
            }
        };

    // actions list view
    ext.point(POINT).extend({ draw: views.list });

    // config
    ext.point(POINT + '/download').extend({ draw: views.download });
    ext.point(POINT + '/email').extend({ draw: views.email });
    ext.point(POINT + '/sms').extend({ draw: views.shortmessage });
    // display: generic
    ext.point(POINT + '/display').extend({ draw: views.display });
    // client download: generic
    ext.point(POINT + '/link').extend({ draw: views.client });

    return views;

});
