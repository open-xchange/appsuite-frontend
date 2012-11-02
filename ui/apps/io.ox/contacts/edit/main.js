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
    ['io.ox/contacts/edit/view-form',
     'io.ox/contacts/model',
     'gettext!io.ox/contacts',
     'io.ox/core/extensions',
     'io.ox/contacts/util',
     'less!io.ox/contacts/edit/style.css'
     ], function (view, model, gt, ext, util) {

    'use strict';

    // multi instance pattern
    function createInstance(data) {

        var app, getDirtyStatus, container;

        app = ox.ui.createApp({
            name: 'io.ox/contacts/edit',
            title: 'Edit Contact'
        });

        app.setLauncher(function () {

            var win;

            win = ox.ui.createWindow({
                name: 'io.ox/contacts/edit',
                title: gt('Edit Contact'),
                toolbar: true,
                close: true
            });

            app.setWindow(win);

            container = win.nodes.main
                .css({ backgroundColor: '#fff' })
                .scrollable()
                .css({ width: '700px', margin: '20px auto 20px auto' });

            var cont = function (data) {

                win.show(function () {
                    var considerSaved = false;
                    // create model & view

                    model.factory.realm('edit').retain().get(data).done(function (contact) {
                        app.contact = contact;
                        var editView = new view.ContactEditView({ model: contact });
                        container.append(editView.render().$el);
                        container.find('input[type=text]:visible').eq(0).focus();

                        editView.on('save:start', function () {
                            win.busy();
                        });

                        editView.on('save:fail', function () {
                            win.idle();
                        });

                        editView.on('save:success', function () {
                            considerSaved = true;
                            win.idle();
                            app.quit();
                        });
                        ext.point('io.ox/contacts/edit/main/model').invoke('customizeModel', contact, contact);
                    });


                    getDirtyStatus = function () {
                        if (considerSaved) {
                            return false;
                        }
                        return app.contact && !_.isEmpty(app.contact.changedSinceLoading());
                    };

                });
            };

            if (data) {
                // hash support
                app.setState({ folder: data.folder_id, id: data.id });
                cont(data);
            } else {
                cont({folder_id: app.getState().folder, id: app.getState().id});
            }
        });

        app.setQuit(function () {
            var def = $.Deferred();

            if (getDirtyStatus()) {
                require(["io.ox/core/tk/dialogs"], function (dialogs) {
                    new dialogs.ModalDialog()
                        .text(gt("Do you really want to discard your changes?"))
                        .addPrimaryButton("delete", gt('Discard'))
                        .addButton("cancel", gt('Cancel'))
                        .show()
                        .done(function (action) {
                            console.debug("Action", action);
                            if (action === 'delete') {
                                def.resolve();
                                model.factory.realm('edit').release();
                            } else {
                                def.reject();
                            }
                        });
                });
            } else {
                def.resolve();
                model.factory.realm('edit').release();
            }
            //clean
            return def;
        });

        return app;
    }

    ext.point('io.ox/contacts/edit/main/model').extend({
        id: 'io.ox/contacts/edit/main/model/auto_display_name',
        customizeModel: function (contact) {
            contact.on('change:first_name change:last_name', function () {
                contact.set('display_name', util.getFullName(contact.toJSON()));
            });
        }
    });

    return {
        getApp: createInstance
    };

});
