/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define('io.ox/contacts/distrib/main',
    ['io.ox/contacts/api',
     'io.ox/contacts/model',
     'io.ox/contacts/distrib/create-dist-view',
     'gettext!io.ox/contacts',
     'io.ox/contacts/util',
     'less!io.ox/contacts/distrib/style.css'
     ], function (api, contactModel, ContactCreateDistView, gt, util) {

    'use strict';

    // multi instance pattern
    function createInstance(data, mainapp) {

        var app,
            win,
            container,
            model,
            view,
            considerSaved = false,
            initialDistlist;

        app = ox.ui.createApp({
            name: 'io.ox/contacts/distrib',
            title: 'Distribution List',
            userContent: true
        });

        app.create = function (folderId, initdata) {

            initialDistlist = {
                folder_id: folderId,
                mark_as_distributionlist: true,
                last_name: ''
            };

            // set title, init model/view
            win.setTitle(gt('Create distribution list'));

            if (initdata) {
                model = contactModel.factory.create({
                    folder_id: folderId,
                    mark_as_distributionlist: true,
                    distribution_list: initdata.distribution_list,
                    last_name: ''
                });
            } else {
                model = contactModel.factory.create(initialDistlist);
            }

            view = new ContactCreateDistView({ model: model });

            view.on('save:start', function () {
                win.busy();
            });

            view.on('save:fail', function () {
                win.idle();
            });

            view.on('save:success', function () {

                considerSaved = true;
                win.idle();
                app.quit();
            });

            // go!
            container.append(view.render().$el);
            win.show();
        };

        app.edit = function (obj) {

            app.cid = 'io.ox/contacts/group:edit.' + _.cid(obj);
            return contactModel.factory.realm("edit").retain().get(obj).done(function (data) {

                // actually data IS a model
                model = data;

                // set state
                app.setState({ folder: model.get('folder_id'), id: model.get('id') });

                app.setTitle(model.get('display_name'));

                view = new ContactCreateDistView({ model: model });

                view.on('save:start', function () {
                    win.busy();
                });

                view.on('save:fail', function () {
                    win.idle();
                });

                view.on('save:success', function () {
                    considerSaved = true;
                    win.idle();
                    app.quit();
                });

                // go!
                container.append(view.render().$el);
                win.show();
            });
        };

        app.setLauncher(function () {

            app.setWindow(win = ox.ui.createWindow({
                title: '',
                chromeless: true,
                name: 'io.ox/contacts/distrib'
            }));

            win.on('show', function () {
                container.find('input[type=text]:visible').eq(0).focus();
                container.find('[data-extension-id="displayname"] input').on('keydown', function () {
                    var title = _.noI18n($.trim($(this).val()));
                    app.setTitle(title);
                });
            });

            container = win.nodes.main
                .addClass('create-distributionlist')
                .scrollable()
                .css({ width: '700px', margin: '20px auto 20px auto' });

            // hash state support
            var state = app.getState();
            if ('id' in state) {
                app.edit(state);
            } else if ('folder' in state) {
                app.create(state.folder);
            }
        });

        app.setQuit(function () {
            var def = $.Deferred();
            if (model.isDirty() && considerSaved === false) {
                if (_.isEqual(initialDistlist, model.changedSinceLoading())) {
                    def.resolve();
                } else {
                    require(["io.ox/core/tk/dialogs"], function (dialogs) {
                        new dialogs.ModalDialog()
                            .text(gt("Do you really want to discard your changes?"))
                            .addPrimaryButton("delete", gt('Discard'))
                            .addButton("cancel", gt('Cancel'))
                            .show()
                            .done(function (action) {
                                console.debug("Action", action);
                                if (action === 'delete') {
                                    model.factory.realm('edit').release();
                                    def.resolve();
                                } else {
                                    def.reject();
                                }
                            });
                    });
                }

            } else {
                model.factory.realm('edit').release();
                def.resolve();
            }

            //clean
            return def;
        });

        return app;
    }

    return {

        getApp: createInstance,

        reuse: function (type, data) {
            if (type === 'edit') {
                return ox.ui.App.reuse('io.ox/contacts/group:edit.' + _.cid(data));
            }
        }
    };

});



