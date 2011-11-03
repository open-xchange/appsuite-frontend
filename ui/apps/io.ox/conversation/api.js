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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define("io.ox/conversation/api",
    ["io.ox/core/http", "io.ox/core/api/factory"], function (http, apiFactory) {
    
    "use strict";
    
    // generate basic API
    var api = apiFactory({
        module: "conversation",
        keyGenerator: function (obj) {
            return String(obj.id);
        },
        requests: {
            all: {
            },
            list: {
            },
            get: {
                action: "get"
            }
        },
        pipe: {
            all: function (data) {
            }
        }
    });
    
    api.getMessages = function (id, since) {
        return http.GET({
            module: "conversation",
            params: {
                action: "allMessages",
                id: id,
                since: since || 0
            }
        });
    };
    
    api.sendMessage = function (id, text) {
        return http.PUT({
            module: "conversation",
            params: {
                action: "newMessage",
                id: id
            },
            data: {
                text: text
            }
        });
    };
    return api;
});