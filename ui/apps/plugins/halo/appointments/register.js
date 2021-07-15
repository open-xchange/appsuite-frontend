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

define('plugins/halo/appointments/register', [
    'io.ox/core/extensions',
    'gettext!plugins/halo'
], function (ext, gt) {

    'use strict';

    ext.point('io.ox/halo/contact:renderer').extend({
        id: 'appointments',
        handles: function (type) {
            return type === 'com.openexchange.halo.events';
        },
        draw: function (baton) {

            if (baton.data.length === 0) return;

            var node = this, def = $.Deferred();

            // TODO: unify with portal code (copy/paste right now)
            require(['io.ox/core/tk/dialogs', 'io.ox/calendar/view-grid-template'], function (dialogs, viewGrid) {

                node.append($('<h2 class="widget-title clear-title">').text(gt('Shared Appointments')));
                viewGrid.drawSimpleGrid(baton.data).appendTo(node);

                // mark vgrid cells to prevent unwanted close event (bug 41822)
                node.find('.vgrid-cell').addClass('io-ox-dialog-sidepopup-toggle');

                new dialogs.SidePopup().delegate(node, '.vgrid-cell', function (popup, e, target) {
                    var data = target.data('appointment');
                    require(['io.ox/calendar/view-detail'], function (view) {
                        popup.append(view.draw(data));
                        data = null;
                    });
                });

                def.resolve();
            });

            return def;
        }
    });

    ext.point('io.ox/halo/contact:requestEnhancement').extend({
        id: 'request-appointments',
        enhances: function (type) {
            return type === 'com.openexchange.halo.events';
        },
        enhance: function (request) {
            request.params.rangeStart = moment().utc().format('YYYYMMDD[T]HHmmss[Z]');
            request.params.rangeEnd = moment().utc().add(10, 'days').format('YYYYMMDD[T]HHmmss[Z]');
        }
    });
});
