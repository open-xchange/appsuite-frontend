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
     "io.ox/core/commons",
     'less!io.ox/contacts/distrib/style.css'
     ], function (util, api, dialogs, config, forms, ContactModel, ContactCreateDistView, gt, commons) {

    'use strict';

    function createInstance(data, mainapp) {
        var app, getDirtyStatus,
            dirtyStatus = {
                byApi: true
            };
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

            container = win.nodes.main
                .css({ backgroundColor: '#fff' })
                .addClass('create-distributionlist')
                .scrollable()
                .css({ maxWidth: '700px', margin: '20px auto 20px auto' });

            //what about the hash support?
            win.show(function () {

                var myModel = data ? new ContactModel({data: data}) : new ContactModel({data: {}});

                var myView = new ContactCreateDistView({model: myModel});

                getDirtyStatus = function () {
                    var test = myModel.isDirty();
                    return test;
                };

                if (data) {
                    myModel.store = function update(data, changes) {
                        return api.edit({
                            id: data.id,
                            folder: data.folder_id,
                            timestamp: _.now(),
                            data: data //needs a fix in the model for array
                        }).done(function () {
                            dirtyStatus.byApi = false;
                            app.quit();
                        });
                    };
                } else {myModel.store = function create(data, changes) {
                        var fId = mainapp.folder.get();
                        if (!_.isEmpty(data)) {
                            data.folder_id = fId;
                            if (data.display_name === '') {
                                data.display_name =  util.createDisplayName(data);
                            }
                            data.mark_as_distributionlist = true;
                            return api.create(data).done(function () {
                                dirtyStatus.byApi = false;
                                app.quit();
                            });
                        }
                    };
                }

                container.append(myView.draw().node);
                container.find('input[type=text]:visible').eq(0).focus();

            });

//            commons.addFolderSupport(app, null, 'contacts', '6');
        });

        app.setQuit(function () {

            var def = $.Deferred(),
                listetItem =  $('.listet-item');

            dirtyStatus.byModel = getDirtyStatus();

            if (dirtyStatus.byModel === true) {
                if (dirtyStatus.byApi === true) {
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



