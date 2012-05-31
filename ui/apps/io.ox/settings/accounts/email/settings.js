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
                myView,
                myViewNode,
                obj,
                auto;

            if (evt.data.id) {
                api.get(evt.data.id).done(function (obj) {
                    data = obj;
                    myViewNode = $("<div>").addClass("accountDetail");
                    myModel = new AccountModel({data: data});
                    myView = new AccountDetailView({model: myModel, node: myViewNode});
                    myView.dialog = new dialogs.SidePopup('800').show(evt, function (pane) {
                        var myout = myView.draw();
                        pane.append(myView.node.append(myout));
                    });

                    myModel.store = function (data) {
                        console.log('store update');
                        return api.update(data);
                    };
                    return myView.node;
                });
            } else {
                myViewNode = $("<div>").addClass("accountDetail");
                auto = evt.data.autoconfig;
                obj = {
                    'primary_address': auto.primary_address,
                    'mail_protocol': auto.mailProtocol,
                    'mail_port': auto.mailport,
                    'mail_server': auto.mailserver,
                    'transport_protocol': auto.transportProtocol,
                    'transport_port': auto.transportport,
                    'transport_server': auto.transportserver,
                    'login': auto.username
                };
                myModel = new AccountModel({data: obj});
                myView = new AccountDetailView({model: myModel, node: myViewNode});
                myView.dialog = new dialogs.SidePopup('800').show(evt, function (pane) {
                    var myout = myView.draw();
                    pane.append(myView.node.append(myout));

                });
                myModel.store = function (data) {
                    console.log('store new');
                    data.spam_handler = "NoSpamHandler"; // just to fix it now
                    return api.create(data);
                };
                return myView.node;
            }
        }
    });

    return {}; //whoa return nothing at first
});
