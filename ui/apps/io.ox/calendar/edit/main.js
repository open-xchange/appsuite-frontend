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

define('io.ox/calendar/edit/main',
      ['io.ox/calendar/edit/model-appointment',
       'io.ox/calendar/api',
       'io.ox/calendar/edit/extensions',
       'io.ox/calendar/edit/view-app',
        'gettext!io.ox/calendar/edit/main'], function (AppointmentModel, api, editExtensions, AppView, gt) {

    'use strict';

    var EditAppointmentController = function (data) {
        console.log('CREATE EDIT APPOINTMENT CONTROLLER');
        console.log(data);
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

    // register to "compile"-time think is a good idea
    editExtensions.init();

    EditAppointmentController.prototype = {
        launch: function () {
        },
        edit: function () {
            var self = this;
            var cont = function (data) {
                self.data = data;
                self.model = new AppointmentModel(self.data);

                self.view = new AppView({model: self.model});
                self.view.on('save', _.bind(self.onSave, self));

                self.win = self.view.render().appwindow;
                self.app.setWindow(self.win);
                self.win.show(function () {
                    // what a h4ck
                    self.view.aftershow();
                    $(self.view.el).addClass('scrollable');
                });
            };

            if (self.data) {
                //hash support
                self.app.setState({ folder: self.data.folder_id, id: self.data.id});
                cont(self.data);
            } else {
                api.get(self.app.getState())
                    .done(cont)
                    .fail(function (err) {
                        // FIXME: use general error class, teardown gently for the user
                        throw new Error(err.error);
                    });
            }
        },
        create: function () {
            var self = this;

            self.model = new AppointmentModel(self.data);
            self.view = new AppView({model: self.model});
            self.view.on('save', _.bind(self.onSave, self));

            self.win = self.view.render().appwindow;
            self.app.setWindow(self.win);
            self.win.show(function () {
                // what a h4ck
                self.view.aftershow();
                $(self.view.el).addClass('scrollable');
            });


        },
        remove: function () {
            var self = this;
            self.model = new AppointmentModel(self.data);
            self.model.destroy();
        },
        onSave: function () {
            var self = this;
            self.win.busy();
            self.model.save()
                .done(
                    function () {
                        self.win.idle();
                        self.app.quit();
                    }
                )
                .fail(
                    function (err) {
                        self.win.idle();
                        var errContainer = $('<div>').addClass('alert alert-error');
                        $(self.view.el).find('[data-extid=error]').empty().append(errContainer);
                        if (err.conflicts !== null && err.conflicts !== undefined) {
                            errContainer.append(
                                $('<a>').addClass('close').attr('data-dismiss', 'alert').attr('type', 'button').text('x'),
                                $('<h4>').text(gt('Conflicts detected')),
                                $('<p>').append('list of conflicts... follow'),
                                $('<a>').addClass('btn btn-danger').text(gt('Ignore conflicts')),
                                $('<a>').addClass('btn').text(gt('Cancel'))
                            );
                        } else if (err.error !== undefined) {
                            errContainer.append(
                                $('<a>').addClass('close').attr('data-dismiss', 'alert').attr('type', 'button').text('x'),
                                $('<p>').text(_.formatError(err))
                            );
                        } else {
                            errContainer.append(
                                $('<a>').addClass('close').attr('data-dismiss', 'alert').attr('type', 'button').text('x'),
                                $('<p>').text(err)
                            );
                        }
                    }
                );
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
            if (self.model.isDirty()) {
                console.log('is dirty!!');
                console.log(self.model);
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

    function createInstance(data) {
        var controller = new EditAppointmentController(data);
        return controller.app;
    }

    return {
        getApp: createInstance
    };
});
