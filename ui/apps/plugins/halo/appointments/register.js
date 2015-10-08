/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define('plugins/halo/appointments/register', [
    'io.ox/core/extensions',
    'gettext!plugins/halo'
], function (ext, gt) {

    'use strict';

    // Taken From Calendar API
    var DAY = 60000 * 60 * 24;

    ext.point('io.ox/halo/contact:renderer').extend({
        id: 'appointments',
        handles: function (type) {
            return type === 'com.openexchange.halo.appointments';
        },
        draw: function (baton) {

            if (baton.data.length === 0) return;

            var node = this, def = $.Deferred();

            // TODO: unify with portal code (copy/paste right now)
            require(['io.ox/core/tk/dialogs', 'io.ox/calendar/view-grid-template'], function (dialogs, viewGrid) {

                node.append($('<div>').addClass('widget-title clear-title').text(gt('Shared Appointments')));
                viewGrid.drawSimpleGrid(baton.data).appendTo(node);

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
            return type === 'com.openexchange.halo.appointments';
        },
        enhance: function (request) {
            request.appendColumns = true;
            request.columnModule = 'calendar';
            request.params.start = _.now();
            request.params.end = _.now() + 10 * DAY;
            request.params.columns = '1,20,200,201,202,220,221,400,401,402';
        }
    });
});
