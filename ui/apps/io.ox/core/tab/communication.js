/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
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

            if (propagateToSelfWindow) { this.events.trigger(key, parameters); }
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
                // use 'default' to just forward propagated events
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
