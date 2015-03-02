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
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 */

define('io.ox/calendar/edit/main', [
    'io.ox/calendar/model',
    'io.ox/calendar/api',
    'io.ox/core/extPatterns/dnd',
    'io.ox/calendar/edit/view',
    'io.ox/core/notifications',
    'gettext!io.ox/calendar/edit/main',
    'settings!io.ox/calendar',
    'less!io.ox/calendar/edit/style'
], function (appointmentFactory, api, dnd, EditView, notifications, gt, settings) {

    'use strict';

    function createInstance() {

        var app = ox.ui.createApp({
            name: 'io.ox/calendar/edit',
            title: 'Edit Appointment',
            userContent: true,
            closable: true
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

            // published via calllbacks objects in baton (see below)
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
                textarea.val(textarea.val() + e.data.description);
                notifications.yell('success', gt('Description has been copied'));
            },

            edit: function (data, opt) {

                var self = this;
                data = data || {};
                opt = _.extend({
                    mode: 'edit'
                }, opt);

                app.cid = 'io.ox/calendar:' + opt.mode + '.' + _.cid(data);

                function cont() {
                    // create app window
                    var win = ox.ui.createWindow({
                        name: 'io.ox/calendar/edit',
                        chromeless: true
                    });

                    self.setWindow(win);

                    self.model.setDefaultParticipants({ create: opt.mode === 'create' }).done(function () {

                        app.view = self.view = new EditView({
                            model: self.model,
                            mode: opt.mode,
                            app: self,
                            callbacks: {
                                extendDescription: app.extendDescription
                            }
                        });

                        //window.busy breaks oldschool upload, iframe needs to be enabled until all files are uploaded
                        if (_.browser.IE === undefined || _.browser.IE > 9) {
                            self.model.on('sync:start', function () {
                                self.getWindow().busy();
                            });
                        }

                        self.considerSaved = true;

                        self.model
                            .on('change', function () {
                                self.considerSaved = false;
                            })
                            .on('backendError', function (response) {
                                try {
                                    self.getWindow().idle();
                                } catch (e) {
                                    if (response.code === 'UPL-0005') {
                                        //uploadsize to big; remove busy animation
                                        api.removeFromUploadList(_.ecid(this.attributes));
                                    }
                                }
                                if (response.conflicts) {
                                    return;
                                }
                                notifications.yell('error', response.error);
                            })
                            .on('conflicts', function (con) {
                                var hardConflict = false;
                                // look for hard conflicts
                                _(con).each(function (conflict) {
                                    if (conflict.hard_conflict) {
                                        hardConflict = true;
                                        return;
                                    }
                                });

                                ox.load(['io.ox/core/tk/dialogs', 'io.ox/calendar/conflicts/conflictList']).done(function (dialogs, conflictView) {
                                    var dialog = new dialogs.ModalDialog({
                                        top: '20%',
                                        center: false,
                                        container: self.getWindowNode()
                                    })
                                    .header(conflictView.drawHeader());

                                    dialog.append(conflictView.drawList(con, dialog).addClass('additional-info'));

                                    if (hardConflict) {
                                        dialog.prepend(
                                            $('<div class="alert alert-info hard-conflict">')
                                                .text(gt('Conflicts with resources cannot be ignored'))
                                        );
                                    } else {
                                        dialog.addDangerButton('ignore', gt('Ignore conflicts'), 'ignore', { tabIndex: 1 });
                                    }
                                    dialog.addButton('cancel', gt('Cancel'), 'cancel', { tabIndex: 1 })
                                        .show()
                                        .done(function (action) {
                                            if (action === 'cancel') {
                                                return;
                                            }
                                            if (action === 'ignore') {
                                                self.model.set('ignore_conflicts', true, { validate: true });
                                                self.model.save().then(_.bind(self.onSave, self));
                                            }
                                        });
                                });
                            });

                        self.setTitle(opt.mode === 'create' ? gt('Create appointment') : gt('Edit appointment'));

                        if (app.dropZone) {
                            win.on('show', function () {
                                app.dropZone.include();
                            });

                            win.on('hide', function () {
                                app.dropZone.remove();
                            });
                        }

                        win.on('show', function () {
                            if (self.model.get('id')) {
                                //set url parameters
                                self.setState({ folder: self.model.attributes.folder_id, id: self.model.attributes.id });
                            } else {
                                self.setState({ folder: self.model.attributes.folder_id, id: null });
                            }
                        });

                        if (opt.mode === 'edit') {

                            if (opt.action === 'appointment') {
                                // ensure to create a change exception
                                self.model.touch('recurrence_position');
                                self.model.set('recurrence_type', 0, { validate: true });
                            }

                            if (opt.action === 'series') {

                                // fields for recurrences
                                var x = 0,
                                    fields = [
                                        'recurrence_date_position',
                                        'change_exceptions',
                                        'delete_exceptions',
                                        'recurrence_type',
                                        'days',
                                        'day_in_month',
                                        'month',
                                        'interval',
                                        'until',
                                        'occurrences'
                                    ];

                                // ensure theses fields will be send to backend to edit the whole series
                                for (; x < fields.length; x++) {
                                    self.model.touch(fields[x]);
                                }
                            }

                            // init alarm
                            if (self.model.get('alarm') === undefined || self.model.get('alarm') === null) {
                                //0 is valid don't change to -1 then
                                self.model.set('alarm', -1, { silent: true, validate: true });
                            }

                        }

                        $(self.getWindow().nodes.main[0]).append(self.view.render().el);
                        self.getWindow().show(_.bind(self.onShowWindow, self));
                        //used by guided tours so they can show the next step when everything is ready
                        $(app).trigger('finishedCreating');
                    });
                }

                // check mode
                if (opt.mode === 'edit' && data.id) {
                    // hash support
                    self.setState({ folder: data.folder_id, id: data.id });
                    appointmentFactory.realm('edit').retain().get({
                        id: data.id,
                        folder: data.folder_id
                    })
                    .done(function (model) {
                        self.model = model;
                        cont();
                    });
                } else {

                    // default values from settings
                    data.alarm = settings.get('defaultReminder', 15);
                    if (data.full_time) {
                        data.shown_as = settings.get('markFulltimeAppointmentsAsFree', false) ? 4 : 1;
                    }

                    self.model = appointmentFactory.realm('default').create(data);
                    if (!data.folder_id || /^virtual/.test(data.folder_id)) {
                        require(['io.ox/core/folder/api']).done(function (api) {
                            self.model.set('folder_id', data.folder_id = api.getDefaultFolder('calendar'));
                            cont();
                        });
                    } else {
                        cont();
                    }
                }
            },

            considerSaved: false,

            create: function (data) {
                this.edit(data, { mode: 'create' });
            },

            getDirtyStatus: function () {
                if (this.considerSaved) {
                    return false;
                }
                return !_.isEmpty(this.model.changedSinceLoading());
            },

            onShowWindow: function () {

                var array = [],
                    signatureSequenz = ['keyup', 'focus'];

                function stopPointerEvents(e) {

                    if (e.type === 'focus') {
                        array.push('focus');
                    }

                    if (e.type === 'keyup') {
                        array.push('keyup');
                    }

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
                if (self.model.get('title')) {
                    self.getWindow().setTitle(self.model.get('title'));
                    self.setTitle(self.model.get('title'));
                }
                self.model.on('keyup:title', function (value) {

                    if (!value) {
                        if (self.model.get('id')) {
                            value = gt('Edit appointment');
                        } else {
                            value = gt('Create appointment');
                        }
                    }
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

            onSave: function () {
                this.considerSaved = true;
                this.getWindow().idle();
                this.quit();
            },

            failSave: function () {
                if (this.model) {
                    var title = this.model.get('title');
                    return {
                        description: gt('Appointment') + (title ? ': ' + title : ''),
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
            }
        });

        app.setLauncher(function () {
            if (_.browser.IE === undefined || _.browser.IE > 9) {
                this.dropZone = new dnd.UploadZone({
                    ref: 'io.ox/calendar/edit/dnd/actions'
                }, this);
            }
        });

        app.setQuit(function () {
            var self = this,
                df = new $.Deferred();

            //be gently
            if (self.getDirtyStatus()) {
                require(['io.ox/core/tk/dialogs'], function (dialogs) {
                    new dialogs.ModalDialog()
                        .text(gt('Do you really want to discard your changes?'))
                        //#. "Discard changes" appears in combination with "Cancel" (this action)
                        //#. Translation should be distinguishable for the user
                        .addPrimaryButton('delete', gt.pgettext('dialog', 'Discard changes'), 'delete', { 'tabIndex': '1' })
                        .addButton('cancel', gt('Cancel'), 'cancel',  { 'tabIndex': '1' })
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
                return ox.ui.App.reuse('io.ox/calendar:edit.' + _.cid(data));
            }
        }
    };
});
