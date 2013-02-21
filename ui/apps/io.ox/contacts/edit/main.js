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
     'io.ox/core/extPatterns/dnd',
     'less!io.ox/contacts/edit/style.css'
     ], function (view, model, gt, ext, util, dnd) {

    'use strict';

    // multi instance pattern
    function createInstance(data) {

        var app, getDirtyStatus, container;

        app = ox.ui.createApp({
            name: 'io.ox/contacts/edit',
            title: 'Edit Contact',
            userContent: true
        });

        app.setLauncher(function (def) {

            var win = ox.ui.createWindow({
                name: 'io.ox/contacts/edit',
                title: 'Edit Contact',
                chromeless: true
            });

            app.setWindow(win);

            container = win.nodes.main
                .css({ backgroundColor: '#fff' })
                .scrollable()
                .css({ width: '700px', margin: '20px auto 20px auto' });

            var cont = function (data) {

                app.cid = 'io.ox/contacts/contact:edit.' + _.cid(data);

                win.show(function () {
                    var considerSaved = false,
                        handelContact = function (contact) {
                            var appTitle = (contact.get('display_name')) ? contact.get('display_name') : util.getFullName(contact.toJSON());
                            app.setTitle(appTitle || gt('Create contact'));
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

                            editView.on('save:success', function (e, data) {
                                if (def.resolve) {
                                    def.resolve(data);
                                }
                                considerSaved = true;
                                win.idle();
                                if (app.dropZone) {app.dropZone.remove(); }
                                app.quit();
                            });
                            
                            if (_.browser.IE === undefined || _.browser.IE > 9) {
                                app.dropZone = new dnd.UploadZone({
                                    ref: 'io.ox/contacts/edit/dnd/actions'
                                }, editView);
                            }

                            win.on('show', function () {
                                if (app.dropZone) {app.dropZone.include(); }
                            });

                            win.on('hide', function () {
                                if (app && app.dropZone) {
                                    app.dropZone.remove();
                                }
                            });
                            
                            ext.point('io.ox/contacts/edit/main/model').invoke('customizeModel', contact, contact);

                            contact.on('change:display_name', function () {
                                app.setTitle(contact.get('display_name'));
                            });
                        };

                    // create model & view

                    if (data.id) {
                        model.factory.realm('edit').retain().get(data).done(function (contact) {
                            handelContact(contact);
                        });
                    } else {
                        handelContact(model.factory.create(data));
                        container.find('[data-extension-id="io.ox/contacts/edit/view/display_name_header"]').text(gt('New contact'));
                    }

                    getDirtyStatus = function () {
                        var changes = app.contact.changedSinceLoading();
                        if (considerSaved) {
                            return false;
                        }
                        if (changes.folder_id && _(changes).size() === 1) {
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

        ext.point('io.ox/contacts/edit/main/model').extend({
            id: 'io.ox/contacts/edit/main/model/auto_display_name',
            customizeModel: function (contact) {
                contact.on('change:first_name change:last_name change:title', function () {
                    contact.set('display_name', util.getFullName(contact.toJSON()));
                });
            }
        });

        return app;
    }

    return {

        getApp: createInstance,

        reuse: function (type, data) {
            if (type === 'edit') {
                return ox.ui.App.reuse('io.ox/contacts/contact:edit.' + _.cid(data));
            }
        }
    };

});
