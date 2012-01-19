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
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 *
 */

define("io.ox/contacts/edit/main",
    ["io.ox/contacts/api",
     "io.ox/core/cache",
     "io.ox/contacts/edit/view-form",
     "less!io.ox/contacts/style.css"
     ], function (api, cache, viewForm) {

    "use strict";

    function extendDeep(parent, child) {
        var i,
        toStr = Object.prototype.toString, astr = "[object Array]";
        child = child || {};
        for (i in parent) {
            if (parent.hasOwnProperty(i)) {
                if (typeof parent[i] === "object") {
                    child[i] = (toStr.call(parent[i]) === astr) ? [] : {};
                    extendDeep(parent[i], child[i]);
                } else {
                    child[i] = parent[i];
                }
            }
        }
        return child;
    }

    // multi instance pattern
    function createInstance(data) {

        var app, win, container;

        app = ox.ui.createApp({
            name: 'io.ox/contacts/edit',
            title: "Edit Contact"
        });

        app.setLauncher(function () {

            win = ox.ui.createWindow({
                title: "Edit Contact",
                toolbar: true,
                close: true
            });

            app.setWindow(win);

            container = win.nodes.main
                .css({ backgroundColor: '#fff' })
                .scrollable()
                .css({ maxWidth: '600px', margin: '20px auto 20px auto' });

            var cont = function (data) {

                win.show(function () {

                    container.append(viewForm.draw(data, app));
                    container.find('input[type=text]:visible').eq(0).focus();

                    var actions = {
                        save: function () {
                            var formdata = {};
                            // image = paneEdit2.find("#image1").get(0);

                            // select the data
                            // collect all strings
                            container.find('.value input')
                                .each(function (index) {
                                    var value =  $(this).val(),
                                        id = $(this).attr('name');
                                    formdata[id] = value;
                                });
                            // collect anniversary
                            container.find('.value input[name="anniversary"]')
                            .each(function (index) {
                                var value =  $(this).val(),
                                    id = $(this).attr('name'),
                                    dateArray = value.split('.');
                                var date =  Date.UTC(dateArray[2], (--dateArray[1]), (dateArray[0]));
                                if (value !== "") {
                                    formdata[id] = date;
                                }
                            });

                            // collect birthday
                            container.find('.value input[name="birthday"]')
                            .each(function (index) {
                                var value =  $(this).val(),
                                    id = $(this).attr('name'),
                                    dateArray = value.split('.');
                                var date =  Date.UTC(dateArray[2], (--dateArray[1]), (dateArray[0]));
                                if (value !== "") {
                                    formdata[id] = date;
                                }
                            });

                            var timestamp = new Date().getTime();
                            formdata.folderId = data.folder_id;
                            formdata.id = data.id;
                            formdata.timestamp = timestamp;

                          //  if (image.files && image.files[0]) {
                           //     api.editNewImage(JSON.stringify(formdata), image.files[0]);
                           // } else {
                            if (!_.isEmpty(formdata)) {
                                    //console.log(formdata);
                                api.edit(formdata);
                            }
                          //  }
                            app.quit();
                        },

    //                  cancel and quit the update app
                        cancel: function () {
                            app.quit();
                        }
                    };
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

        return app;


    }

    return {
        getApp: createInstance
    };

});