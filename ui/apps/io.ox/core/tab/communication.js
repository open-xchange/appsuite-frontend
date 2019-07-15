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
        var self = this;
        window.addEventListener('storage', function (e) {
            if (!e.key) return;

            var eventData = e.newValue || JSON.stringify({}),
                data;

            try {
                data = JSON.parse(eventData);
            } catch (e) {
                data = {};
                if (ox.debug) console.warn('TabCommunication.initListener', e);
            }

            if (!data.propagate) return;

            if (data.targetWindow && data.targetWindow !== windowNameObject.windowName) return;
            if (data.exceptWindow && data.exceptWindow === windowNameObject.windowName) return;

            switch (e.key) {
                case TabCommunication.DEFAULT_STORAGE_KEYS.COMMUNICATION:
                    self.handleListener(data);
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
         * @param {String} propagate
         *  the key to trigger event
         *
         * @param {Object} [options]
         *  options object
         *  @param {String} [options.parameters]
         *   parameters that should be passed to the trigger
         *  @param {String} [options.exceptWindow]
         *   propagate to all windows except this
         *  @param {String} [options.targetWindow]
         *   propagate to this window
         *  @param {String} [options.storageKey]
         *   key to use in the localStorage. Default key is TabHandling.DEFAULT_STORAGE_KEYS.COMMUNICATION
         */
        propagate: function (propagate, options) {
            options = options || {};
            var jsonString, propagateToSelfWindow,
                storageKey = options.storageKey || this.DEFAULT_STORAGE_KEYS.COMMUNICATION;

            // propagateToAll means that the event is triggered on the own window via the event and not via the localStorage
            if (!options.exceptWindow && !options.targetWindow) {
                options.exceptWindow = windowNameObject.windowName;
                propagateToSelfWindow = true;
            }

            try {
                jsonString = JSON.stringify({
                    propagate: propagate,
                    parameters: options.parameters,
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

            if (propagateToSelfWindow) this.events.trigger(propagate, options.parameters);
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
         * Propagate to all windows by the localStorage.
         *
         * Note: Due to different browser behaviour in handling localStorage events in the current tab, this function uses
         * the localStorage only for all other browser tabs and triggers the event for the current tab directly.
         *
         * @param {String} propagate
         *  the key to trigger event
         *
         * @param {Object} [parameters]
         *  parameters that should be passed to the trigger
         */
        propagateToAll: function (propagate, parameters) {
            console.warn('(Deprecated) TabHandling: TabCommunication.propagateToAll', propagate, _.clone(parameters));
            this.propagate(propagate, {
                parameters: parameters,
                exceptWindow: windowNameObject.windowName
            });
            this.events.trigger(propagate, parameters);
        },

        /**
         * Propagate to all windows, except the specified by the localStorage
         *
         * @param {String} propagate
         *  the key to trigger event
         *
         * @param {String} windowName
         *  the windowName to exclude
         *
         * @param {Object} [parameters]
         *  parameters that should be passed to the trigger
         */
        propagateToAllExceptWindow: function (propagate, windowName, parameters) {
            console.warn('(Deprecated) TabHandling: TabCommunication.propagateToAllExceptWindow', propagate, windowName, _.clone(parameters));
            this.propagate(propagate, {
                parameters: parameters,
                exceptWindow: windowName
            });
        },

        /**
         * Propagate to specified window by the localStorage
         *
         * @param {String} propagate
         *  the key to trigger event
         *
         * @param {String} windowName
         *  the windowName to propagate to
         *
         * @param {Object} [parameters]
         *  parameters that should be passed to the trigger
         */
        propagateToWindow: function (propagate, windowName, parameters) {
            console.warn('(Deprecated) TabHandling: TabCommunication.propagateToWindow', propagate, windowName, _.clone(parameters));
            this.propagate(propagate, {
                parameters: parameters,
                targetWindow: windowName
            });
        },

        /**
         * Ask for other windows by localStorage
         *
         * @returns {Deferred}
         */
        otherTabsLiving: function () {
            this.propagateToAllExceptWindow('get-active-windows', windowNameObject.windowName);
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
         * @param {String} parameters
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
            this.propagateToWindow('propagate-active-window', targetWindow, { windowName: windowNameObject.windowName });
        },

        /**
         * Set the current windowNameObject
         *
         * @param {windowNameObject} newWindowNameObject
         */
        setWindowNameObject: function (newWindowNameObject) {
            _.extend(windowNameObject, newWindowNameObject);
        },

        handleListener: function (data) {
            console.warn('TabHandling: TabCommunication.handleListener', data.propagate, _.clone(data));
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
