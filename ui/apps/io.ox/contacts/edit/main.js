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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/contacts/edit/main',
    ['io.ox/contacts/api',
     'io.ox/core/cache',
     'io.ox/contacts/edit/view-form',
     'io.ox/contacts/model',
     'gettext!io.ox/contacts/contacts',
     'less!io.ox/contacts/edit/style.css'
     ], function (api, cache, ContactEditView, ContactModel, gt) {

    'use strict';

    // multi instance pattern
    function createInstance(data) {

        var app, getDirtyStatus, container,
            dirtyStatus = {
            byApi: true
        };

        app = ox.ui.createApp({
            name: 'io.ox/contacts/edit',
            title: 'Edit Contact'
        });

        app.setLauncher(function () {

            var win;

            win = ox.ui.createWindow({
                title: 'Edit Contact',
                toolbar: true,
                close: true
            });

            app.setWindow(win);

            container = win.nodes.main
                .css({ backgroundColor: '#fff' })
                .scrollable()
                .css({ width: '600px', margin: '20px auto 20px auto' });

            var cont = function (data) {

                win.show(function () {

                    // create model & view
                    var model = new ContactModel({ data: data }),
                        view = new ContactEditView({ model: model });

                    getDirtyStatus = function () {
                        return model.dirty || model.isDirty();
                    };

                    model.store = function (data, changes) {
                        // TODO: replace image upload with a field in formsjs method
                        var image = view.node.find('input[name="picture-upload-file"][type="file"]').get(0);
                        view.node.find('#myGrowl').jGrowl('shutdown');
                        if (image.files && image.files[0]) {
                            return api.editNewImage(data, changes, image.files[0])
                                .done(function () {
                                    dirtyStatus.byApi = false;
                                    view.destroy();
                                    app.quit();
                                })
                                .fail(function (e) {
                                    $.alert(gt('Could not save contact'), e.error)
                                        .insertAfter(view.node.find('.section.formheader'));
                                });
                        } else {
                            return api.edit({
                                    id: data.id,
                                    folder: data.folder_id,
                                    timestamp: _.now(),
                                    data: changes
                                })
                                .done(function () {
                                    dirtyStatus.byApi = false;
                                    view.destroy(); // TODO: solving trouble with model
                                    app.quit();
                                });
                        }
                    };

                    container.append(view.draw(app).node);
                    container.find('input[type=text]:visible').eq(0).focus();
                });
            };

            if (data) {
                // hash support
                app.setState({ folder: data.folder_id, id: data.id });
                cont(data);
            } else {
                api.get(app.getState()).done(cont);
            }
        });

        app.setQuit(function () {
            var def = $.Deferred();
            dirtyStatus.byModel = getDirtyStatus();

            if (dirtyStatus.byModel === true) {
                if (dirtyStatus.byApi === true) {
                    require(["io.ox/core/tk/dialogs"], function (dialogs) {
                        new dialogs.ModalDialog()
                            .text(gt("Do you really want to lose your changes?"))
                            .addPrimaryButton("delete", gt('Lose changes'))
                            .addButton("cancel", gt('Cancel'))
                            .show()
                            .done(function (action) {
                                console.debug("Action", action);
                                if (action === 'delete') {
                                    def.resolve();
                                    container.find('#myGrowl').jGrowl('shutdown');
                                } else {
                                    def.reject();
                                }
                            });
                    });
                } else {
                    def.resolve();
                    container.find('#myGrowl').jGrowl('shutdown');
                }
            } else {
                def.resolve();
                container.find('#myGrowl').jGrowl('shutdown');
            }
            //clean
            return def;
        });

        return app;
    }

    return {
        getApp: createInstance
    };

});
