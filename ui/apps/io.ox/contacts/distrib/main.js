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
     'io.ox/contacts/distrib/create-dist-view', 'less!io.ox/contacts/style.css'
     ], function (util, api, dialogs, config, forms, ContactModel, ContactCreateDistView) {

    'use strict';

    function createInstance(data) {
        var app;
        app = ox.ui.createApp({
            name: 'io.ox/contacts/distrib',
            title: 'Create Distrib'
        });

        app.setLauncher(function () {
            var win,
                container;

            win = ox.ui.createWindow({
                title: 'Create Distrib',
                toolbar: true,
                close: true
            });

            app.setWindow(win);

            container = win.nodes.main
                .css({ backgroundColor: '#fff' })
                .addClass('create-distributionlist')
                .scrollable()
                .css({ maxWidth: '600px', margin: '20px auto 20px auto' });

            //what about the hash support?
            win.show(function () {

                var myModel = data ? new ContactModel({data: data}) : new ContactModel({data: {}});

                var myView = new ContactCreateDistView({model: myModel});

                if (data) {
                    myModel.store = function update(data, changes) {
                        return api.edit({
                            id: data.id,
                            folder: data.folder_id,
                            timestamp: _.now(),
                            data: data //needs a fix in the model for array
                        });
                    };
                } else { myModel.store = function create(data, changes) {
                        var fId = config.get("folder.contacts");
                        if (!_.isEmpty(data)) {
                            data.folder_id = fId;
                            if (data.display_name === '') {
                                data.display_name =  util.createDisplayName(data);
                            }
                            data.mark_as_distributionlist = true;
                            return api.create(data);
                        }
                    };
                }

                container.append(myView.draw().node);

            });

        });
        app.setQuit(function () {

            //clean
            $('.item-list').empty();
        });
        return app;
    }

    return {
        getApp: createInstance
    };

});



