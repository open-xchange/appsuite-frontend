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
 * @author Tobias Prinz <tobias.prinz@open-xchange.com>
 */

//TODO: split into packages for services, accounts and messages
define("io.ox/messaging/messages/api",
    ["io.ox/core/http",
    "io.ox/core/api/user"], function (http, userAPI) {

    "use strict";

    var api = {
        all: function (folder) {
            var params = {};
            return http.GET({
                module: 'messaging/message',
                params: {
                    action: "all",
                    columns: "folder,from,id,subject,from,receivedDate,body,headers,picture,url",
                    folder: folder
                }
            });
        }
    };
    return api;
});