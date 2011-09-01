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

define("io.ox/core/session", ["io.ox/core/http"], function (http) {
    
    var that = {
            
        autoLogin: function () {
            // GET request
            return http.GET({
                module: "login",
                appendColumns: false,
                appendSession: false,
                processResponse: false,
                timeout: 3000, // just try that for 3 secs
                params: {
                    action: "autologin",
                    client: "com.openexchange.ox.gui.dhtml"
                }
            })
            .done(function (data) {
                // store session
                ox.session = data.session;
                ox.user = "matthias.biggeleben@open-xchange.com"; // YEAH!
                // ox.user = data.user
            });
        },
        
        login: function (username, password, store) {
            // POST request
            return http.POST({
                module: "login",
                appendColumns: false,
                appendSession: false,
                processResponse: false,
                params: {
                    action: "login",
                    name: username,
                    password: password
                }
            })
            .done(function (data) {
                // store session
                ox.session = data.session;
                ox.user = username.indexOf("@") > -1 ?
                    username : username + "@" + ox.serverConfig.defaultContext;
                // set permanent cookie
                if (store) {
                    that.store();
                }
            });
        },
        
        store: function () {
            // GET request
            return http.GET({
                module: "login",
                appendColumns: false,
                processResponse: false,
                params: {
                    action: "store"
                }
            });
        },
        
        logout: function () {
            // POST request
            return http.POST({
                module: "login",
                appendColumns: false,
                processResponse: false,
                params: {
                    action: "logout"
                }
            });
        }
    };
    
    return that;
});