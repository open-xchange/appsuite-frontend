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

define('plugins/portal/contacts/register', [
    'io.ox/core/extensions',
    'io.ox/contacts/api',
    'io.ox/portal/widgets'
], function (ext, api, portalWidgets) {

    'use strict';

    ext.point('io.ox/portal/widget/stickycontact').extend({

        // helps at reverse lookup
        type: 'contacts',

        load: function (baton) {
            var props = baton.model.get('props') || {};
            return api.get({ folder: props.folder_id, id: props.id }).then(function (data) {
                baton.data = data;
            }, function (e) {
                throw e.code === 'CON-0125' ? 'remove' : e;
            });
        },

        preview: function (baton) {
            api.on('delete', function (event, element) {
                if (element.id === baton.data.id && element.folder_id === baton.data.folder_id) {
                    var widgetCol = portalWidgets.getCollection();
                    widgetCol.remove(baton.model);
                }
            });

            var list = baton.data.distribution_list || [], content = $('<ul class="content pointer list-unstyled">');

            _(list).each(function (obj) {
                content.append(
                    $('<li class="paragraph">').append(
                        $('<div class="bold">').text(obj.display_name),
                        $('<div class="accent">').text(obj.mail)
                    )
                );
            });

            this.append(content);
        },

        draw: function (baton) {
            var popup = this.busy();
            require(['io.ox/contacts/view-detail'], function (view) {
                var obj = api.reduce(baton.data);
                api.get(obj).done(function (data) {
                    popup.idle().append(view.draw(data));
                });
            });
        }
    });
});
