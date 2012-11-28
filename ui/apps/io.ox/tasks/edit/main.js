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
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define("io.ox/tasks/edit/main", ['gettext!io.ox/tasks',
                                 'io.ox/core/extensions',
                                 'io.ox/tasks/model',
                                 'io.ox/tasks/edit/view',
                                 'io.ox/core/extPatterns/dnd',
                                 'less!io.ox/tasks/edit/style.css'],
                                 function (gt, ext, model, view, dnd) {

    "use strict";

    function createApp() {
        // application object
        var app = ox.ui.createApp({ name: 'io.ox/tasks/edit', title: gt("Edit task"), userContent: true }),
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

        // launcher
        app.setLauncher(function (options) {
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
            win.nodes.main.addClass("scrollable");
            //ModelView
            if (taskData) {
                this.edit = true;
                model.factory.realm('edit').retain().get(taskData).done(function (task) {
                    taskModel = task;
                    taskModel.getParticipants();
                    taskView = view.getView(taskModel, win.nodes.main, app);
                });
            } else {
                app.attributes.title = gt("Create task");
                taskModel = model.factory.create();
                taskView = view.getView(taskModel, win.nodes.main, app);
            }
            self.dropZone = new dnd.UploadZone({
                ref: "io.ox/tasks/edit/dnd/actions"
            }, taskView);

            win.on('show', function () {
                app.dropZone.include();
                if (taskView) {
                    taskView.$el.find(".title-field").focus();
                }
            });

            win.on('hide', function () {
                if (app) {
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
                app.dropZone.remove();
                app = win = taskModel = taskView = null;
            };

            if (app.getState() === app.STATES.DIRTY) {
                require(["io.ox/core/tk/dialogs"], function (dialogs) {
                    new dialogs.ModalDialog()
                        .text(gt("Do you really want to discard your changes?"))
                        .addPrimaryButton("delete", gt('Discard changes'))
                        .addButton("cancel", gt('Cancel'))
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
                    require(['io.ox/tasks/api'], function (api) {
                        api.trigger("update:" + taskModel.attributes.folder_id + '.' + taskModel.attributes.id);
                        clean();
                        model.factory.realm('edit').release();//old model no longer needed
                        def.resolve();
                    });
                } else {
                    clean();
                    def.resolve();
                }
            }

            return def;
        });
        return app;
    }

    return {
        getApp: createApp
    };
});
