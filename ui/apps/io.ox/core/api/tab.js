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

define('io.ox/core/api/tab', [
    'io.ox/core/boot/util',
    'io.ox/core/tab/handling',
    'io.ox/core/tab/session',
    'io.ox/core/tab/communication'
], function (util, tabHandling, tabSession, tabCommunication) {

    'use strict';

    // PRIVATE --------------------------------------------------

    var initialized = false,
        api;

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
        initialized = true;
    }

    /**
     * initialize listener
     */
    function initListener() {
        // initialize listener for beforeunload event to remove window from localStorage and clear the storage
        window.addEventListener('beforeunload', function () {
            tabSession.clearStorage();
            tabCommunication.clearStorage();
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

        // tabHandling

        // Opens a child browser tab.
        openChildTab: function (urlOrParams, options) {
            tabHandling.openChild(urlOrParams, options);
        },

        // Opens a parent browser tab.
        openParentTab: function (urlOrParams, options) {
            tabHandling.openParent(urlOrParams, options);
        },

        // Opens a new tab
        openNewTab: function (url, windowNameObject) {
            return tabHandling.openTab(url, windowNameObject);
        },

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

        // tabCommunication

        // Backbone events
        communicationEvents: tabCommunication.events,

        // Propagate to all windows, except the specified by the localStorage
        propagateToAllExceptWindow: function (propagate, exceptWindow, parameters) {
            tabCommunication.propagateToAllExceptWindow(propagate, exceptWindow, parameters);
        },

        // Propagate to specified window by the localStorage
        propagateToWindow: function (propagate, targetWindow, parameters) {
            tabCommunication.propagateToWindow(propagate, targetWindow, parameters);
        },

        // Propagate to all windows by the localStorage.
        propagateToAll: function (propagate, parameters) {
            tabCommunication.propagateToAll(propagate, parameters);
        },

        // Ask for other windows by localStorage
        otherTabsLiving: function () {
            return tabCommunication.otherTabsLiving();
        },

        // Set ox-object params
        updateOxObject: function (parameters) {
            return tabCommunication.updateOxObject(parameters);
        },

        // tabSession

        // Backbone events
        sessionEvents: tabSession.events,

        // Send a message to other tabs to logout these tabs
        propagateLogout: function (options) {
            tabSession.propagateLogout(options);
        },

        // Send a session over localStorage to login logged out tabs
        propagateLogin: function (relogin) {
            tabSession.propagateLogin(relogin);
        },

        // Perform a login workflow (i.e. ask for a session and wait for an event)
        login: function () {
            return tabSession.login();
        }
    };

    if (util.checkTabHandlingSupport() && !initialized) {
        initialize();
    }

    return api;
});
