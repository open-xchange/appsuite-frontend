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

define('io.ox/tasks/edit/main',
    ['gettext!io.ox/tasks',
     'io.ox/core/extensions',
     'io.ox/tasks/model',
     'io.ox/tasks/edit/view',
     'io.ox/core/extPatterns/dnd',
     'less!io.ox/tasks/edit/style.less'
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
                    defaults = model.defaults;
                check = !(_.isEqual(data, defaults));
            }

            //now check if something changed with the attachments
            var attachmentList = taskView.baton.attachmentList;
            if ((attachmentList.attachmentsToAdd.length > 0) || (attachmentList.attachmentsToDelete.length > 0)) {
                check = true;
            }
            return check;
        };

        app.markClean = function () {
            taskState = app.STATES.CLEAN;
        };

        // launcher
        app.setLauncher(function (options) {
            //close notification area when edit task is opened to prevent overlapping if started from notification area
            require(['io.ox/core/notifications'], function (notifications) {
                notifications.hideList();
            });
            var taskData = options.taskData;
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
            //ModelView
            if (taskData && taskData.id) {
                this.edit = true;
                app.cid = 'io.ox/tasks:edit.' + _.cid(taskData);
                model.factory.realm('edit').retain().get(taskData).done(function (task) {
                    app.model = taskModel = task;
                    taskModel.getParticipants();
                    app.view = taskView = view.getView(taskModel, win.nodes.main, app);
                });
            } else {
                app.attributes.title = gt('Create task');
                app.model = taskModel = model.factory.create();
                if (options.folderid) {//on reload there is no options.folderid so it would crash on saving. Leave default
                    options.folderid = parseInt(options.folderid, 10);//folderId is sometimes a String but must be a number else the discard buttons thinks this is a missmatch to the defaults
                    taskModel.set('folder_id', options.folderid, {validate: true});
                }
                app.view = taskView = view.getView(taskModel, win.nodes.main, app);
            }
            if (_.browser.IE === undefined || _.browser.IE > 9) {
                self.dropZone = new dnd.UploadZone({
                    ref: 'io.ox/tasks/edit/dnd/actions'
                }, taskView);
            }

            win.on('show', function () {
                if (app.dropZone) {app.dropZone.include(); }
                if (taskView) {
                    taskView.$el.find('.title-field').focus();
                }
            });

            win.on('hide', function () {
                if (app && app.dropZone) {
                    app.dropZone.remove();
                }
            });

            //ready for show
            win.show();
        });

        // Popup on close
        app.setQuit(function () {
            var def = $.Deferred();
            var clean = function () {
                // clear private vars
                taskView.trigger('dispose');
                taskModel.off();//important so no events are executed on non existing models
                if (app.dropZone) {app.dropZone.remove(); }
                app = win = taskModel = taskView = null;
            };

            if (app.isDirty()) {
                require(['io.ox/core/tk/dialogs'], function (dialogs) {
                    new dialogs.ModalDialog()
                        .text(gt('Do you really want to discard your changes?'))
                        .addPrimaryButton('delete', gt('Discard changes'))
                        .addButton('cancel', gt('Cancel'))
                        .show()
                        .done(function (action) {
                            if (action === 'delete') {
                                clean(); // clean before resolve, otherwise tinymce gets half-destroyed (ugly timing)
                                model.factory.realm('edit').release();//old model no longer needed
                                def.resolve();
                            } else {
                                def.reject();
                            }
                        });
                });
            } else {
                if (app.edit) {
                    clean();
                    model.factory.realm('edit').release();//old model no longer needed
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
            var df = $.Deferred();
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
            df.resolve();
            return df;
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
