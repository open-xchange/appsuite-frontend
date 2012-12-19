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

define('io.ox/core/session', ['io.ox/core/http'], function (http) {

    'use strict';

    var TIMEOUTS = { AUTOLOGIN: 5000, LOGIN: 10000 };

    var getBrowserLanguage = function () {
        var language = (navigator.language || navigator.userLanguage).substr(0, 2),
            languages = ox.serverConfig.languages || {};
        return _.chain(languages).keys().find(function (id) {
                return id.substr(0, 2) === language;
            }).value();
    };

    var check = function (language) {
        var languages = ox.serverConfig.languages || {};
        return language in languages ? language : false;
    };

    var set = function (data) {
        ox.session = data.session || '';
        ox.user = data.user; // might have a domain; depends on what the user entered on login
        ox.user_id = data.user_id || 0;
        // if the user has set the language on the login page, use this language instead of server settings lang
        ox.language = ox.forcedLanguage || check(data.locale) || check(getBrowserLanguage()) || 'en_US';
    };

    var that = {

        autoLogin: function () {
            // GET request
            return http.GET({
                module: 'login',
                appendColumns: false,
                appendSession: false,
                processResponse: false,
                timeout: TIMEOUTS.AUTOLOGIN,
                params: {
                    action: 'autologin',
                    client: that.client()
                }
            })
            .done(set);
        },

        login: (function () {

            var pending = null;

            return function (username, password, store) {

                var def = $.Deferred(), multiple = [];

                // online?
                if (ox.online) {
                    // pending?
                    if (pending !== null) {
                        return pending;
                    } else {
                        // mark as pending
                        pending = def.always(function () {
                            pending = null;
                        });
                        // POST request
                        if (ox.forcedLanguage) {
                            multiple.push({
                                module: 'jslob',
                                action: 'update',
                                id: 'io.ox/core',
                                data: {
                                    language: ox.forcedLanguage
                                }
                            });
                        }
                        http.POST({
                            module: 'login',
                            appendColumns: false,
                            appendSession: false,
                            processResponse: false,
                            params: {
                                action: 'login',
                                name: username,
                                password: password,
                                client: that.client(),
                                timeout: TIMEOUTS.LOGIN,
                                multiple: JSON.stringify(multiple)
                            }
                        })
                        .done(function (data) {
                            // store session
                            set(data);
                            // set permanent cookie
                            if (store) {
                                that.store().always(function (e) {
                                    // we don't care if this fails
                                    def.resolve(data);
                                });
                            } else {
                                def.resolve(data);
                            }
                        })
                        .fail(def.reject);
                    }
                } else {
                    // offline
                    set({ session: 'offline', user: username });
                    def.resolve({ session: ox.session, user: ox.user });
                }

                return def;
            };
        }()),

        store: function () {
            // GET request
            return http.GET({
                module: 'login',
                appendColumns: false,
                processResponse: false,
                params: {
                    action: 'store'
                }
            });
        },

        logout: function () {
            if (ox.online) {
                // POST request
                return http.POST({
                    module: 'login',
                    appendColumns: false,
                    processResponse: false,
                    params: {
                        action: 'logout'
                    }
                });
            } else {
                return $.Deferred().resolve();
            }
        },

        client: function () {
            return 'open-xchange-appsuite';
        }
    };

    return that;
});
