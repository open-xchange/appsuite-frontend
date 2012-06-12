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
       'io.ox/calendar/edit/view-main',
       'gettext!io.ox/calendar/edit/main',
       'less!io.ox/calendar/edit/style.less'], function (AppointmentModel, api, editExtensions, MainView, gt) {

    'use strict';

    var EditAppointmentController = function () {};

    // register to "compile"-time think is a good idea
    editExtensions.init();

    EditAppointmentController.prototype = {

        start: function () {
            var self = this,
                state = self.getState();

            console.log('state', state, arguments);
            if (state.folder && state.id) {
           //     self.edit();
            }
        },
        stop: function () {
            var self = this,
                df = new $.Deferred();

            //be gently
            if (self.model.isDirty()) {
                require(['io.ox/core/tk/dialogs'], function (dialogs) {
                    new dialogs.ModalDialog()
                        .text(gt('Do you really want to lose your changes?'))
                        .addPrimaryButton('delete', gt('Lose changes'))
                        .addButton('cancel', gt('Cancel'))
                        .show()
                        .done(function (action) {
                            console.debug('Action', action);
                            if (action === 'delete') {
                                self.dispose();
                                df.resolve();
                            } else {
                                df.reject();
                            }
                        });
                });
            } else {
                //just let it go
                self.dispose();
                df.resolve();
            }
            return df;
        },
        /*
        * should cleanly remove every outbounding reference
        * of all objects created. this could be a awkward task
        * but better for longtime perf. IE still has a huge memory-leak problem
        * :(
        */
        dispose: function () {
            console.log('disposing....');
            this.view.off('save', _.bind(this.onSave, this));
            this.model.off('change:title');
        },
        edit: function (data) {
            var self = this;
            var cont = function (data) {
                console.log('cont', data);
                self.model = new AppointmentModel(data);

                if (self._restored === true) {
                    self.model.toSync = data; //just to make it dirty
                }

                self.view = new MainView({model: self.model});
                self.view.on('save', _.bind(self.onSave, self));

                // create app window
                self.setWindow(ox.ui.createWindow({
                    name: 'io.ox/calendar/edit',
                    title: gt('Edit Appointment'),
                    toolbar: true,
                    search: false,
                    close: true
                }));

                $(self.getWindow().nodes.main[0]).append(self.view.render().el);
                self.getWindow().show(_.bind(self.onShowWindow, self));
            };

            if (data) {
                //hash support
                console.log('got data', data);
                self.setState({ folder: data.folder_id, id: data.id});
                cont(data);
            } else {
                api.get(self.getState())
                    .done(cont)
                    .fail(function (err) {
                        // FIXME: use general error class, teardown gently for the user
                        throw new Error(err.error);
                    });
            }
        },
        create: function (data) {
            var self = this;

            self.model = new AppointmentModel(data);
            self.view = new MainView({model: self.model});
            self.view.on('save', _.bind(self.onSave, self));
            self.setTitle(gt('Create Appointment'));

            // create app window
            self.setWindow(ox.ui.createWindow({
                name: 'io.ox/calendar/edit',
                title: gt('Create Appointment'),
                toolbar: true,
                search: false,
                close: true
            }));

            $(self.getWindow().nodes.main[0]).append(self.view.render().el);
            self.getWindow().show(_.bind(self.onShowWindow, self));
        },
        onShowWindow: function () {
            var self = this;
            if (self.model.get('title')) {
                $('.window-title').text(self.model.get('title'));
                self.setTitle(self.model.get('title'));
            }
            self.model.on('change:title', function (model, value, source) {
                $('.window-title').text(value);
                self.setTitle(value);
                console.log('change', arguments);
            });
            $(self.getWindow().nodes.main[0]).addClass('scrollable');
        },
        onSave: function () {
            var self = this;
            self.getWindow().busy();
            self.model.save()
                .done(
                    function (data) {
                        self.getWindow().idle();
                        self.trigger('save', data);
                        self.quit();
                    }
                )
                .fail(
                    function (err) {
                        self.getWindow().idle();
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
        failSave: function () {
            return {
                module: 'io.ox/calendar/edit',
                point: this.model.attributes
            };
        },
        failRestore: function (point) {
            var df = $.Deferred();
            this._restored = true; //to set model dirty by default
            if (_.isUndefined(point.id)) {
                this.create(point);
            } else {
                this.edit(point);
            }
            df.resolve();
            console.log('failRestore', point);
            return df;
        }
    };


    function createInstance() {
        var app = ox.ui.createApp({name: 'io.ox/calendar/edit', title: gt('Edit Appointment')}),
            controller = _.extend(app, new EditAppointmentController());

        controller.setLauncher(_.bind(controller.start, controller));
        controller.setQuit(_.bind(controller.stop, controller));
        console.log('controller', controller);
        return controller;
    }

    return {
        getApp: createInstance
    };
});
