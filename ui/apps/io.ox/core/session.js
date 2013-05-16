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

    var set = function (data, language) {
        if ('session' in data) ox.session = data.session || '';
        if ('user' in data) ox.user = data.user || ''; // might have a domain; depends on what the user entered on login
        if ('user_id' in data) ox.user_id = data.user_id || 0;
        if ('context_id' in data) ox.context_id = data.context_id || 0;
        // if the user has set the language on the login page, use this language instead of server settings lang
        ox.language = language || check(data.locale) || check(getBrowserLanguage()) || 'en_US';
        $('html').attr('lang', ox.language.split('_')[0]);
        // should not hide store() request here; made debugging hard
        ox.trigger("change:session", ox.session);
    };

    var that = {

        set: set,

        autoLogin: function () {
            var store = false;
            // GET request
            return http.GET({
                module: 'login',
                appendColumns: false,
                appendSession: false,
                processResponse: false,
                timeout: TIMEOUTS.AUTOLOGIN,
                params: {
                    action: 'autologin',
                    client: that.client(),
                    version: that.version()
                }
            })
            // If autologin fails, try the token login
            .then(
                function (data) {
                    ox.secretCookie = true;
                    return data;
                },
                function () {
                    if (!_.url.hash('serverToken')) return;
                    return http.POST({
                        module: 'login',
                        jsessionid: _.url.hash('jsessionid'),
                        appendColumns: false,
                        appendSession: false,
                        processResponse: false,
                        timeout: TIMEOUTS.AUTOLOGIN,
                        params: {
                            action: 'tokens',
                            client: that.client(),
                            version: that.version(),
                            serverToken: _.url.hash('serverToken'),
                            clientToken: _.url.hash('clientToken')
                        }
                    })
                    .then(function (response) {
                        return response.data;
                    });
                }
            )
            .done(function () {
                store = _.url.hash('store');
                _.url.hash({
                    jsessionid: null,
                    serverToken: null,
                    clientToken: null,
                    store: null
                });
            })
            .done(function (data) {
                set(data);
                // no "store" request here; just auto-login
            });
        },

        login: (function () {

            var pending = null;

            return function (username, password, store, language, forceLanguage) {

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
                        if (forceLanguage) {
                            multiple.push({
                                module: 'jslob',
                                action: 'update',
                                id: 'io.ox/core',
                                data: {
                                    // permanent language change
                                    language: forceLanguage
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
                                // current browser language; required for proper error messages
                                language: language || 'en_US',
                                client: that.client(),
                                version: that.version(),
                                timeout: TIMEOUTS.LOGIN,
                                multiple: JSON.stringify(multiple)
                            }
                        })
                        .done(function (data) {
                            // store session
                            // we pass forceLanguage (might be undefined); fallback is data.locale
                            set(data, forceLanguage);
                            if (store) {
                                that.store().done(function () { def.resolve(data); });
                            } else {
                                def.resolve(data);
                            }
                        })
                        .fail(def.reject);
                    }
                } else {
                    // offline
                    set({ session: 'offline', user: username }, language);
                    def.resolve({ session: ox.session, user: ox.user });
                }
                return def;
            };
        }()),

        store: function () {
            var def = $.Deferred();
            // change from GET to POST request, cause firefox has a
            // problem otherwise if caches are empty
            http.POST({
                module: 'login',
                appendColumns: false,
                processResponse: false,
                params: { action: 'store' }
            })
            // makes store() always successful (should never block)
            .always(def.resolve);
            return def;
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
        },

        version: function () {
            // need to work with ox.version since we don't have the server config for auto-login
            return String(ox.version).split('.').slice(0, 3).join('.');
        }
    };

    return that;
});
