/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define('io.ox/calendar/edit/main', [
    'io.ox/core/extensions',
    'io.ox/calendar/model',
    'io.ox/calendar/api',
    'io.ox/calendar/edit/view',
    'io.ox/core/notifications',
    'io.ox/core/folder/api',
    'io.ox/calendar/util',
    'gettext!io.ox/calendar/edit/main',
    'settings!io.ox/calendar',
    'less!io.ox/calendar/edit/style',
    // need jquery-ui for scrollParent
    'static/3rd.party/jquery-ui.min.js'
], function (ext, AppointmentModel, api, EditView, notifications, folderAPI, util, gt, settings) {

    'use strict';

    var INDEX = 0;

    ext.point('io.ox/calendar/edit/boot').extend({
        id: 'models-and-objects',
        index: INDEX += 100,
        perform: function (baton) {
            var model = baton.data;
            delete baton.data;
            if (model) {
                if (model instanceof Backbone.Model) {
                    baton.data = model.toJSON();
                } else if (_.isObject(model)) {
                    baton.data = model;
                }
            }
        }
    }, {
        id: 'load',
        index: INDEX += 100,
        perform: function (baton) {
            var action = baton.options.action,
                originalData = baton.data,
                o = originalData && api.reduce(originalData);
            // is not editing
            if (!o || !o.id || !o.folder) return;
            // use series master for this and future
            if (action === 'series' || action === 'thisandfuture') {
                // edit the series, discard recurrenceId and reference to seriesId if exception
                delete o.recurrenceId;
                o.id = originalData.seriesId || originalData.id;
            }
            return api.get(o, false).then(function (data) {
                data = data.toJSON();
                if (action === 'thisandfuture') data = util.createUpdateData(data, originalData);
                baton.data = data;
            }, notifications.yell);
        }
    }, {
        id: 'appointment-model',
        index: INDEX += 100,
        perform: function (baton) {
            var options = baton.options,
                data = baton.data,
                app = baton.app;
            if (options.mode === 'edit' && data.id) {
                // hash support
                app.setState({ folder: data.folder, id: data.id });
                app.model = new AppointmentModel.Model(data);
            } else {
                // default values from settings
                data.alarms = data.alarms || util.getDefaultAlarms(data);

                // transparency is the new shown_as property. It only has 2 values, TRANSPARENT and OPAQUE
                data.transp = data.transp || ((util.isAllday(data) && settings.get('markFulltimeAppointmentsAsFree', false)) ? 'TRANSPARENT' : 'OPAQUE');
                app.model = new AppointmentModel.Model(data);
                if (!data.folder || /^virtual/.test(data.folder)) {
                    app.model.set('folder', data.folder = folderAPI.getDefaultFolder('calendar'));
                }
            }
            baton.model = app.model;
        }
    }, {
        id: 'load-folder',
        index: INDEX += 100,
        perform: function (baton) {
            return folderAPI.get(baton.model.get('folder')).catch();
        }
    }, {
        id: 'set-default-attendee',
        index: INDEX += 100,
        perform: function (baton) {
            return baton.model.setDefaultAttendees({ create: baton.options.mode === 'create' });
        }
    }, {
        id: 'model-setup',
        index: INDEX += 100,
        perform: function (baton) {
            var options = baton.options;
            if (options.mode === 'create') {
                baton.model.set('attendeePrivileges', settings.get('chronos/allowAttendeeEditsByDefault', false) && !folderAPI.pool.getModel(baton.model.get('folder')).is('public') ? 'MODIFY' : 'DEFAULT');
            }

            if (options.mode === 'edit' && util.isAllday(baton.model)) {
                // allday apointments do not include the last day. To not misslead the user we subtract a day (so one day appointments only show one date for example)
                // this day will be added again on save
                baton.model.set('endDate', { value: moment(baton.model.get('endDate').value).subtract('1', 'days').format('YYYYMMDD') });
            }

            baton.model.on({
                'sync:start': function () {
                    baton.win.busy();
                }
            });

            if (options.mode === 'edit') {

                if (options.action === 'appointment') {
                    baton.model.set('rrule', undefined, { validate: true });
                    baton.model.mode = 'appointment';
                }

                if (options.action === 'series') baton.model.mode = 'series';
                if (options.action === 'thisandfuture') baton.model.mode = 'thisandfuture';
            }

            baton.model.on('change', function () {
                baton.app.considerSaved = false;
            });
        }
    }, {
        id: 'view',
        index: INDEX += 100,
        perform: function (baton) {
            var app = baton.app,
                options = baton.options;
            baton.view = app.view = new EditView({
                model: baton.model,
                mode: options.mode,
                app: app,
                callbacks: {
                    extendDescription: app.extendDescription
                },
                // restore meta data for used groups if given
                usedGroups: options.usedGroups || []
            });
        }
    }, {
        id: 'set-content',
        index: INDEX += 100,
        perform: function (baton) {
            var options = baton.options,
                app = baton.app,
                model = baton.model;
            // if initialModelData is given, we are using a restore point. Don't consider this as saved
            app.considerSaved = !options.initialModelData;

            app.setTitle(model.get('summary') || options.mode === 'create' ? gt('Create appointment') : gt('Edit appointment'));

            // use deepclone so we dont have accidental references
            app.initialModelData = _.deepClone(options.initialModelData || model.toJSON());
            $(app.getWindow().nodes.main[0]).append(app.view.render().el);
        }
    }, {
        id: 'idle',
        index: INDEX += 100,
        perform: function (baton) {
            var win = baton.win;
            // Set window and toolbars visible again
            win.nodes.header.removeClass('sr-only');
            win.nodes.body.removeClass('sr-only').find('.scrollable').scrollTop(0).trigger('scroll');
            win.idle();
        }
    }, {
        id: 'done',
        index: INDEX += 100,
        perform: function (baton) {
            var app = baton.app,
                model = baton.model;
            //set url parameters
            app.setState({ folder: model.attributes.folder, id: model.get('id') ? model.attributes.id : null });
            app.onShowWindow();
            //used by guided tours so they can show the next step when everything is ready
            $(app).trigger('finishedCreating');
        }
    }, {
        id: 'dropzone',
        index: INDEX += 100,
        perform: function (baton) {
            var app = baton.app;
            if (app.dropZone) {
                baton.win.on('hide', function () { app.dropZone.remove(); });
                if (app.dropZone.include) app.dropZone.include();
            }
        }
    });

    function createInstance() {

        var app = ox.ui.createApp({
            name: 'io.ox/calendar/edit',
            title: gt('Edit Appointment'),
            userContent: true,
            closable: true,
            floating: !_.device('smartphone'),
            size: 'width-sm'
        });

        var win = ox.ui.createWindow({
            name: 'io.ox/calendar/edit',
            chromeless: true,
            floating: !_.device('smartphone'),
            closable: true,
            title: gt('Edit Appointment')
        });

        app.setWindow(win);

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

            edit: function (data, opt) {

                var def = new $.Deferred();

                opt = _.extend({
                    mode: 'edit'
                }, opt);

                app.cid = 'io.ox/calendar:' + opt.mode + '.' + util.cid(data);

                // Set window and toolbars invisible initially
                win.nodes.header.addClass('sr-only');
                win.nodes.body.addClass('sr-only');

                win.busy().show(function () {
                    ext.point('io.ox/calendar/edit/boot').cascade(app, { app: app, data: data || {}, options: opt, win: win }).then(function success() {
                        def.resolve({ app: app });
                    }, function fail(e) {
                        app.quit();
                        def.reject(e);
                    });
                });
                return def;
            },

            considerSaved: false,

            create: function (data) {
                data = data instanceof Backbone.Model ? data.toJSON() : data;
                // apply defaults. Cannot be done in default of model, because then events in week/month view have class public by default
                if (!data.class) data.class = 'PUBLIC';
                this.edit(data, { mode: 'create' });
            },

            getDirtyStatus: function () {
                if (this.considerSaved) return false;
                return !_.isEqual(this.model.toJSON(), this.initialModelData);
            },

            // gets the delta for an update request. That way we don't need to send the whole model
            getDelta: function () {

                if (this.view.options.mode !== 'edit') return this.model.toJSON();
                var self = this,
                    data = this.model.toJSON(),
                    delta = {
                        id: this.initialModelData.id,
                        folder: this.initialModelData.folder,
                        timestamp: this.initialModelData.timestamp
                    },
                    keys = _(data).keys();

                _(keys).each(function (key) {
                    // endDate needs some special attention since it's one day off for allday appointments (for user convenience)
                    if ((key === 'endDate' && util.isAllday(data) ? (self.view.tempEndDate && !_.isEqual(self.view.tempEndDate, self.initialModelData[key])) : (!_.isEqual(self.initialModelData[key], data[key])))
                        && (self.initialModelData[key] || data[key])) {
                        delta[key] = data[key];
                    }
                });

                if (this.initialModelData.recurrenceId) {
                    delta.recurrenceId = this.initialModelData.recurrenceId;
                    delta.seriesId = this.initialModelData.seriesId;
                }

                return delta;
            },

            // clean up model so no empty values are saved and dirty check has no false positives
            cleanUpModel: function () {
                var data = this.model.toJSON(),
                    self = this;

                _(data).each(function (value, key) {
                    // if value is undefined, '' or null and the key is not in the initial model data, we can omit it
                    if (!value && !_(self.initialModelData).has(key)) {
                        // use silent or miniviews add the attribute again with undefined value. We want to omit them here
                        self.model.unset(key, { silent: true });
                    }
                });
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
                self.model.adjustEndDate = true;
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
                                if (self.view.tempEndDate) {
                                    self.model.set('endDate', self.view.tempEndDate, { silent: true });
                                    self.view.tempEndDate = null;
                                }
                            })
                            .on('ignore', function () {
                                if (self.view.options.mode === 'create') {
                                    api.create(
                                        self.model,
                                        _.extend(util.getCurrentRangeOptions(), {
                                            usedGroups: self.model._attendees.usedGroups,
                                            attachments: self.attachmentsFormData || [],
                                            checkConflicts: false })
                                    ).then(_.bind(self.onSave, self), _.bind(self.onError, self));
                                } else {
                                    api.update(
                                        self.getDelta(),
                                        _.extend(util.getCurrentRangeOptions(), {
                                            attachments: self.attachmentsFormData || [],
                                            checkConflicts: false,
                                            recurrenceRange: self.view.model.mode === 'thisandfuture' ? 'THISANDFUTURE' : undefined,
                                            usedGroups: self.model._attendees.usedGroups,
                                            showRecurrenceInfo: true
                                        })
                                    ).then(_.bind(self.onSave, self), _.bind(self.onError, self));
                                }
                            });
                    });
                    return;
                }

                // update model with current data (omit undefined)
                if (data) this.model.set(_(data.toJSON()).omit(function (value) { return !value; }));

                // needed for attachment uploads to work
                if (this.view.options.mode === 'create') {
                    this.model.trigger('create');
                    ox.trigger('appointment:create', this.model.get('attendeePrivileges') === 'MODIFY' ? 1 : 0);
                } else {
                    this.model.trigger('update');
                }

                if (this.moveAfterSave) {
                    var save = _.bind(this.onSave, this),
                        fail = _.bind(this.onError, this);
                    api.move(this.model, this.moveAfterSave, util.getCurrentRangeOptions()).then(function () {
                        delete self.moveAfterSave;
                        save();
                    }, fail);
                } else {
                    this.model.adjustEndDate = false;
                    this.considerSaved = true;
                    self.getWindow().idle();
                    this.quit();
                }
            },

            onError: function (error) {

                // restore state of model attributes for moving
                if (this.moveAfterSave && this.model.get('folder') !== this.moveAfterSave) {
                    this.model.set('folder', this.moveAfterSave, { silent: true });
                }
                delete this.moveAfterSave;
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
                        point:  {
                            data: this.model.attributes,
                            action: this.model.mode,
                            meta: { usedGroups: this.model._attendees.usedGroups },
                            // save this so the dirty check works correctly after the restore
                            initialModelData: this.initialModelData
                        }
                    };
                }
                return false;
            },

            failRestore: function (point) {
                // support for legacy restore points
                var data = point.data || point;
                this.edit(data, {
                    mode: _.isUndefined(data.id) ? 'create' : 'edit',
                    initialModelData: point.initialModelData,
                    action: point.action,
                    usedGroups: point.meta ? point.meta.usedGroups : []
                });
                return $.when();
            },

            getContextualHelp: function () {
                return 'ox.appsuite.user.sect.calendar.gui.create.html';
            }
        });

        app.setQuit(function (options) {

            var self = this,
                df = new $.Deferred(),
                isDiscard = options && options.type === 'discard';

            // trigger blur inputfields so the model has current data and the dirty check is correct
            $(document.activeElement).filter('input').trigger('change');
            this.cleanUpModel();
            //be gentle
            if (this.getDirtyStatus()) {
                require(['io.ox/backbone/views/modal'], function (ModalDialog) {
                    if (app.getWindow().floating) {
                        app.getWindow().floating.toggle(true);
                    } else if (_.device('smartphone')) {
                        app.getWindow().resume();
                    }
                    new ModalDialog({
                        //#. 'Discard changes' as header text of an appointment to confirm to discard changes via a modal dialog.
                        title: gt('Discard changes'),
                        description: gt('Do you really want to discard your changes?')
                    })
                        //#. "Discard changes" appears in combination with "Cancel" (this action)
                        //#. Translation must be distinguishable for the user
                        .addCancelButton()
                        .addButton({ label: gt.pgettext('dialog', 'Discard changes'), action: 'delete' })
                        .on('action', function (action) {
                            if (action === 'delete') {
                                if (isDiscard) self.model.trigger('discard');
                                self.dispose();
                                df.resolve();
                            } else {
                                df.reject();
                            }
                        })
                        .open();
                });
            } else {
                // just let it go
                if (isDiscard) this.model.trigger('discard');
                this.dispose();
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
