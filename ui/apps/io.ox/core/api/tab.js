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
], function (util, TabHandling, TabSession, TabCommunication) {

    'use strict';

    // PRIVATE --------------------------------------------------

    var initialized = false,
        api;

    /**
     * Initialization of the TabAPI.
     */
    function initialize() {
        _.extend(ox, { tabHandlingEnabled: true });
        if (TabHandling.parentName) {
            _.extend(ox, { openedInBrowserTab: true });
            document.documentElement.classList.add('child-tab');
        }

        TabCommunication.setWindowNameObject(TabHandling.getWindowNameObject());
        initListener();
        initialized = true;
    }

    /**
     * initialize listener
     */
    function initListener() {
        // initialize listener for beforeunload event to remove window from localStorage and clear the storage
        window.addEventListener('beforeunload', function () {
            TabSession.clearStorage();
            TabCommunication.clearStorage();
            // TODO: check if the window from the windowList at the localStorage must be removed earlier.
            //  otherwise the element is not removed before initialization when the tab is closed.
            TabHandling.removeFromWindowList(TabHandling.windowName);
        });
        // trigger the beforeunload event on beforeunload
        ox.on('beforeunload', function (unsavedChanges) {
            TabCommunication.events.trigger('beforeunload', unsavedChanges);
        });
    }

    // PUBLIC --------------------------------------------------

    api = {

        // TabHandling

        // Opens a child browser tab.
        openChildTab: function (urlOrParams, options) {
            TabHandling.openChild(urlOrParams, options);
        },

        // Opens a parent browser tab.
        openParentTab: function (urlOrParams, options) {
            TabHandling.openParent(urlOrParams, options);
        },

        // Opens a new tab
        openNewTab: function (url, windowNameObject) {
            return TabHandling.openTab(url, windowNameObject);
        },

        // Creates the URL for a new browser tab. Adds the anchor parameters of the
        // current URL (except for specific parameters) to the new URL.
        createUrl: function (params, options) {
            return TabHandling.createURL(params, options);
        },

        // Returns the current window name
        getWindowName: function () {
            return TabHandling.windowName;
        },

        // Returns the window name of the parent window
        getParentWindowName: function () {
            return TabHandling.parentName;
        },

        // Returns the logout state that is retained even after a page reload.
        getLoggingOutState: function () {
            return TabHandling.getLoggingOutState();
        },

        // Set the logout state that is retained even after a page reload.
        setLoggingOutState: function (reason) {
            TabHandling.setLoggingOutState(reason);
        },

        // Returns true if the current window is a parent tab
        isParentTab: function () {
            return TabHandling.isParent();
        },

        // returns opened windows from localStorage
        getWindowList: function () {
            return TabHandling.getWindowList();
        },

        // TabCommunication

        // Backbone events
        communicationEvents: TabCommunication.events,

        // Propagate to all windows, except the specified by the localStorage
        propagateToAllExceptWindow: function (propagate, exceptWindow, parameters) {
            TabCommunication.propagateToAllExceptWindow(propagate, exceptWindow, parameters);
        },

        // Propagate to specified window by the localStorage
        propagateToWindow: function (propagate, targetWindow, parameters) {
            TabCommunication.propagateToWindow(propagate, targetWindow, parameters);
        },

        // Propagate to all windows by the localStorage.
        propagateToAll: function (propagate, parameters) {
            TabCommunication.propagateToAll(propagate, parameters);
        },

        // Ask for other windows by localStorage
        otherTabsLiving: function () {
            return TabCommunication.otherTabsLiving();
        },

        // Set ox-object params
        updateOxObject: function (parameters) {
            return TabCommunication.updateOxObject(parameters);
        },

        // TabSession

        // Backbone events
        sessionEvents: TabSession.events,

        // Send a message to other tabs to logout these tabs
        propagateLogout: function (options) {
            TabSession.propagateLogout(options);
        },

        // Send a session over localStorage to login logged out tabs
        propagateLogin: function (relogin) {
            TabSession.propagateLogin(relogin);
        },

        // Perform a login workflow (i.e. ask for a session and wait for an event)
        login: function () {
            return TabSession.login();
        }
    };

    if (util.checkTabHandlingSupport() && !initialized) {
        initialize();
    }

    return api;
});
