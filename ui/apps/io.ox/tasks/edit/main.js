/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/tasks/edit/main', [
    'gettext!io.ox/tasks',
    'io.ox/core/extensions',
    'io.ox/tasks/model',
    'io.ox/tasks/edit/view',
    'io.ox/tasks/api',
    'less!io.ox/tasks/edit/style'
], function (gt, ext, model, view, api) {

    'use strict';

    function createApp() {
        // application object
        var app = ox.ui.createApp({
                name: 'io.ox/tasks/edit',
                title: gt('Create task'),
                userContent: true,
                closable: true,
                floating: !_.device('smartphone')
            }),
            // app window
            win,
            //app
            self,
            //state
            taskState,
            //Model View
            taskModel,
            taskView;

        //edit or new
        app.edit = false;

        app.STATES = {
            'CLEAN': 1,
            'DIRTY': 2
        };

        app.getState = function () {
            return taskState;
        };

        app.markDirty = function () {
            taskState = app.STATES.DIRTY;
        };

        app.markClean = function () {
            taskState = app.STATES.CLEAN;
        };

        app.isDirty = function () {
            var check = true;
            //marked as clean overides check
            if (taskState === app.STATES.CLEAN) {
                return false;
            }
            //check attributes
            if (this.edit) {
                check = taskModel.isDirty();
            } else {
                //check if only default Values are present
                var data = taskModel.changedSinceLoading(),
                    defaults = _.copy(model.defaults);
                // default folder_id does not matter here (wrong in every folder beside the default folder), so make it equal
                defaults.folder_id = data.folder_id;

                check = !(_.isEqual(data, defaults));
            }

            //now check if something changed with the attachments
            var attachmentList = taskView.baton.attachmentList;
            if (attachmentList && ((attachmentList.attachmentsToAdd.length > 0) || (attachmentList.attachmentsToDelete.length > 0))) {
                check = true;
            }
            return check;
        };

        // launcher
        app.setLauncher(function (options) {
            //close notification area when edit task is opened to prevent overlapping if started from notification area
            require(['io.ox/core/notifications'], function (notifications) {
                notifications.dropdown.close();
            });

            // sometimes taskdata is wrapped inside an array
            var taskData = _.isArray(options.taskData) && options.taskData.length === 1 ? options.taskData[0] : options.taskData,
                startApp = function () {
                    app.view = taskView = view.getView(taskModel, win.nodes.main, app);
                    //ready for show
                    win.show();
                };

            self = this;
            self.markDirty();
            // get window
            win = ox.ui.createWindow({
                name: 'io.ox/tasks/edit',
                chromeless: true,
                floating: !_.device('smartphone'),
                closable: true,
                title: taskData && taskData.id ? gt('Edit task') : gt('Create task')
            });

            win.addClass('io-ox-tasks-edit-main');
            app.setWindow(win);
            win.nodes.main.addClass('scrollable');

            win.on('show', function () {
                // no autofocus on smartphone and for iOS in special (see bug #36921)
                if (taskView && _.device('!smartphone && !iOS')) {
                    taskView.$el.find('.title-field').focus();
                }
                //set url parameters
                if (taskModel.get('id')) {
                    self.setState({ folder: taskModel.attributes.folder_id, id: taskModel.attributes.id });
                } else {
                    self.setState({ folder: taskModel.attributes.folder_id, id: null });
                }
            });


            //ModelView
            if (taskData && taskData.id) {
                this.edit = true;
                app.cid = 'io.ox/tasks:edit.' + _.cid(taskData);

                // get fresh data to see if the task changed meanwhile
                api.get({ id: taskData.id, folder_id: taskData.folder_id || taskData.folder }, false).done(function (task) {
                    if (taskData.last_modified !== task.last_modified) {
                        // clear cashes
                        var key = _.cid(taskData);
                        api.removeFromCache(key).then(function () {
                            api.caches.all.clear();

                            app.model = taskModel = model.factory.create(task);
                            taskModel.getParticipants();

                            startApp();
                        });
                    } else {
                        app.model = taskModel = model.factory.create(task);
                        taskModel.getParticipants();

                        startApp();
                    }
                });
            } else {
                app.attributes.title = gt('Create task');
                app.model = taskModel = model.factory.create();
                //on reload there is no options.folderid so it would crash on saving. Leave default
                if (options.folderid) {
                    //folderId is sometimes a String but must be a number else the discard buttons thinks this is a missmatch to the defaults
                    options.folderid = parseInt(options.folderid, 10);
                    taskModel.set('folder_id', options.folderid, { validate: true });
                }

                startApp();
            }
        });

        // Popup on close
        app.setQuit(function () {
            var def = $.Deferred();
            var clean = function () {
                // clear private vars
                taskView.trigger('dispose');
                //important so no events are executed on non existing models
                taskModel.off();
                app = win = taskModel = taskView = null;
            };

            if (app.isDirty()) {
                require(['io.ox/backbone/views/modal'], function (ModalDialog) {
                    if (app.getWindow().floating) {
                        app.getWindow().floating.toggle(true);
                    } else if (_.device('smartphone')) {
                        app.getWindow().resume();
                    }
                    //#. 'Discard changes' as header of a modal dialog to confirm to discard changes of a new or edited task.
                    new ModalDialog({ title: gt('Discard changes'), description: gt('Do you really want to discard your changes?') })
                        .addCancelButton()
                        //#. "Discard changes" appears in combination with "Cancel" (this action)
                        //#. Translation should be distinguishable for the user
                        .addButton({ label: gt.pgettext('dialog', 'Discard changes'), action: 'delete' })
                        .on('delete', function () {
                            // clean before resolve
                            clean();
                            //old model no longer needed
                            model.factory.realm('edit').release();
                            def.resolve();
                        })
                        .on('cancel', function () { def.reject(); })
                        .open();
                });
            } else if (app.edit) {
                clean();
                def.resolve();
            } else {
                clean();
                def.resolve();
            }

            return def;
        });

        app.failSave = function () {
            if (this.model) {
                var title = this.attributes.title;
                return {
                    description: gt('Task') + (title ? ': ' + title : ''),
                    module: 'io.ox/tasks/edit',
                    point: this.model.attributes
                };
            }
            return false;
        };

        app.failRestore = function (point) {
            this.markDirty();

            this.view.autoOpen(point);
            var participants = point.participants || [];
            delete point.participants;

            this.model.set(point);
            this.model.set('participants', participants, { silent: true });
            this.model.getParticipants().addUniquely(participants);

            // if we have an id switch to edit mode
            if (!_.isUndefined(point.id)) {
                this.edit = true;
                this.view.trigger('changeMode', 'edit');
                this.cid = 'io.ox/tasks:edit.' + _.cid(point);
            }
            // trigger blur so apptitle and save button disabled state is updated
            this.view.$el.find('.title-field').trigger('blur');
            return $.when();
        };

        app.getContextualHelp = function () {
            return 'ox.appsuite.user.sect.tasks.gui.create.html';
        };

        return app;
    }

    return {

        getApp: createApp,

        reuse: function (type, data) {
            if (type === 'edit') {
                return ox.ui.App.reuse('io.ox/tasks:edit.' + _.cid(data));
            }
        }
    };
});
