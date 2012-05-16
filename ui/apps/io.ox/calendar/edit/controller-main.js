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
define('io.ox/calendar/edit/controller-main',
      ['io.ox/calendar/edit/model-calendar',
       'io.ox/calendar/api',
       'io.ox/calendar/edit/view-main',
        'gettext!io.ox/calendar/edit/main'], function (CalendarModel, api, EditMainView, gt) {

    'use strict';

    var EditAppointmentController = function (data) {
        var self = this;
        self.app = ox.ui.createApp({name: 'io.ox/calendar/edit', title: gt('Edit Appointment')});

        self.data = data;
        self.app.controller = this;

        self.app.setLauncher(function () {
            return self.launch();
        });
        self.app.setQuit(function () {
            return self.dispose();
        });
    };

    EditAppointmentController.prototype = {
        launch: function () {
            var self = this;
            var cont = function (data) {
                self.data = data;

                self.model = new CalendarModel(self.data);
                self.view = new EditMainView({model: self.model});

                console.log(arguments);

                console.log('launching app');

                self.win = self.view.render().el;
                self.app.setWindow(self.win);
                self.win.show(function () {
                    // what a h4ck
                    self.view.aftershow();
                });
            };

            if (self.data) {
                //hash support
                console.log('got data');
                self.app.setState({ folder: self.data.folder_id, id: self.data.id});
                cont(self.data);
            } else {
                console.log('need to fetch app state');
                api.get(self.app.getState())
                    .done(cont)
                    .fail(function (err) {
                        // FIXME: use general error class, teardown gently for the user
                        throw new Error(err.error);
                    });
            }
        },
        /*
        * should cleanly remove every outbounding reference
        * of all objects created. this could be a awkward task
        * but better for longtime perf. IE still has a huge memory-leak problem
        * :(
        */
        dispose: function () {
            var self = this,
                df = new $.Deferred();

            //be gently
            if (self.model.hasChanged()) {
                require(['io.ox/core/tk/dialogs'], function (dialogs) {
                    new dialogs.ModalDialog()
                        .text(gt('Do you really want to lose your changes?'))
                        .addPrimaryButton('delete', gt('Lose changes'))
                        .addButton('cancel', gt('Cancel'))
                        .show()
                        .done(function (action) {
                            console.debug('Action', action);
                            if (action === 'delete') {
                                df.resolve();
                            } else {
                                df.reject();
                            }
                        });
                });
            } else {
                //just let it go
                df.resolve();
            }

            return df;
        }
    };

    return EditAppointmentController;
});
