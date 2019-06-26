/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Kristof Kamin <kristof.kamin@open-xchange.com>
 */

define('io.ox/core/tab/session', ['io.ox/core/boot/util'], function (util) {

    'use strict';

    // PRIVATE --------------------------------------------------

    var initialized = false,

        // An Object for Session Handling
        TabSession,

        // key for the localStorage
        storageKey  = 'appsuite.session-management';

    /**
     * Initialize localStorage listener if localStorage is available
     */
    function initialize() {
        if (!Modernizr.localstorage) return;

        initListener();
        initialized = true;
    }

    /**
     * Disable the complete TabHandling after initialization
     * e.g. guest account is realized too late
     */
    function disable() {
        ox.tabHandlingEnabled = false;
        util.checkTabHandlingSupport = function () {
            return false;
        };
    }

    /**
     * Initialize listener for storage events and listener for propagation
     */
    function initListener() {
        window.addEventListener('storage', function (e) {
            if (e.key !== storageKey) return;
            var eventData = e.newValue || JSON.stringify({}),
                data;

            try {
                data = JSON.parse(eventData);
            } catch (e) {
                data = {};
                if (ox.debug) console.warn('TabSession.initListener', e);
            }

            switch (data.propagate) {
                case 'getSession':
                    TabSession.propagateSession(data.parameters);
                    break;
                case 'propagateSession':
                    TabSession.events.trigger(data.propagate, data.parameters);
                    break;
                case 'propagateNoSession':
                    TabSession.events.trigger(data.propagate);
                    break;
                case 'propagateLogout':
                    if (ox.signin) return;
                    TabSession.events.trigger('before:propagatedLogout');
                    require('io.ox/core/main').logout({
                        force: true,
                        skipSessionLogout: true,
                        autologout: data.parameters && data.parameters.autologout
                    });
                    break;
                case 'propagateLogin':
                    if (ox.session && !data.parameters.relogin) return;
                    TabSession.events.trigger(data.propagate, data.parameters);
                    break;
                default:
                    break;
            }
        });

        TabSession.events.listenTo(TabSession.events, 'getSession', function (parameters) {
            TabSession.propagateSession(parameters);
        });

        TabSession.events.listenTo(TabSession.events, 'propagateLogin', function (parameters) {
            if (!ox.signin && !parameters.relogin) return;
            require(['io.ox/core/boot/login/tabSession'], function (tabSessionLogin) {
                tabSessionLogin(parameters);
            });
        });
    }

    // PUBLIC --------------------------------------------------

    TabSession = {
        // events object to trigger changes
        events: _.extend({}, Backbone.Events),

        /**
         * Clear localStorage for TabSession
         */
        clearStorage: function () {
            try {
                localStorage.removeItem(storageKey);
            } catch (e) {
                if (ox.debug) console.warn('TabSession.clearStorage', e);
            }
        },

        /**
         * Propagate Session Handling over the localStorage
         *
         * @param {String} propagate
         *  the key to trigger event
         * @param {Object} parameters
         *  parameters that should be passed to the trigger
         */
        propagate: function (propagate, parameters) {
            var jsonString;

            try {
                jsonString = JSON.stringify({
                    propagate: propagate,
                    parameters: parameters,
                    date: Date.now()
                });
            } catch (e) {
                jsonString = JSON.stringify({});
                if (ox.debug) console.warn('TabSession.propagate', e);
            }

            localStorage.setItem(storageKey, jsonString);
            TabSession.clearStorage();
        },

        /**
         * Ask over localStorage if another tab has a session
         */
        propagateGetSession: function () {
            if (ox.session) return;
            var windowName = window.name || JSON.stringify({}),
                windowNameObject;

            try {
                windowNameObject = JSON.parse(windowName);
            } catch (e) {
                windowNameObject = {};
                if (ox.debug) console.warn('TabSession.propagateGetSession', e);
            } finally {
                if (windowNameObject.loggingOut) {
                    delete windowNameObject.loggingOut;
                    window.name = JSON.stringify(windowNameObject);
                } else {
                    var param = {};
                    if (_.url.hash('session')) _.extend(param, { session: _.url.hash('session') });
                    TabSession.propagate('getSession', param);
                }
            }
        },
        /**
         * Perform a login workflow (i.e. ask for a session and wait for an event)
         *
         * @returns {Deferred}
         */
        login: function () {
            TabSession.propagateGetSession();
            var def     = $.Deferred(),
                timeout = setTimeout(function () {
                    def.reject();
                }, 50);

            TabSession.events.listenTo(TabSession.events, 'propagateSession', function (loginData) {
                if (_.url.hash('session') && loginData.session !== _.url.hash('session')) {
                    disable();
                    def.reject();
                } else {
                    def.resolve(loginData);
                }
            });

            return def.done(function () {
                window.clearTimeout(timeout);
            });
        },

        /**
         * Send a session over localStorage to other tabs
         *
         * @param {Object} parameters
         *  parameters to be propagated
         */
        propagateSession: function (parameters) {
            if (!ox.session) {
                TabSession.propagate('propagateNoSession');
                return;
            }
            if (parameters.session && parameters.session !== ox.session) {
                return;
            }
            TabSession.propagate('propagateSession', {
                session: ox.session,
                language: ox.language,
                theme: ox.theme,
                user: ox.user,
                user_id: ox.user_id,
                context_id: ox.context_id
            });
        },

        /**
         * Send a session over localStorage to login logged out tabs
         *
         * @param {Boolean} [relogin]
         *  If the relogin flag is set, the login is propagated to the other tabs
         */
        propagateLogin: function (relogin) {
            TabSession.propagate('propagateLogin', {
                session: ox.session,
                language: ox.language,
                theme: ox.theme,
                user: ox.user,
                user_id: ox.user_id,
                context_id: ox.context_id,
                relogin: relogin
            });
        },

        /**
         * Send a message to other tabs to logout these tabs
         *
         * @param {Object} [options]
         *  Optional options to send via the logout event
         */
        propagateLogout: function (options) {
            TabSession.propagate('propagateLogout', options);
        }
    };

    if (util.checkTabHandlingSupport() && !initialized) {
        initialize();
    }

    return TabSession;
});
