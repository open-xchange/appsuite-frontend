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

define('plugins/halo/register', ['io.ox/core/extensions'], function (ext) {

    'use strict';

    ext.point('io.ox/core/person:action').extend({
        index: 10,
        id: 'default',
        label: 'Halo',
        action: function (data, e) {
            // require detail view, dialogs & all halo extensions
            require(ox.withPluginsFor('plugins/halo', ['plugins/halo/view-detail', 'io.ox/core/tk/dialogs']), function (view, dialogs) {
                var options = data.side ? { side: data.side } : {};
                new dialogs.SidePopup(options).show(e, function (popup) {
                    popup.append(view.draw(data));
                });
            });
        }
    });

    ext.point('io.ox/core/resource:action').extend({
        action: function (data, e) {
            // require detail view, dialogs & all halo extensions
            require(['io.ox/core/tk/dialogs', 'io.ox/contacts/view-detail'], function (dialogs, view) {
                new dialogs.SidePopup().show(e, function (popup) {
                    popup.append(view.draw(data));
                });
            });
        }
    });

    ext.point('io.ox/testing/suite').extend({
        id: 'default',
        file: 'plugins/halo/config-test',
        title: 'Halo Config'
    });

    require(['io.ox/core/capabilities'], function (capabilities) {
        // Halo is not available for Guests without contacts.
        if (capabilities.has('guest') && !capabilities.has('contacts')) return;

        // use global click handler
        $('body').on('click', '.halo-link', function (e) {
            e.preventDefault();
            ext.point('io.ox/core/person:action').invoke('action', this, $(this).data(), e);
        });

        $('body').on('click', '.halo-resource-link', function (e) {
            e.preventDefault();
            ext.point('io.ox/core/resource:action').invoke('action', this, $(this).data(), e);
        });
    });
});
