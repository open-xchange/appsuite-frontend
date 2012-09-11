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
     'gettext!io.ox/contacts/contacts',
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
            view;

        app = ox.ui.createApp({
            name: 'io.ox/contacts/distrib',
            title: 'Distribution List'
        });

        function show() {

            win.show(function () {
                container.append(view.render().$el)
                    .find('input[type=text]:visible').eq(0).focus();
            });

        }

        app.create = function (folderId) {
            // set state
            app.setState({ folder: folderId });
            // set title, init model/view
            win.setTitle(gt('Create distribution list'));
            model = contactModel.factory.create({
                folder_id: folderId,
                mark_as_distributionlist: true
            });
            view = new ContactCreateDistView({ model: model });
            // go!
            show();
            return $.when();
        };

        app.edit = function (obj) {
            // load list first
            return model.factory.getRealm("edit").get(obj).done(function (data) {
                model = data;
                // set state
                app.setState({ folder: data.folder_id, id: data.id });
                // set title, init model/view
                win.setTitle(gt('Edit distribution list'));
                view = new ContactCreateDistView({ model: model });
                // go!
                show();
            });
        };

        app.setLauncher(function () {

            app.setWindow(win = ox.ui.createWindow({ title: '', toolbar: true, close: true }));

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
            
            if (model.isDirty()) {
                require(["io.ox/core/tk/dialogs"], function (dialogs) {
                    new dialogs.ModalDialog()
                        .text(gt("Do you really want to lose your changes?"))
                        .addButton("cancel", gt('Cancel'))
                        .addPrimaryButton("delete", gt('Lose changes'))
                        .show()
                        .done(function (action) {
                            console.debug("Action", action);
                            if (action === 'delete') {
                                def.resolve();
                            } else {
                                def.reject();
                            }
                        });
                });
            } else {
                def.resolve();
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



