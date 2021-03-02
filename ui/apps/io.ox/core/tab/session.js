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
        TabSession;

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
        require('io.ox/core/api/tab').disable();
    }

    /**
     * Initialize listener for storage events and listener for propagation
     */
    function initListener() {
        TabSession.events.listenTo(TabSession.events, 'propagateLogin', function (parameters) {
            if (!(ox.signin || reloginBySameUser(parameters))) return;
            require(['io.ox/core/boot/login/tabSession'], function (tabSessionLogin) {
                tabSessionLogin(parameters);
            });
        });
    }

    function reloginBySameUser(parameters) {
        var isSameUser = (ox.user_id === parameters.user_id) && (ox.user === parameters.user) && (ox.context_id === parameters.context_id);
        return (parameters.relogin && isSameUser);
    }

    // PUBLIC --------------------------------------------------

    TabSession = {
        // events object to trigger changes
        events: _.extend({}, Backbone.Events),

        /**
         * Ask over localStorage if another tab has a session
         */
        propagateGetSession: function () {
            if (ox.session) return;
            var windowName = window.name || JSON.stringify({}),
                windowNameObject,
                tabAPI = require('io.ox/core/api/tab');

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
                    tabAPI.propagate('getSession', { parameters: param, exceptWindow: tabAPI.getWindowName(), storageKey: tabAPI.DEFAULT_STORAGE_KEYS.SESSION });
                }
            }
        },

        /**
         * Perform a login workflow (i.e. ask for a session and wait for an event)
         *
         * @returns {Deferred}
         */
        login: function () {
            var def     = $.Deferred(),
                timeout,
                isTokenLogin = _.url.hash('serverToken') && _.url.hash('clientToken');

            if (isTokenLogin) { return def.reject(); }

            if (ox.session && ox.secretCookie && ox.language && ox.theme && ox.user && ox.user_id) {
                return def.resolve({
                    session: ox.session,
                    secretCookie: ox.secretCookie,
                    user: ox.user,
                    user_id: ox.user_id,
                    language: ox.language,
                    theme: ox.theme
                });
            }

            timeout = setTimeout(function () {
                def.reject();
            }, 50);

            this.propagateGetSession();

            this.events.listenTo(TabSession.events, 'propagateSession', function (loginData) {
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
            var tabAPI = require('io.ox/core/api/tab');

            // the login process is finished when session, user and user_id are set in the ox object
            if (!ox.session || !ox.user || !ox.user_id) {
                return;
            }
            // the requested session is differently to ox.session. e.g. guest user vs normal login
            if (parameters.session && parameters.session !== ox.session) {
                return;
            }
            tabAPI.propagate('propagateSession', {
                session: ox.session,
                language: ox.language,
                theme: ox.theme,
                user: ox.user,
                user_id: ox.user_id,
                context_id: ox.context_id,
                exceptWindow: tabAPI.getWindowName(),
                storageKey: tabAPI.DEFAULT_STORAGE_KEYS.SESSION
            });
        },

        /**
         * handles all trigger from the localStorage with the key TabHandling.DEFAULT_STORAGE_KEYS.SESSION
         * @param {Object} data
         *  an object which contains the propagation parameters
         *  @param {String} data.propagate
         *   the key of the propagation event
         *  @param {Object} data.parameters
         *   tha parameters passed over the the localStorage
         */
        handleListener: function (data) {
            switch (data.propagate) {
                case 'getSession':
                    this.propagateSession(data.parameters);
                    break;
                case 'propagateSession':
                    this.events.trigger(data.propagate, data.parameters);
                    break;
                case 'propagateLogout':
                    if (ox.signin) return;
                    this.events.trigger('before:propagatedLogout');
                    require('io.ox/core/main').logout({
                        force: true,
                        skipSessionLogout: true,
                        autologout: data.parameters && data.parameters.autologout
                    });
                    break;
                case 'propagateLogin':
                    if (ox.session && !reloginBySameUser(data.parameters)) return;
                    this.events.trigger(data.propagate, data.parameters);
                    break;
                default:
                    break;
            }
        }
    };

    if (util.checkTabHandlingSupport() && !initialized) {
        initialize();
    }

    return TabSession;
});
