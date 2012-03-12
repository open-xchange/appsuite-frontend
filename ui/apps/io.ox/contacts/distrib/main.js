/**
 *
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 *
 */

define('io.ox/contacts/distrib/main',
    ['io.ox/contacts/util', 'io.ox/contacts/api',
     'io.ox/core/tk/dialogs', 'io.ox/core/config',
     'io.ox/core/tk/forms', 'io.ox/contacts/model',
     'io.ox/contacts/distrib/create-dist-view', 'gettext!io.ox/contacts/contacts',
     'less!io.ox/contacts/style.css'
     ], function (util, api, dialogs, config, forms, ContactModel, ContactCreateDistView, gt) {

    'use strict';

    function createInstance(data) {
        var app;
        app = ox.ui.createApp({
            name: 'io.ox/contacts/distrib',
            title: 'Distribution List'
        });

        app.setLauncher(function () {
            var win,
                container, distribState;

            win = ox.ui.createWindow({
                title: 'Distribution list',
                toolbar: true,
                close: true
            });

            app.setWindow(win);

            app.STATES = {
                    'CLEAN': 1,
                    'DIRTY': 2
                };

            distribState = app.STATES.CLEAN;

            app.getState = function () {
                return distribState;
            };

            app.markDirty = function () {
                distribState = app.STATES.DIRTY;
            };

            app.markClean = function () {
                distribState = app.STATES.CLEAN;
            };

            container = win.nodes.main
                .css({ backgroundColor: '#fff' })
                .addClass('create-distributionlist')
                .scrollable()
                .css({ maxWidth: '700px', margin: '20px auto 20px auto' });

            //what about the hash support?
            win.show(function () {

                var myModel = data ? new ContactModel({data: data}) : new ContactModel({data: {}});

                var myView = new ContactCreateDistView({model: myModel});

                if (data) {
                    myModel.store = function update(data, changes) {
                        console.log(myModel.isDirty());
                        return api.edit({
                            id: data.id,
                            folder: data.folder_id,
                            timestamp: _.now(),
                            data: data //needs a fix in the model for array
                        }).done(function () {
                            app.markClean();
                            app.quit();
                        });
                    };
                } else {myModel.store = function create(data, changes) {
                        console.log(changes);
                        var fId = config.get("folder.contacts");
                        if (!_.isEmpty(data)) {
                            data.folder_id = fId;
                            if (data.display_name === '') {
                                data.display_name =  util.createDisplayName(data);
                            }
                            data.mark_as_distributionlist = true;
                            return api.create(data).done(function () {
                                app.markClean();
                                app.quit();
                            });
                        }
                    };
                }

                container.append(myView.draw().node);
                container.find('input[type=text]:visible').eq(0).focus();

            });

        });
        app.setQuit(function () {

            var def = $.Deferred();
            var intemList =  $('.item-list');


            console.log(app.getState());

            if (app.getState() !== app.STATES.CLEAN) {
                require(["io.ox/core/tk/dialogs"], function (dialogs) {
                    new dialogs.ModalDialog()
                        .text(gt("Do you really want to cancel editing this distributionlist?"))
                        .addButton("cancel", gt('Cancel'))
                        .addButton("delete", gt('Lose changes'))
                        .show()
                        .done(function (action) {
                            console.debug("Action", action);
                            if (action === 'delete') {
                                def.resolve();
                                intemList.empty();
                            } else {
                                def.reject();
                            }
                        });
                });
            } else {
                def.resolve();
                intemList.empty();
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



