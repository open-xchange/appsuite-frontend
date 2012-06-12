/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/calendar/month/view-controller',
    ['io.ox/calendar/month/view', 'io.ox/calendar/api'], function (view, api) {

    'use strict';

    return new ox.ui.WindowView('month-view', function (main, app) {

        console.log('month view render');

        var now = Date.UTC(2012, 5, 1),
            scaffold = view.drawScaffold();

        scaffold.find('.scrollpane').append(view.drawMonth(now));
        main.empty().addClass('month-view').append(scaffold);

        // add click support
        main.on('click', '.appointment', function (e) {
            var obj = _.cid($(this).attr('data-cid'));
            // open appointment details
            api.get(obj).done(function (data) {
                require(["io.ox/core/tk/dialogs", "io.ox/calendar/view-detail"])
                .done(function (dialogs, detailView) {
                    new dialogs.SidePopup().show(e, function (popup) {
                        popup.append(detailView.draw(data));
                    });
                });
            });
        });

        // get appointments
        api.getAll({ start: now, end: Date.UTC(2012, 5, 30) }).done(function (appointments) {
            _(appointments).each(function (a) {
                console.log('appointment', a);
                var d = new Date(a.start_date), selector = '.date-' + d.getUTCMonth() + '-' + d.getUTCDate() + ' .list';
                scaffold.find(selector).append(
                    view.drawAppointment(a)
                );
            });
        });
    });
});
