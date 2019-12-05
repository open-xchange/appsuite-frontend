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

define('io.ox/core/tab/communication', ['io.ox/core/boot/util'], function (util) {

    'use strict';

    // DEFINITIONS --------------------------------------------------

    /**
     * @typedef {Object} windowNameObject
     * @property {String} windowName
     *   the name of the current window
     * @property {String} windowType
     *   is the current window a child or parent tab values: 'parent' or 'child'
     * @property {String} [parentName]
     *   the name of the opener
     */

    // PRIVATE --------------------------------------------------

    var initialized      = false,

        // object for the tab communication
        TabCommunication,

        // object with the windowName properties
        windowNameObject = {};

    /**
     * Initialize localStorage listener if localStorage is available
     */
    function initialize() {
        if (!Modernizr.localstorage) return;

        initListener();
        initialized = true;
    }

    /**
     * initialize the localStorage listener
     */
    function initListener() {
        window.addEventListener('storage', function (e) {
            if (!e.key) return;

            var eventData = e.newValue || JSON.stringify({}),
                data;

            if (eventData === 'modernizr') return;

            try {
                data = JSON.parse(eventData) || {};
            } catch (e) {
                data = {};
                if (ox.debug) console.warn('TabCommunication.initListener', e);
            }

            if (!data.propagate) return;

            if (data.targetWindow && data.targetWindow !== windowNameObject.windowName) return;
            if (data.exceptWindow && data.exceptWindow === windowNameObject.windowName) return;

            switch (e.key) {
                case TabCommunication.DEFAULT_STORAGE_KEYS.COMMUNICATION:
                    TabCommunication.handleListener(data);
                    break;
                case TabCommunication.DEFAULT_STORAGE_KEYS.SESSION:
                    require(['io.ox/core/tab/session']).done(function (tabSession) {
                        tabSession.handleListener(data);
                    });
                    break;
                default:
                    break;
            }
            if (data.propagate === 'get-active-windows') return TabCommunication.getActiveWindows(data.exceptWindow);
            if (data.propagate === 'update-ox-object') return TabCommunication.updateOxObject(data.parameters);

            TabCommunication.events.trigger(data.propagate, data.parameters);
        });
    }

    // PUBLIC --------------------------------------------------

    TabCommunication = {
        // events object to trigger changes
        events: _.extend({}, Backbone.Events),

        /**
         * Keys to handle the localStorage
         * @readonly
         * @enum {String}
         */
        DEFAULT_STORAGE_KEYS: { COMMUNICATION: 'appsuite.window-communication', SESSION: 'appsuite.session-management' },

        /**
         * Write a new localStorage item to spread to all other tabs or to a
         * specified tab.
         *
         * @param {String} key
         *  the key to trigger event
         *
         * @param {Object} [options]
         *  the keys not described below are passed as parameters to the other windows.
         *  @param {String} [options.exceptWindow]
         *   propagate to all windows except this
         *  @param {String} [options.targetWindow]
         *   propagate to this window
         *  @param {String} [options.storageKey]
         *   key to use in the localStorage. Default key is TabHandling.DEFAULT_STORAGE_KEYS.COMMUNICATION
         */
        propagate: function (key, options) {
            options = options || {};
            var jsonString, propagateToSelfWindow,
                storageKey = options.storageKey || this.DEFAULT_STORAGE_KEYS.COMMUNICATION,
                parameters = _.omit(options, 'targetWindow', 'exceptWindow', 'storageKey');

            // propagateToAll means that the event is triggered on the own window via the event and not via the localStorage
            if (!options.exceptWindow && !options.targetWindow) {
                options.exceptWindow = windowNameObject.windowName;
                propagateToSelfWindow = true;
            }

            try {
                jsonString = JSON.stringify({
                    propagate: key,
                    parameters: parameters,
                    date: Date.now(),
                    exceptWindow: options.exceptWindow,
                    targetWindow: options.targetWindow
                });
            } catch (e) {
                jsonString = JSON.stringify({});
                if (ox.debug) console.warn('TabCommunication.propagate', e);
            }
            localStorage.setItem(storageKey, jsonString);
            this.clearStorage(storageKey);

            if (propagateToSelfWindow) this.events.trigger(key, parameters);
        },

        /**
         * Clear Storage for TabCommunication
         */
        clearStorage: function (storageKey) {
            try {
                localStorage.removeItem(storageKey);
            } catch (e) {
                if (ox.debug) console.warn('TabCommunication.clearStorage', e);
            }
        },

        /**
         * Ask for other windows by localStorage
         *
         * @returns {Deferred}
         */
        otherTabsLiving: function () {
            var tabAPI = require('io.ox/core/api/tab');
            tabAPI.propagate('get-active-windows', { exceptWindow: windowNameObject.windowName });
            var def     = $.Deferred(),
                timeout = setTimeout(function () {
                    def.reject();
                }, 100);

            this.events.listenToOnce(this.events, 'propagate-active-window', def.resolve);

            return def.done(function () {
                window.clearTimeout(timeout);
            });
        },

        /**
         * Set ox-object params. Returns true if the parameters were set.
         *
         * @param {Object} parameters
         *  parameter to set
         *
         * @returns {boolean}
         */
        updateOxObject: function (parameters) {
            if (!parameters) return false;

            _.extend(ox, parameters);
            return true;
        },

        /**
         * Tell specified window, that an active tab exist
         *
         * @param {String} targetWindow
         *  windowName for propagation
         */
        getActiveWindows: function (targetWindow) {
            if (!ox.session) return;
            var tabAPI = require('io.ox/core/api/tab');
            tabAPI.propagate('propagate-active-window', { targetWindow: targetWindow, windowName: windowNameObject.windowName });
        },

        /**
         * Set the current windowNameObject
         *
         * @param {windowNameObject} newWindowNameObject
         */
        setWindowNameObject: function (newWindowNameObject) {
            _.extend(windowNameObject, newWindowNameObject);
        },

        /**
         * handles all trigger from the localStorage with the key TabHandling.DEFAULT_STORAGE_KEYS.COMMUNICATION
         * @param {Object} data
         *  an object which contains the propagation parameters
         *  @param {String} data.propagate
         *   the key of the propagation event
         *  @param {Object} data.parameters
         *   the parameters passed over the the localStorage
         *  @param {String} [data.exceptWindow]
         *   excluded window from propagation
         */
        handleListener: function (data) {
            switch (data.propagate) {
                case 'show-in-drive':
                    ox.load(['io.ox/files/actions/show-in-drive']).done(function (action) {
                        action(data.parameters);
                    });
                    break;
                case 'get-active-windows':
                    TabCommunication.getActiveWindows(data.exceptWindow);
                    break;
                case 'update-ox-object':
                    TabCommunication.updateOxObject(data.parameters);
                    break;
                case 'office-settings-changed':
                    ox.trigger('change:settings:office', data.parameters);
                    break;
                default:
                    TabCommunication.events.trigger(data.propagate, data.parameters);
                    break;
            }
        }
    };

    if (util.checkTabHandlingSupport() && !initialized) {
        initialize();
    }

    return TabCommunication;
});
