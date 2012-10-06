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
      ['io.ox/calendar/model',
       'io.ox/calendar/api',
       'io.ox/calendar/edit/view-main',
       'gettext!io.ox/calendar/edit/main',
       'io.ox/core/api/folder',
       'io.ox/core/config',
       'less!io.ox/calendar/edit/style.less'], function (appointmentModel, api, MainView, gt, folderAPI, configAPI) {

    'use strict';
    function AppointmentModel() {

    }
    var EditAppointmentController = function () {};

    EditAppointmentController.prototype = {
        start: function () {

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
            this.view.off('save', _.bind(this.onSave, this));
            this.model.off('change:title');
        },
        edit: function (data) {
            var self = this;
            var cont = function (data) {
                self.model = new AppointmentModel(data);
                var participants = self.model.get('participants');

                folderAPI.get({folder: data.folder_id}).done(function (folder) {

                    if (folderAPI.is('private', folder)) {
                        // it's a private folder for the current user,
                        // he can not be removed from the actual appointment

                        _.each(participants, function (d) {
                            if (d.id === configAPI.get('identifier')) {
                                d.ui_removable = false;
                            }
                        });
                        self.model.set('participants', participants);
                    }

                    window.mymodel = self.model;

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

                });

            };

            if (data) {

                //hash support
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

            self.model = appointmentModel.factory.create(data);
            appointmentModel.setDefaultParticipants(self.model).done(function () {
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
            });

            folderAPI.get({folder: data.folder_id}).done(function (folder) {
                if (folderAPI.is('private', folder)) {
                    // it's a private folder for the current user, add him by default
                    // as participant
                    self.model.set('participants', [{id: configAPI.get('identifier'), type: 1, ui_removable: false}]);

                } else if (folderAPI.is('public', folder)) {
                    // if public folder, current user will be added
                    self.model.set('participants', [{id: configAPI.get('identifier'), type: 1}]);

                } else if (folderAPI.is('shared', folder)) {
                    // in a shared folder the owner (created_by) will be added by default
                    self.model.set('participants', [{id: folder.created_by, type: 1}]);
                }


            });


        },
        onShowWindow: function () {
            console.log('onshowwindow');
            var self = this;
            if (self.model.get('title')) {
                self.getWindow().setTitle(self.model.get('title'));
                self.setTitle(self.model.get('title'));
            }
            self.model.on('change:title', function (model, value, source) {
                self.getWindow().setTitle(value);
                self.setTitle(value);
            });
            //$('#' + self.view.guid + '_title').get(0).focus();

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
                        $(self.view.el).find('.error-display').empty().append(errContainer);

                        if (err.conflicts !== null && err.conflicts !== undefined) {
                            errContainer.text(gt('Conflicts detected'));

                            require(['io.ox/calendar/edit/module-conflicts'], function (conflictsModule) {
                                var conflicts = new conflictsModule.Collection(err.conflicts);
                                conflicts.fetch()
                                    .done(function () {
                                        var conView = new conflictsModule.CollectionView({collection: conflicts});
                                        window.cview = conView;
                                        $(self.view.el).find('.additional-info').empty().append(
                                            conView.render().el
                                        );
                                        conView.on('ignore', function () {
                                            self.model.set('ignore_conflicts', true);
                                            return self.onSave();
                                        });
                                        conView.on('cancel', function () {
                                            $(conView.el).remove();
                                            $(self.view.el).find('.error-display').empty();
                                        });

                                        if (conView.isResource) {
                                            errContainer.text(gt('Resource Conflicts detected!'));
                                        }
                                    });

                            });
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
        }/*,
        failSave: function () {
            console.log("fail save", this);
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
            return df;
        }*/
    };


    function createInstance() {
        var app = ox.ui.createApp({name: 'io.ox/calendar/edit', title: gt('Edit Appointment')}),
            controller = _.extend(app, new EditAppointmentController());

        controller.setLauncher(_.bind(controller.start, controller));
        controller.setQuit(_.bind(controller.stop, controller));
        return controller;
    }

    return {
        getApp: createInstance
    };
});
