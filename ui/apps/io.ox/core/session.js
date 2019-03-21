/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/session', [
    'io.ox/core/http',
    'io.ox/core/manifests',
    'io.ox/core/uuids',
    'io.ox/core/boot/config'
], function (http, manifests, uuids, config) {

    'use strict';

    var TIMEOUTS = { AUTOLOGIN: 7000, LOGIN: 10000, FETCHCONFIG: 2000 },
        CLIENT = 'open-xchange-appsuite',
        isAutoLogin = false;

    var getBrowserLanguage = function () {
        var language = (navigator.language || navigator.userLanguage).substr(0, 2),
            languages = ox.serverConfig.languages || {};

        // special treatment for 'en' (return en_US instead of en_UK which comes first in the list)
        if (language === 'en') return 'en_US';
        var result = _.chain(languages).keys().find(function (id) {
            return id.substr(0, 2) === language;
        }).value();

        // never ever return undefined!!!111eleven
        // This causes a js error which prevents the display of the login page. Thus preventing users from login in.
        result = result || (languages.en_US ? 'en_US' : _(languages).keys()[0] || 'en_US');

        return result;
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

            // Fetches the timeout value in parallel with the main HTTP request
            // if it takes too long. Falls back to values in TIMEOUTS if
            // fetching the config also takes too long.
            function withTimeout(httpCall, options) {
                var start = _.now(),
                    // Variables used for synchronization:
                    // configTimer fetches the serverConfig,
                    configTimer = setTimeout(fetchConfig, TIMEOUTS.FETCHCONFIG),
                    // xhrTimer aborts the HTTP request on timeout,
                    xhrTimer = setTimeout(abort, TIMEOUTS.AUTOLOGIN),
                    // xhr cancels the timers on completion.
                    xhr = httpCall(options);

                // Cancel the timers if the HTTP request is finished before
                // the timeout.
                return xhr.always(function () {
                    if (configTimer !== null) {
                        clearTimeout(configTimer);
                        configTimer = null;
                    }
                    if (xhrTimer !== null) {
                        clearTimeout(xhrTimer);
                        xhrTimer = null;
                    }
                });

                // Fetch serverConfig manually if the request takes too long.
                function fetchConfig() {
                    configTimer = null;
                    config.server().done(function (conf) {
                        if (xhrTimer === null) return; // too late
                        if (!conf || !conf.autoLoginTimeout) return; // use default

                        // Restart the abort timer with the configured value,
                        // adjusting for already elapsed time.
                        clearTimeout(xhrTimer);
                        xhrTimer = setTimeout(abort, Math.max(0,
                            conf.autoLoginTimeout - (_.now() - start)));
                    });
                }

                // Abort the HTTP request.
                function abort() {
                    xhrTimer = null;
                    xhr.abort();
                }
            }

            // GET request
            return (
                _.url.hash('token.autologin') === 'false' && _.url.hash('serverToken')
                    // no auto-login for server-token-based logins
                    ? $.Deferred().reject({})
                    // try auto-login
                    : withTimeout(http.GET, {
                        module: 'login',
                        appendColumns: false,
                        appendSession: false,
                        processResponse: false,
                        params: {
                            action: 'autologin',
                            client: that.client(),
                            rampup: true,
                            rampUpFor: CLIENT,
                            version: that.version()
                        }
                    })
            )
            .then(
                function success(data) {
                    ox.secretCookie = true;
                    ox.rampup = data.rampup || ox.rampup || {};
                    isAutoLogin = true;
                    return data;
                },
                // If autologin fails, try token login
                function fail(data) {
                    if (!_.url.hash('serverToken')) throw (data || {});
                    return withTimeout(http.POST, {
                        module: 'login',
                        jsessionid: _.url.hash('jsessionid'),
                        appendColumns: false,
                        appendSession: false,
                        processResponse: false,
                        data: {
                            action: 'tokens',
                            client: that.client(),
                            version: that.version(),
                            serverToken: _.url.hash('serverToken'),
                            clientToken: _.url.hash('clientToken'),
                            rampup: true,
                            rampUpFor: CLIENT
                        }
                    })
                    .then(function (response) {
                        store = _.url.hash('store') === 'true';
                        // make sure we have rampupdata
                        if (response.data.rampup) {
                            return response.data;
                        }
                        //session needed for rampup call
                        ox.session = response.data.session;
                        return that.rampup().then(function (rampupData) {
                            response.data.rampup = rampupData;
                            return response.data;
                        });
                    });
                }
            )
            .then(function (data) {
                set(data);
                // global event
                ox.trigger('login', data);
                // call store for token-based login / not for pure auto-login
                return store ? that.store().then(function () { return data; }) : data;
            })
            .done(function () {
                _.url.hash({
                    jsessionid: null,
                    serverToken: null,
                    clientToken: null,
                    store: null,
                    'token.autologin': null
                });
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
                        rampUpFor: 'open-xchange-appsuite'
                    },
                    _(options).pick('action', 'name', 'password', 'language', 'rampup', 'rampUpFor', 'share', 'target', 'secret_code')
                );

                if (options.forceLanguage) params.storeLanguage = true;

                return (
                    pending = http.POST({
                        module: 'login',
                        appendColumns: false,
                        appendSession: false,
                        processResponse: false,
                        data: params
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
                            }
                            return data;
                        },
                        function fail(e) {
                            if (ox.debug) console.error('Login failed!', e.error, e.error_desc || '');
                            throw e;
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
                    rampUpFor: CLIENT
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
                data: { action: 'store' }
            })
            .then(function () {
                ox.secretCookie = true;
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
                data: {
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
                    data: {
                        action: 'logout'
                    }
                }).then(function () {
                    ox.trigger('logout');
                });
            }
            return $.Deferred().resolve();
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

        isAutoLogin: function () {
            return isAutoLogin;
        },

        getBrowserLanguage: getBrowserLanguage
    };

    return that;
});
