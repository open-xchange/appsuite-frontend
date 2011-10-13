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
    
    "use strict";
    
    var setSession = function (session) {
        ox.session = session;
    };
    
    var setCachedSession = function () {
        document.cookie = _.serialize({ session: ox.session });
        document.cookie = _.serialize({ user: ox.user });
    };
    
    var getCachedSession = function () {
        var obj = _.deserialize(document.cookie, "; ");
        if (obj.session && obj.user) {
            ox.session = obj.session;
            ox.user = obj.user;
            return true;
        } else {
            return false;
        }
    };
    
    var removeCachedSession = function () {
        document.cookie = "session=";
        document.cookie = "user=";
    };
    
    var setUser = function (username) {
        ox.user = username.indexOf("@") > -1 ?
            username : username + "@" + ox.serverConfig.defaultContext;
    };
    
    var that = {
            
        cachedAutoLogin: function () {
            var def = $.Deferred();
            return getCachedSession() ? def.resolve() : def.reject();
        },
        
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
                ox.user = data.user || ("matthias.biggeleben@" + ox.serverConfig.defaultContext); // YEAH!
            });
        },
        
        login: function (username, password, store) {
            var def = $.Deferred();
            // online?
            if (ox.online) {
                // POST request
                http.POST({
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
                    setSession(data.session);
                    setUser(username);
                    // set permanent cookie
                    if (store) {
                        // cache session
                        setCachedSession();
                        that.store().done(function () {
                            def.resolve(data);
                        }).fail(def.reject);
                    } else {
                        def.resolve(data);
                    }
                })
                .fail(def.reject);
            } else {
                // offline
                setSession("offline");
                setUser(username);
                def.resolve({ session: ox.session, user: ox.user });
            }
            return def;
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
            if (ox.online) {
                removeCachedSession();
                // POST request
                return http.POST({
                    module: "login",
                    appendColumns: false,
                    processResponse: false,
                    params: {
                        action: "logout"
                    }
                });
            } else {
                return $.Deferred().resolve();
            }
        }
    };
    
    return that;
});