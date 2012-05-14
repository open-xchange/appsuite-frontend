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
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 */
/*global
define: true, _: true
*/
define('io.ox/settings/accounts/email/settings',
      ['io.ox/core/extensions',
       'io.ox/settings/utils',
       'io.ox/core/api/account',
       'io.ox/settings/accounts/email/model',
       'io.ox/settings/accounts/email/view-form',
       'io.ox/core/tk/dialogs'
       ], function (ext, utils, api, AccountModel, AccountDetailView, dialogs) {
    'use strict';



    ext.point("io.ox/settings/accounts/email/settings/detail").extend({
        index: 200,
        id: "emailaccountssettings",
        draw: function (evt) {
            var data,
                myModel,
                myView;
            if (evt.data.id) {
                api.get(evt.data.id).done(function (obj) {
                    data = obj;
                    myModel = new AccountModel({data: data});
                    myView = new AccountDetailView({model: myModel});
                    myView.node = $("<div>").addClass("accountDetail");
                    myView.dialog = new dialogs.SidePopup('800').show(evt, function (pane) {
                        var myout = myView.draw();
                        pane.append(myout);


                    });

                    myModel.store = function (data) {
                        console.log('store update');
                        // add folder id
//                        data.folder_id = app.folder.get();
                        // has file?
//                        var image = view.node.find('input[name="picture-upload-file"][type="file"]').get(0);
                        return api.create(data);
                    };
                    return myView.node;
                });
            } else {
                myModel = new AccountModel();
                myView = new AccountDetailView({model: myModel});
                myView.node = $("<div>").addClass("accountDetail");
                myView.dialog = new dialogs.SidePopup('800').show(evt, function (pane) {
                    var myout = myView.draw();
                    pane.append(myout);

                });
                myView.dialog.nodes.click.on('close', function () {
                    console.log('geht');
                    myModel.save();
                });
                myModel.store = function (data) {
                    console.log('store new');
                    // add folder id
//                    data.folder_id = app.folder.get();
                    // has file?
//                    var image = view.node.find('input[name="picture-upload-file"][type="file"]').get(0);
                    return api.create(data);
                };
                return myView.node;
            }




        },
        save: function () {
            console.log('now accountsdetail get saved?');
        }
    });

    return {}; //whoa return nothing at first
});
