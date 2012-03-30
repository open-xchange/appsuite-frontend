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
     ], function (api, ContactModel, ContactCreateDistView, gt, util) {

    'use strict';

    // multi instance pattern
    function createInstance(data, mainapp) {

        var app,
            win,
            container,
            dirtyStatus = { byApi: true },
            model,
            view;

        app = ox.ui.createApp({
            name: 'io.ox/contacts/distrib',
            title: 'Distribution List'
        });

        function show() {

            win.show(function () {
                container.append(view.draw().node)
                    .find('input[type=text]:visible').eq(0).focus();
            });

            model.on('save:progress', win.busy)
                .on('save:done save:fail', win.idle);
        }

        app.create = function (folderId) {
            // set state
            app.setState({ folder: folderId });
            // set title, init model/view
            win.setTitle(gt('Create distribution list'));
            model = new ContactModel();
            view = new ContactCreateDistView({ model: model });
            // define store
            model.store = function (data, changes) {
                if (!_.isEmpty(data)) {
                  //sort the array if not empty before save

                    if (data.distribution_list) {
                        data.distribution_list = data.distribution_list.sort(util.nameSort);
                    }
                    data.folder_id = folderId;
                    data.mark_as_distributionlist = true;
                    if (data.display_name === '') {
                        // TODO: throw proper user alert
                        data.display_name = 'Unnamed';
                    }
                    return api.create(data)
                        .done(function () {
                            dirtyStatus.byApi = false;
                            app.quit();
                        });
                }
            };
            // go!
            show();
            return $.when();
        };

        app.edit = function (obj) {
            // load list first
            return api.get(obj).done(function (data) {
                // set state
                app.setState({ folder: data.folder_id, id: data.id });
                // set title, init model/view
                win.setTitle(gt('Edit distribution list'));
                model = new ContactModel({ data: data });
                view = new ContactCreateDistView({ model: model });
                // define store
                model.store = function (data, changes) {
                    //sort the array before save if not empty
                    if (data.distribution_list) {
                        data.distribution_list = data.distribution_list.sort(util.nameSort);
                    }
                    return api.edit({
                            id: data.id,
                            folder: data.folder_id,
                            timestamp: _.now(),
                            data: {
                                // just the potential changes
                                display_name: data.display_name,
                                distribution_list: data.distribution_list
                            }
                        })
                        .done(function () {
                            dirtyStatus.byApi = false;
                            app.quit();
                        });
                };
                // go!
                show();
            });
        };

        app.setLauncher(function () {

            app.setWindow(win = ox.ui.createWindow({ title: '', toolbar: true, close: true }));

            container = win.nodes.main
                .addClass('create-distributionlist')
                .scrollable()
                .css({ maxWidth: '700px', margin: '20px auto 20px auto' });

            // hash state support
            var state = app.getState();
            if ('id' in state) {
                app.edit(state);
            } else if ('folder' in state) {
                app.create(state.folder);
            }
        });

        app.setQuit(function () {

            var def = $.Deferred(),
                listetItem =  $('.listet-item');

            dirtyStatus.byModel = model.isDirty();

            if (dirtyStatus.byModel === true) {
                if (dirtyStatus.byApi === true) {
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
                                    listetItem.remove();
                                } else {
                                    def.reject();
                                }
                            });
                    });
                } else {
                    def.resolve();
                    listetItem.remove();
                }
            } else {
                def.resolve();
                listetItem.remove();
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



