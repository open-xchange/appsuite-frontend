/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2018 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */

define('io.ox/calendar/edit/main', [
    'io.ox/calendar/model',
    'io.ox/calendar/api',
    'io.ox/core/extPatterns/dnd',
    'io.ox/calendar/edit/view',
    'io.ox/core/notifications',
    'io.ox/core/folder/api',
    'io.ox/calendar/util',
    'io.ox/core/http',
    'gettext!io.ox/calendar/edit/main',
    'settings!io.ox/calendar',
    'less!io.ox/calendar/edit/style',
    // need jquery-ui for scrollParent
    'static/3rd.party/jquery-ui.min.js'
], function (AppointmentModel, api, dnd, EditView, notifications, folderAPI, util, http, gt, settings) {

    'use strict';

    function createInstance() {

        var app = ox.ui.createApp({
            name: 'io.ox/calendar/edit',
            title: gt('Edit Appointment'),
            userContent: true,
            closable: true,
            floating: !_.device('smartphone'),
            sendInternalNotifications: true
        });

        _.extend(app, {

            /*
            * should cleanly remove every outbounding reference
            * of all objects created. this could be a awkward task
            * but better for longtime perf. IE still has a hu
            * :(
            */
            dispose: function () {
                this.view.off('save', _.bind(this.onSave, this));
                this.model.off();
            },

            // published via callbacks objects in baton (see below)
            // baton makes its journey through all extensions
            // description field (resource only) uses this function to
            // offer "Copy to description"; the click event lands here
            extendDescription: function (e) {
                // we simply have to look for the textarea
                // this whole thing could be solved differently (more local)
                // but I had no clue how to hook into the
                // 'new forms.InputField({...})' stuff in template.js
                e.preventDefault();
                var textarea = app.view.$el.find('textarea.note');
                // trigger change to update the model
                textarea.val(textarea.val() + e.data.description).trigger('change');
                notifications.yell('success', gt('Description has been copied'));
            },

            edit: function (model, opt) {

                var self = this,
                    data = {};
                // work with models and objects
                if (model) {
                    if (model.get) {
                        data = model.toJSON();
                    } else if (_.isObject(model)) {
                        data = model;
                    }
                }
                opt = _.extend({
                    mode: 'edit'
                }, opt);

                app.cid = 'io.ox/calendar:' + opt.mode + '.' + util.cid(model);

                function cont() {
                    // create app window
                    var win = ox.ui.createWindow({
                        name: 'io.ox/calendar/edit',
                        chromeless: true,
                        floating: !_.device('smartphone'),
                        closable: true,
                        title: gt('Edit Appointment')
                    });

                    self.setWindow(win);

                    self.model.setDefaultAttendees({ create: opt.mode === 'create' }).done(function () {
                        if (opt.mode === 'edit' && util.isAllday(self.model)) {
                            // allday apointments do not include the last day. To not misslead the user we subtract a day (so one day appointments only show one date for example)
                            // this day will be added again on save
                            self.model.set('endDate', { value: moment(self.model.get('endDate').value).subtract('1', 'days').format('YYYYMMDD') });
                            self.model.set('allDay', true);
                        }
                        app.view = self.view = new EditView({
                            model: self.model,
                            mode: opt.mode,
                            app: self,
                            callbacks: {
                                extendDescription: app.extendDescription
                            }
                        });

                        self.model.on({
                            'sync:start': function () {
                                self.getWindow().busy();
                            }
                        });

                        self.considerSaved = true;

                        self.model
                            .on('change', function () {
                                self.considerSaved = false;
                            })
                            //todo still needed?
                            .on('backendError', function (error) {
                                try {
                                    self.getWindow().idle();
                                } catch (e) {
                                    if (error.code === 'UPL-0005') {
                                        //uploadsize to big; remove busy animation
                                        api.removeFromUploadList(_.ecid(this.attributes));
                                    }
                                }
                                var message;
                                // hmm, backend likes to send an empty object in "problematic" which makes it hard to check
                                if (error.problematic && error.problematic.length > 0 && !_.isEmpty(error.problematic[0])) {
                                    message = _(error.problematic).map(function (field) {
                                        var id = http.getColumn('calendar', field.id) || field.id,
                                            name = util.columns[id] || id;
                                        return gt('The field "%1$s" exceeds its maximum size of %2$d characters.', name, field.max_size);
                                    }).join(' ');
                                } else {
                                    message = error.error;
                                }
                                notifications.yell('error', message);
                            });

                        self.setTitle(opt.mode === 'create' ? gt('Create appointment') : gt('Edit appointment'));

                        win.on('show', function () {
                            if (app.dropZone) app.dropZone.include();
                            //set url parameters
                            self.setState({ folder: self.model.attributes.folder, id: self.model.get('id') ? self.model.attributes.id : null });
                        });

                        if (app.dropZone) win.on('hide', function () { app.dropZone.remove(); });

                        if (opt.mode === 'edit') {

                            if (opt.action === 'appointment') {
                                self.model.set('rrule', undefined, { validate: true });
                                self.model.mode = 'appointment';
                            }

                            if (opt.action === 'series') self.model.mode = 'series';
                            if (opt.action === 'thisandfuture') self.model.mode = 'thisandfuture';
                        }

                        $(self.getWindow().nodes.main[0]).append(self.view.render().el);
                        self.getWindow().show(_.bind(self.onShowWindow, self));
                        //used by guided tours so they can show the next step when everything is ready
                        $(app).trigger('finishedCreating');
                    });
                }

                function loadFolder() {
                    folderAPI.get(self.model.get('folder')).always(cont);
                }

                // check mode
                if (opt.mode === 'edit' && data.id) {
                    // hash support
                    self.setState({ folder: data.folder, id: data.id });
                    self.model = new AppointmentModel.Model(data);
                } else {
                    // default values from settings
                    data.alarms = data.alarms || util.getDefaultAlarms(data);

                    // transparency is the new shown_as property. It only has 2 values, TRANSPARENT and OPAQUE
                    data.transp = data.transp || (util.isAllday(data) && settings.get('markFulltimeAppointmentsAsFree', false)) ? 'TRANSPARENT' : 'OPAQUE';
                    self.model = new AppointmentModel.Model(data);
                    if (!data.folder || /^virtual/.test(data.folder)) {
                        self.model.set('folder', data.folder = folderAPI.getDefaultFolder('calendar'));
                    }
                }

                // if we restore alarms, check if they differ from the defaults
                var isDefault = JSON.stringify(_(data.alarms).pluck('action', 'trigger')) === JSON.stringify(_(util.getDefaultAlarms(data)).pluck('action', 'trigger'));

                // change default alarm when allDay changes and the user did not change the alarm before (we don't want data loss)
                if (isDefault) {
                    self.model.on('change:allDay', function () {
                        if (!this.userChangedAlarms) {
                            this.set('alarms', util.getDefaultAlarms(this));
                        }
                    });
                    self.model.on('userChangedAlarms', function () {
                        this.userChangedAlarms = true;
                    });
                }
                loadFolder();
            },

            considerSaved: false,

            create: function (data) {
                this.edit(data, { mode: 'create' });
            },

            getDirtyStatus: function () {
                return false;
                //TODO fix dirty status
                /*if (this.considerSaved) return false;

                return !_.isEmpty(this.model.changedSinceLoading());*/
            },

            onShowWindow: function () {

                var array = [],
                    signatureSequenz = ['keyup', 'focus'];

                function stopPointerEvents(e) {

                    if (e.type === 'focus') array.push('focus');
                    if (e.type === 'keyup') array.push('keyup');

                    if (array.length === 2) {
                        if (_.isEmpty(_.difference(signatureSequenz, array))) {
                            e.data.list.css('pointer-events', 'none');
                        }
                        array = [];
                    }

                    self.getWindow().nodes.main.find('.control-group').on('mousemove', function () {
                        e.data.list.css('pointer-events', 'auto');
                    });
                }

                var self = this;
                if (self.model.get('summary')) {
                    self.getWindow().setTitle(self.model.get('summary'));
                    self.setTitle(self.model.get('summary'));
                }
                self.model.on('keyup:summary', function (value) {
                    if (!value) value = self.model.get('id') ? gt('Edit appointment') : gt('Create appointment');

                    self.getWindow().setTitle(value);
                    self.setTitle(value);
                });

                // no autofocus on smartphone and for iOS in special (see bug #36921)
                if (_.device('!smartphone && !iOS')) {
                    // focus first input element
                    $(self.getWindow().nodes.main).find('input')[0].focus();
                }
                // make window scrollable
                $(self.getWindow().nodes.main[0]).addClass('scrollable');

                var controlsBlock = $(self.getWindow().nodes.main).find('.controls'),
                    list = controlsBlock.find('ul'),
                    input = controlsBlock.find('input');

                input.on('keyup focus', { list: list }, stopPointerEvents);
            },

            onSave: function (data) {
                var self = this;
                if (data && data.conflicts) {
                    ox.load(['io.ox/calendar/conflicts/conflictList']).done(function (conflictView) {
                        conflictView.dialog(data.conflicts)
                            .on('cancel', function () {
                                self.getWindow().idle();

                                // restore times (we add a day before saving allday appointments)
                                if (self.view.tempEndDate && self.view.tempStartDate) {
                                    self.model.set('endDate', self.view.tempEndDate, { silent: true });
                                    self.model.set('startDate', self.view.tempStartDate, { silent: true });
                                    self.view.tempEndDate = self.view.tempStartDate = null;
                                }
                            })
                            .on('ignore', function () {
                                var sendNotifications = self.get('sendInternalNotifications');
                                if (self.view.options.mode === 'create') {
                                    api.create(
                                        self.model,
                                        _.extend(util.getCurrentRangeOptions(), { attachments: self.attachmentsFormData || [], sendInternalNotifications: sendNotifications, checkConflicts: false })
                                    ).then(_.bind(self.onSave, self), _.bind(self.onError, self));
                                } else {
                                    api.update(
                                        self.model,
                                        _.extend(util.getCurrentRangeOptions(), { attachments: self.attachmentsFormData || [], sendInternalNotifications: sendNotifications, checkConflicts: false })
                                    ).then(_.bind(self.onSave, self), _.bind(self.onError, self));
                                }
                            });
                    });
                    return;
                }

                // update model with current data
                if (data) this.model.set(data.toJSON());

                // needed for attachment uploads to work
                if (this.view.options.mode === 'create') {
                    this.model.trigger('create');
                } else {
                    this.model.trigger('update');
                }

                // TODO can this be removed?
                /*if (this.moveAfterSave) {
                    var save = _.bind(this.onSave, this),
                        fail = _.partial(_.bind(this.onError, this), _, { isMoveOperation: true }),
                        self = this;
                    //update last modified parameter not to run into a conflict error
                    this.model.set('last_modified', data.last_modified, { silent: true });
                    api.move(this.model.toJSON(), this.moveAfterSave).then(function () {
                        delete self.moveAfterSave;
                        save();
                    }, fail);
                } else {*/
                this.considerSaved = true;
                self.getWindow().idle();
                this.quit();
                //}
            },

            onError: function (error) {

                /*// restore state of model attributes for moving
                if (this.moveAfterSave && this.model.get('folder') !== this.moveAfterSave) {
                    this.model.set('folder', this.moveAfterSave, { silent: true });
                }
                delete this.moveAfterSave;*/
                this.getWindow().idle();

                // restore times (we add a day before saving allday appointments)
                if (this.tempEndDate && self.tempStartDate) {
                    this.model.set('endDate', this.tempEndDate);
                    this.model.set('startDate', this.tempStartDate);
                    this.tempEndDate = this.tempStartDate = null;
                }
                // when to do what?
                // show validation errors inline -> dont yell
                // show server errors caused -> yell
                if (error) notifications.yell(error);
            },

            failSave: function () {
                if (this.model) {
                    var summary = this.model.get('summary');
                    return {
                        description: gt('Appointment') + (summary ? ': ' + summary : ''),
                        module: 'io.ox/calendar/edit',
                        point: this.model.attributes
                    };
                }
                return false;
            },

            failRestore: function (point) {
                this.edit(point, {
                    mode: _.isUndefined(point.id) ? 'create' : 'edit'
                });
                return $.when();
            },

            getContextualHelp: function () {
                return 'ox.appsuite.user.sect.calendar.gui.create.html';
            }
        });

        app.setLauncher(function () {
            this.dropZone = new dnd.UploadZone({
                ref: 'io.ox/calendar/edit/dnd/actions'
            }, this);
        });

        app.setQuit(function () {
            var self = this,
                df = new $.Deferred();

            //be gently
            if (self.getDirtyStatus()) {
                require(['io.ox/core/tk/dialogs'], function (dialogs) {
                    if (app.getWindow().floating) {
                        app.getWindow().floating.toggle(true);
                    }
                    new dialogs.ModalDialog()
                        .text(gt('Do you really want to discard your changes?'))
                        //#. "Discard changes" appears in combination with "Cancel" (this action)
                        //#. Translation should be distinguishable for the user
                        .addPrimaryButton('delete', gt.pgettext('dialog', 'Discard changes'), 'delete')
                        .addButton('cancel', gt('Cancel'), 'cancel')
                        .show()
                        .done(function (action) {
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
            if (_.device('!smartphone && !iOS')) app.getWindow().nodes.main.find('input')[0].focus();
            return df;
        });

        return app;
    }

    return {
        getApp: createInstance,
        reuse: function (type, data) {
            if (type === 'edit') {
                return ox.ui.App.reuse('io.ox/calendar:edit.' + util.cid(data));
            }
        }
    };
});
