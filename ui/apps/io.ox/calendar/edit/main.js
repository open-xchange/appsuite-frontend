/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 */

define('io.ox/calendar/edit/main', ['io.ox/calendar/api',
        'io.ox/core/config',
        'io.ox/calendar/model',
        'io.ox/calendar/edit/view',
        'gettext!io.ox/calendar/edit/main',
        'less!io.ox/calendar/edit/style.css'], function (calAPI, config, CalendarModel, CalendarEditView, gt) {
    'use strict';

    function createInstance(data) {
        var app = ox.ui.createApp({name: 'io.ox/calendar/edit'});
        var win;


        app.setLauncher(function () {

            win = ox.ui.createWindow({
                name: 'io.ox/calendar/edit',
                title: gt('Edit Appointment'),
                toolbar: true,
                search: false,
                close: true
            });

            win.addClass('io-ox-calendar-edit');
            app.setWindow(win);
        });

        app.edit = function (data) {
            var model = new CalendarModel({data: data}),
                view = new CalendarEditView({model: model}),
                container = win.nodes.main;

            win.show(function () {
                console.log(arguments);

                model.store = function (data, changes) {
                    console.log(arguments);
                };

                container.empty().append(view.render(app).el);

            });


        };

        return app;
    }

    return {
        getApp: createInstance
    };
});
