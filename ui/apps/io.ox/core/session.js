/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/session', [
    'io.ox/core/http',
    'io.ox/core/manifests',
    'io.ox/core/uuids'
], function (http, manifests, uuids) {

    'use strict';

    var TIMEOUTS = { AUTOLOGIN: 5000, LOGIN: 10000 }, CLIENT = 'open-xchange-appsuite';

    var getBrowserLanguage = function () {
        var language = (navigator.language || navigator.userLanguage).substr(0, 2),
            languages = ox.serverConfig.languages || {};
        // special treatment for 'en' (return en_US instead of en_UK which comes first in the list)
        if (language === 'en') return 'en_US';
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
        // might have a domain; depends on what the user entered on login
        if ('user' in data) ox.user = data.user || '';
        if ('user_id' in data) ox.user_id = data.user_id || 0;
        if ('context_id' in data) ox.context_id = data.context_id || 0;
        // if the user has set the language on the login page, use this language instead of server settings lang
        ox.language = language || check(data.locale) || check(getBrowserLanguage()) || 'en_US';
        _.setCookie('language', ox.language);
        manifests.reset();
        $('html').attr('lang', ox.language.split('_')[0]);
        // should not hide store() request here; made debugging hard
        ox.trigger('change:session', ox.session);
    };

    var that = {

        set: set,

        autoLogin: function () {
            // store
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
                    rampup: true,
                    rampupFor: CLIENT,
                    version: that.version()
                }
            })
            .then(
                function success(data) {
                    ox.secretCookie = true;
                    ox.rampup = data.rampup || ox.rampup || {};
                    return data;
                },
                // If autologin fails, try token login
                function fail(data) {
                    if (!_.url.hash('serverToken')) return data || {};
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
                        store = _.url.hash('store');
                        return response.data;
                    });
                }
            )
            .done(function () {
                _.url.hash({
                    jsessionid: null,
                    serverToken: null,
                    clientToken: null,
                    store: null
                });
            })
            .then(function (data) {
                set(data);
                // global event
                ox.trigger('login', data);
                // call store for token-based login / not for pure auto-login
                return store ? that.store().then(function () { return data; }) : data;
            });
        },

        login: (function () {

            var pending = null;

            return function (options) {

                if (!ox.online) {
                    // don't try when offline
                    set({ session: 'offline', user: options.username }, options.language);
                    return $.when({ session: ox.session, user: ox.user });
                }

                // pending?
                if (pending !== null) return pending;

                var params = _.extend(
                    {
                        action: 'login',
                        name: '',
                        password: '',
                        // current browser language; required for proper error messages
                        language: 'en_US',
                        client: that.client(),
                        version: that.version(),
                        timeout: TIMEOUTS.LOGIN,
                        rampup: true,
                        rampupFor: 'open-xchange-appsuite'
                    },
                    _(options).pick('action', 'name', 'password', 'language', 'rampup', 'rampupFor', 'share', 'target')
                );

                if (options.forceLanguage) params.storeLanguage = true;

                return (
                    pending = http.POST({
                        module: 'login',
                        appendColumns: false,
                        appendSession: false,
                        processResponse: false,
                        params: params
                    })
                    .then(
                        function success(data) {
                            // store rampup data
                            ox.rampup = data.rampup || ox.rampup || {};
                            // store session
                            // we pass forceLanguage (might be undefined); fallback is data.locale
                            set(data, options.forceLanguage);

                            // global event
                            ox.trigger('login', data);

                            if (options.store) {
                                return that.store().then(function () { return data; });
                            } else {
                                return data;
                            }
                        },
                        function fail(e) {
                            if (ox.debug) console.error('Login failed!', e.error, e.error_desc || '');
                            return e;
                        }
                    )
                    .always(function () {
                        pending = null;
                    })
                );
            };
        }()),

        rampup: function () {
            return http.GET({
                module: 'login',
                params: {
                    action: 'rampup',
                    rampup: true,
                    rampupFor: CLIENT
                },
                appendColumns: false,
                processResponse: false
            })
            .then(function (data) {
                return (ox.rampup = data.rampup || ox.rampup || {});
            });
        },

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

        redeemToken: function (token) {
            return http.POST({
                processResponse: false,
                appendSession: false,
                appendColumns: false,
                module: 'login',
                url: 'api/login?action=redeemToken',
                params: {
                    authId: uuids.randomUUID(),
                    token: token,
                    client: 'mobile-notifier',
                    secret: 'notifier-123'
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

        setClient: function (client) {
            if (client) CLIENT = client;
        },

        client: function () {
            return CLIENT;
        },

        version: function () {
            // need to work with ox.version since we don't have the server config for auto-login
            return String(ox.version).split('.').slice(0, 3).join('.');
        },

        getBrowserLanguage: getBrowserLanguage
    };

    return that;
});
