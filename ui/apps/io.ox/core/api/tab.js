/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define('io.ox/core/api/tab', [
    'io.ox/core/boot/util',
    'io.ox/core/tab/handling',
    'io.ox/core/tab/session',
    'io.ox/core/tab/communication'
], function (util, tabHandling, tabSession, tabCommunication) {

    /* global blankshield:true */

    'use strict';

    // PRIVATE --------------------------------------------------

    var initialized = false,
        api,
        _api = {},
        _checkTabHandlingSupport,
        keepFunctions = ['openBlank'];

    /**
     * Initialization of the TabAPI.
     */
    function initialize() {
        _.extend(ox, { tabHandlingEnabled: true });
        if (tabHandling.parentName) {
            _.extend(ox, { openedInBrowserTab: true });
            document.documentElement.classList.add('child-tab');
        }

        tabCommunication.setWindowNameObject(tabHandling.getWindowNameObject());
        initListener();

        _.extend(_api, api); // backup api functions
        _checkTabHandlingSupport = util.checkTabHandlingSupport; // backup function

        initialized = true;
    }

    /**
     * Disable the whole TabAPI
     */
    function disable() {
        for (var key in api) {
            if (_.contains(keepFunctions, key)) return;

            if (Object.prototype.hasOwnProperty.call(api, key)) {
                api[key] = $.noop;
            }
        }

        ox.tabHandlingEnabled = false;
        util.checkTabHandlingSupport = function () {
            return false;
        };
    }

    /**
     * Enable the whole TabAPI
     */
    function enable() {
        if (!initialized) initialize();

        _.extend(api, _api);

        ox.tabHandlingEnabled = true;
        util.checkTabHandlingSupport = _checkTabHandlingSupport;
    }

    /**
     * initialize listener
     */
    function initListener() {
        // initialize listener for beforeunload event to remove window from localStorage and clear the storage
        window.addEventListener('beforeunload', function () {
            tabCommunication.clearStorage(tabCommunication.DEFAULT_STORAGE_KEYS.SESSION);
            tabCommunication.clearStorage(tabCommunication.DEFAULT_STORAGE_KEYS.COMMUNICATION);
            // TODO: check if the window from the windowList at the localStorage must be removed earlier.
            //  otherwise the element is not removed before initialization when the tab is closed.
            tabHandling.removeFromWindowList(tabHandling.windowName);
        });
        // trigger the beforeunload event on beforeunload
        ox.on('beforeunload', function (unsavedChanges) {
            tabCommunication.events.trigger('beforeunload', unsavedChanges);
        });
    }

    // PUBLIC --------------------------------------------------

    api = {

        // tabHandling --------------------------------------------------

        // Logging out states definition object
        LOGGING_OUT_STATE: tabHandling.LOGGING_OUT_STATE,

        // Window types definition object
        WINDOW_TYPE: tabHandling.WINDOW_TYPE,

        // Opens a child browser tab.
        openChildTab: function (urlOrParams, options) {
            return tabHandling.openChild(urlOrParams, options);
        },

        // Opens a parent browser tab.
        openParentTab: function (urlOrParams, options) {
            tabHandling.openParent(urlOrParams, options);
        },

        // Opens a new tab
        openNewTab: function (url, windowNameObject) {
            return tabHandling.openTab(url, windowNameObject);
        },

        // Open a blank new tab window
        /**
         * Open a blank new tab window
         *
         * @param url
         *  The url which should be opened in the new blank tab
         *
         * @returns {Window}
         *  The new browser tab window
         */
        openBlank: function (url) {
            var newWindow;

            if (_.device('noopener') || _.browser.edgechromium >= 77) {
                newWindow = window.open('', '_blank');
                newWindow.opener = null;
                newWindow.location = url;
            } else {
                newWindow = blankshield.open(url, '_blank');
            }

            return newWindow;
        },

        // Disable the TabAPI
        disable: disable,

        // Enable the TabAPI
        enable: enable,

        // Creates the URL for a new browser tab. Adds the anchor parameters of the
        // current URL (except for specific parameters) to the new URL.
        createUrl: function (params, options) {
            return tabHandling.createURL(params, options);
        },

        // Returns the current window name
        getWindowName: function () {
            return tabHandling.windowName;
        },

        // Returns the window name of the parent window
        getParentWindowName: function () {
            return tabHandling.parentName;
        },

        // Returns the logout state that is retained even after a page reload.
        getLoggingOutState: function () {
            return tabHandling.getLoggingOutState();
        },

        // Set the logout state that is retained even after a page reload.
        setLoggingOutState: function (reason) {
            tabHandling.setLoggingOutState(reason);
        },

        // Returns true if the current window is a parent tab
        isParentTab: function () {
            return tabHandling.isParent();
        },

        // returns opened windows from localStorage
        getWindowList: function () {
            return tabHandling.getWindowList();
        },

        // tabCommunication --------------------------------------------------

        // Backbone events
        communicationEvents: tabCommunication.events,

        DEFAULT_STORAGE_KEYS: tabCommunication.DEFAULT_STORAGE_KEYS,

        // Propagate over the localStorage
        propagate: function (propagate, parameters) {
            tabCommunication.propagate(propagate, parameters);
        },

        // Ask for other windows by localStorage
        otherTabsLiving: function () {
            return tabCommunication.otherTabsLiving();
        },

        // Set ox-object params
        updateOxObject: function (parameters) {
            return tabCommunication.updateOxObject(parameters);
        },

        // tabSession --------------------------------------------------

        // Backbone events
        sessionEvents: tabSession.events,

        // Perform a login workflow (i.e. ask for a session and wait for an event)
        login: function () {
            return tabSession.login();
        }
    };

    // expose old API for compatibility reasons
    // can be removed once all stacks got updated
    api.TabHandling = {
        createURL: function () {
            if (ox.debug) console.warn('Deprecated: switch to new tab API.');
            api.createUrl.apply(this, arguments);
        }
    };

    return api;
});
