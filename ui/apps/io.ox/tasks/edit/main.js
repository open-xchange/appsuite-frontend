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
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/tasks/edit/main', [
    'gettext!io.ox/tasks',
    'io.ox/core/extensions',
    'io.ox/tasks/model',
    'io.ox/tasks/edit/view',
    'io.ox/core/extPatterns/dnd',
    'less!io.ox/tasks/edit/style'
], function (gt, ext, model, view, dnd) {

    'use strict';

    function createApp() {
        // application object
        var app = ox.ui.createApp({ name: 'io.ox/tasks/edit', title: gt('Edit task'), userContent: true, closable: true }),
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
                notifications.hide();
            });

            var taskData = options.taskData,
                startApp = function () {
                    app.view = taskView = view.getView(taskModel, win.nodes.main, app);

                    if (_.browser.IE === undefined || _.browser.IE > 9) {
                        self.dropZone = new dnd.UploadZone({
                            ref: 'io.ox/tasks/edit/dnd/actions'
                        }, taskView);
                    }
                    //ready for show
                    win.show();
                };

            self = this;
            self.markDirty();
            // get window
            win = ox.ui.createWindow({
                name: 'io.ox/tasks/edit',
                chromeless: true
            });

            win.addClass('io-ox-tasks-edit-main');
            app.setWindow(win);
            win.nodes.main.addClass('scrollable');

            win.on('show', function () {
                if (app.dropZone) {app.dropZone.include(); }
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

            win.on('hide', function () {
                if (app && app.dropZone) {
                    app.dropZone.remove();
                }
            });

            //ModelView
            if (taskData && taskData.id) {
                this.edit = true;
                app.cid = 'io.ox/tasks:edit.' + _.cid(taskData);

                model.factory.realm('edit').retain().get(taskData).done(function (task) {
                    app.model = taskModel = task;
                    taskModel.getParticipants();

                    startApp();
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
                if (app.dropZone) {app.dropZone.remove(); }
                app = win = taskModel = taskView = null;
            };

            if (app.isDirty()) {
                require(['io.ox/core/tk/dialogs'], function (dialogs) {
                    new dialogs.ModalDialog()
                        .text(gt('Do you really want to discard your changes?'))
                        //#. "Discard changes" appears in combination with "Cancel" (this action)
                        //#. Translation should be distinguishable for the user
                        .addPrimaryButton('delete', gt.pgettext('dialog', 'Discard changes'), 'delete', { tabIndex: 1 })
                        .addButton('cancel', gt('Cancel'), 'cancel', { tabIndex: 1 })
                        .show()
                        .done(function (action) {
                            if (action === 'delete') {
                                // clean before resolve
                                clean();
                                //old model no longer needed
                                model.factory.realm('edit').release();
                                def.resolve();
                            } else {
                                def.reject();
                            }
                        });
                });
            } else {
                if (app.edit) {
                    clean();
                    //old model no longer needed
                    model.factory.realm('edit').release();
                    def.resolve();
                } else {
                    clean();
                    def.resolve();
                }
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
            if (_.isUndefined(point.id)) {
                this.model.set(point);
            } else {
                this.model.set(point);
                this.edit = true;
                this.view.trigger('changeMode', 'edit');
                this.cid = 'io.ox/tasks:edit.' + _.cid(point);
                this.setTitle(point.title || gt('Edit task'));
            }
            return $.when();
        };

        app.getContextualHelp = function () {
            return 'ox.appsuite.user.sect.tasks.gui.html#ox.appsuite.user.reference.tasks.gui.create';
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
