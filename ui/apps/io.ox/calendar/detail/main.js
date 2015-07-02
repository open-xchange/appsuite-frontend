/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define('io.ox/calendar/detail/main', [
    'io.ox/calendar/api',
    'io.ox/core/extensions',
    'io.ox/calendar/view-detail',
    'gettext!io.ox/calendar',
    'io.ox/core/notifications'
], function (api, ext, detailView, gt, notifications) {

    'use strict';

    var NAME = 'io.ox/calendar/detail';

    ox.ui.App.mediator(NAME, {
        'show-appointment': function (app) {
            app.showAppointment = function (appointment) {

                api.get(appointment).then(
                    function success(data) {
                        var title = data.title;
                        app.setTitle(title);
                        app.getWindowNode().addClass('detail-view-app').append($('<div class="f6-target detail-view-container">').attr({
                            'tabindex': 1,
                            'role': 'complementary',
                            'aria-label': gt('Appointment Details')
                        }).append(detailView.draw(data)));

                        api.one('delete:' + _.ecid(data), function () {
                            app.quit();
                        });
                    },
                    function fail() {
                        notifications.yell('error', gt('An error occurred. Please try again.'));
                    }
                );
            };
        }
    });

    // multi instance pattern
    function createInstance() {
        // application object
        var app = ox.ui.createApp({
            closable: true,
            name: NAME,
            title: ''
        });

        // launcher
        return app.setLauncher(function (options) {

            var win = ox.ui.createWindow({
                chromeless: true,
                name: NAME,
                toolbar: false
            });
            app.setWindow(win);
            app.mediate();
            win.show();

            var cid = options.cid, obj;
            if (cid !== undefined) {
                // called from calendar app
                obj = _.cid(cid);
                app.setState({ folder: obj.folder_id, id: obj.id, recurrence_position: obj.recurrence_position || null });
                app.showAppointment(obj);
                return;
            }

            // deep-link
            if (options.folder && options.id) {
                app.setState({ folder: options.folder, id: options.id });
            }

            obj = app.getState();

            if (obj.folder && obj.id) {
                app.showAppointment(obj);
            }
        });
    }

    return {
        getApp: createInstance
    };
});
