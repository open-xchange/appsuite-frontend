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

        // key for the localStorage
        storageKey       = 'appsuite.window-communication',

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
            if (e.key !== storageKey) return;
            var eventData = e.newValue || JSON.stringify({}),
                data;

            try {
                data = JSON.parse(eventData);
            } catch (e) {
                data = {};
                if (ox.debug) console.warn('TabCommunication.initListener', e);
            }

            if (!data.propagate) return;

            if (data.targetWindow && data.targetWindow !== TabCommunication.windowName) return;
            if (data.exceptWindow && data.exceptWindow === TabCommunication.windowName) return;

            if (data.propagate === 'show-in-drive') return TabCommunication.showInDrive(data.parameters);
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
         */
        propagate: function (propagate, options) {
            options = options || {};
            var jsonString;

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
            this.clearStorage();
        },

        /**
         * Clear Storage for TabCommunication
         */
        clearStorage: function () {
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
            this.propagate(propagate, {
                parameters: parameters,
                exceptWindow: this.windowName
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
            this.propagateToAllExceptWindow('get-active-windows', this.windowName);
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
         * Handle the propagate showInDrive
         *
         * @param {Object} parameters
         *  FileDescriptor
         *  @param {String} parameters.folder_id
         *   Folder to show in drive
         *  @param {String} parameters.id
         *   FileId to focus in drive
         */
        showInDrive: function (parameters) {
            require(['io.ox/files/api', 'io.ox/backbone/views/actions/util', 'io.ox/core/extensions'], function (FilesAPI, actionsUtil, ext) {
                FilesAPI.get(_.pick(parameters, 'folder_id', 'id')).done(function (fileDesc) {
                    var app = ox.ui.apps.get('io.ox/files');
                    var fileModel = new FilesAPI.Model(fileDesc);
                    ox.launch('io.ox/files/main', { folder: fileModel.get('folder_id') }).done(function () {
                        actionsUtil.invoke('io.ox/files/actions/show-in-folder', ext.Baton({
                            models: [fileModel],
                            app: app,
                            alwaysChange: true,
                            portal: true
                        }));
                    });
                });
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
            this.propagateToWindow('propagate-active-window', targetWindow, { windowName: this.windowName });
        },

        /**
         * Set the current windowNameObject
         *
         * @param {windowNameObject} newWindowNameObject
         */
        setWindowNameObject: function (newWindowNameObject) {
            _.extend(windowNameObject, newWindowNameObject);
        }
    };

    if (util.checkTabHandlingSupport() && !initialized) {
        initialize();
    }

    return TabCommunication;
});
