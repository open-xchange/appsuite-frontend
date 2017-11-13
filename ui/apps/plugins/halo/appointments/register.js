/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
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

                node.append($('<div class="widget-title clear-title">').text(gt('Shared Appointments')));
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
