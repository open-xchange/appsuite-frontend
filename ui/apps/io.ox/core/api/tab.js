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
    'io.ox/core/boot/util'
], function (util) {

    'use strict';

    var TabHandling = {};

    // all opened windows in localStorage
    TabHandling.currentWindows = [];

    // current window.name
    TabHandling.windowName = '';

    // current window type: parent|child
    TabHandling.windowType = '';

    // the opener name, if window is a child
    TabHandling.parentName = '';

    TabHandling.key = 'appsuite.window-handling';

    TabHandling.initialized = false;

    /**
     * fetch localStorage and initialize current window
     */
    TabHandling.initialize = function () {
        TabHandling.fetch();
        TabHandling.setCurrentWindow();
        _.extend(ox, { tabHandlingEnabled: true });

        if (TabHandling.parentName) {
            _.extend(ox, { openedInBrowserTab: true });
            document.documentElement.classList.add('child-tab');
        }

        TabHandling.initialized = true;
    };

    /**
     * update opened windows from localStorage
     */
    TabHandling.fetch = function () {
        var data = localStorage.getItem(TabHandling.key) || JSON.stringify([]);

        try {
            TabHandling.currentWindows = JSON.parse(data);
            if (!_.isArray(TabHandling.currentWindows)) TabHandling.currentWindows = [];
        } catch (e) {
            TabHandling.currentWindows = [];
            if (ox.debug) console.warn('TabHandling.fetch', e);
        }
    };

    /**
     * update opened windows from localStorage
     */
    TabHandling.getWindowList = function () {
        TabHandling.fetch();
        return TabHandling.currentWindows;
    };

    /**
     * save windows from object to localStorage
     */
    TabHandling.store = function () {
        var currentWindows = TabHandling.currentWindows || [],
            data;

        try {
            data = JSON.stringify(currentWindows);
        } catch (e) {
            data = JSON.stringify([]);
            if (ox.debug) console.warn('TabHandling.store', e);
        } finally {
            localStorage.setItem(TabHandling.key, data);
        }
    };

    /**
     * add a new window to localStorage
     *
     * @param {Object} windowNameObject
     */
    TabHandling.add = function (windowNameObject) {
        if (!windowNameObject || _.isEmpty(windowNameObject)) return;
        if (!windowNameObject.windowName) return;

        var windowObject = _.pick(windowNameObject, 'windowName', 'windowType');
        if (windowNameObject.windowType === 'child') _.extend(windowObject, { parent: windowNameObject.parentName });

        if (TabHandling.getFromStore(windowNameObject.windowName)) return;

        TabHandling.currentWindows.push(windowObject);
        TabHandling.store();
    };

    /**
     * remove specified window from localStorage
     *
     * @param {String} windowName
     *  which window should be removed
     */
    TabHandling.remove = function (windowName) {
        TabHandling.fetch();
        TabHandling.currentWindows = _.without(TabHandling.currentWindows, _.findWhere(TabHandling.currentWindows, {
            windowName: windowName
        }));
        TabHandling.store();
    };

    /**
     * checks if current window is a parent or a child window
     */
    TabHandling.setCurrentWindow = function () {
        // TODO check if isChild information does already exists to use a existing variable
        var isChild = location.href.indexOf('office?app') >= 0;
        var windowNameObject = TabHandling.getSanitizeWindowNameObject(isChild);

        window.name = JSON.stringify(windowNameObject);
        _.extend(TabHandling, _.pick(windowNameObject, 'windowName', 'windowType', 'parentName'));

        TabHandling.initListener();
    };

    /**
     *  Returns a sanitized windowNameObject for a given windowType (parent/child).
     *
     * @param {Boolean} isChild
     *  Whether it's a child or a parent window.
     *
     * @returns {Object} windowNameObject
     */
    TabHandling.getSanitizeWindowNameObject = function (isChild) {

        var windowNameObject = TabHandling.parseWindowName(window.name);

        if (isChild) {
            windowNameObject = _.extend(windowNameObject, {
                // specified child window data, re-use existing data (e.g. reload, child tab creation)
                windowName: windowNameObject.windowName || TabHandling.createIdentifier('child'),
                windowType: 'child',
                parentName: windowNameObject.parentName || TabHandling.createIdentifier('parent')
            });
        }

        if (!isChild) {
            // clean up previous child data to get a clean state
            if (windowNameObject.windowType === 'child') {
                delete windowNameObject.parentName;
                // delete the windowName so that a new parent name is created later
                delete windowNameObject.windowName;
            }

            windowNameObject = _.extend(windowNameObject, {
                // specified parent window data, re-use existing data (e.g. reload)
                // note: parent windowName must be retained after re-login for 'show in drive' action
                windowName: windowNameObject.windowName || TabHandling.createIdentifier('parent'),
                windowType: 'parent'
            });
        }

        return windowNameObject;
    };

    /**
     * extracts an object out of a JSON String
     *
     * @param {String} windowName
     *  JSON String from window name
     *
     * @returns {Object} windowNameObject
     */
    TabHandling.parseWindowName = function (windowName) {
        windowName = windowName || JSON.stringify({});
        var returnValue;

        try {
            returnValue = JSON.parse(windowName);
        } catch (e) {
            returnValue = {};
            if (ox.debug) console.warn('TabHandling.parseWindowName', e);
        }

        return returnValue;
    };

    /**
     * return a new window name
     *
     * @param {String} type
     *  'child' or 'parent'
     *
     * @returns {string} windowName
     *  returns window name
     */
    TabHandling.createIdentifier = function (type) {
        return type + '-' + Date.now();
    };

    /**
     * returns the JSON window name with all parameters
     *
     * @returns {string}
     *  returns a JSON string for the window name
     */
    TabHandling.getJSONWindowName = function () {
        return JSON.stringify({ windowName: TabHandling.createIdentifier('child'), windowType: 'child', parentName: TabHandling.windowName });
    };


    /**
     * Set the logout state that is retained even after a page reload.
     */
    TabHandling.setLoggingOutState = function (reason) {
        // save logout reason
        var windowName = window.name || JSON.stringify({}),
            windowNameObject;
        try {
            windowNameObject = JSON.parse(windowName);
        } catch (e) {
            windowNameObject = {};
            if (ox.debug) console.warn('setLoggingOutState', e);
        } finally {
            windowNameObject.loggingOut = reason;
            window.name = JSON.stringify(windowNameObject);
        }
    };

    /**
     * Get the logout state that is retained even after a page reload.
     *
     * @returns {boolean}
     *  Returns true the there was a logout.
     */
    TabHandling.getLoggingOutState = function () {
        // save logout reason
        var windowName = window.name || JSON.stringify({}),
            windowNameObject;
        try {
            windowNameObject = JSON.parse(windowName);
        } catch (e) {
            windowNameObject = {};
            if (ox.debug) console.warn('getLoggingOutState', e);
        }

        return windowNameObject.loggingOut;
    };

    /**
     * check if a window already exists in localStorage
     *
     * @param {String} windowName
     *  which windowName should be searched
     *
     * @returns {boolean} found
     *  returns true if the windowName is found
     */
    TabHandling.getFromStore = function (windowName) {
        TabHandling.fetch();
        return _.find(TabHandling.currentWindows, function (obj) {
            return obj.windowName === windowName;
        });
    };

    /**
     * returns the parent window from localStorage if exists
     *
     * @param {String} windowName
     *  which parent windowName should be searched
     *
     * @returns {boolean}
     *  returns true if the windowName is found
     */
    TabHandling.getParent = function (windowName) {
        TabHandling.fetch();
        var current = _.find(TabHandling.currentWindows, function (obj) {
            return obj.windowName === windowName;
        });
        return current.parent;
    };

    /**
     * add a new window to the localStorage with a new name
     *
     * @param {String} type
     *  'parent or 'child'
     */
    TabHandling.newWindow = function (type) {
        var windowName = TabHandling.createIdentifier(type);
        TabHandling.add(windowName);
    };

    /**
     * opens a new tab
     *
     * @param {String} url
     *  url to open in the tab
     * @param {Object} windowObject
     *  if the windowObject is empty the windowObject is extracted from the TabHandling object
     *
     * @returns {Window} newly created window
     */
    TabHandling.openTab = function (url, windowObject) {
        var urlToOpen = url || ox.abs + ox.root + '/busy.html', windowName;

        if (_.isEmpty(windowObject)) windowObject = _.pick(TabHandling, 'windowName', 'windowType', 'parentName');
        windowName = JSON.stringify(_.pick(windowObject, 'windowName', 'windowType', 'parentName'));

        // try to open via window.opener property
        if (windowObject.windowType === 'parent' && window.opener && window.opener.name) windowName = window.opener.name;

        return window.open(urlToOpen, windowName);
    };

    /**
     * Creates the URL for a new browser tab. Adds the anchor parameters of the
     * current URL (except for specific parameters) to the new URL.
     *
     * @param {Dict} params
     *  Additional anchor parameters to be added to the URL, as key/value map.
     *
     * @param {object} [options]
     *  Optional parameters:
     *  - {string[]|string} [options.exclude]
     *      The keys of all anchor parameters in the current URL to be ignored.
     *  - {string} [options.suffix]
     *      A string to extend the URL with (before the anchor parameters). May
     *      also contain query parameters. Must not contain a leading slash
     *      character.
     *
     *  @returns {string}
     *   The URL for a new browser tab.
     */
    TabHandling.createURL = function (params, options) {

        // get the anchor map from the current URL
        var anchor = _.omit(_.url.hash(), '!!');

        // exclude the specified anchor parameters
        var exclude = options && options.exclude;
        if (exclude) { anchor = _.omit(anchor, exclude); }

        // add the passed anchor parameters
        _.extend(anchor, params);

        // build the URL with specified suffix and anchor parameters
        var suffix = '/' + ((options && options.suffix) || '');
        return ox.abs + ox.root + suffix + '#!&' + $.param(anchor);
    };

    /**
     * Opens a parent browser tab.
     *
     * @param {string|Dict} urlOrParams
     *  A fixed URL to be opened in the browser tab, or anchor attributes that
     *  will be passed to the function `TabHandling.createURL()` to create the
     *  URL.
     *
     * @param {object} [options]
     *  Optional parameters for the function `TabHandling.createURL()`. Will be
     *  ignored if the argument `urlOrParams` is a URL.
     */
    TabHandling.openParent = function (urlOrParams, options) {
        var url = _.isString(urlOrParams) ? urlOrParams : TabHandling.createURL(urlOrParams, options);
        var newWindow = TabHandling.openTab(url, {
            windowName: TabHandling.parentName,
            windowType: 'parent'
        });
        if (!window.opener) window.opener = newWindow;
    };

    /**
     * Opens a child browser tab.
     *
     * @param {string|Dict} urlOrParams
     *  A fixed URL to be opened in the browser tab, or anchor attributes that
     *  will be passed to the function `TabHandling.createURL()` to create the
     *  URL.
     *
     * @param {object} [options]
     *  Optional parameters for the function `TabHandling.createURL()`. Will be
     *  ignored if the argument `urlOrParams` is a URL.
     *
     * @returns {window} window
     *  returns the new created window Object
     */
    TabHandling.openChild = function (urlOrParams, options) {
        var url = _.isString(urlOrParams) ? urlOrParams : TabHandling.createURL(urlOrParams, options);
        return TabHandling.openTab(url, {
            windowName: TabHandling.createIdentifier('child'),
            windowType: 'child',
            parentName: TabHandling.windowType === 'child' ? TabHandling.parentName : TabHandling.windowName
        });
    };

    /**
     * initialize listener for beforeunload event to remove window from localStorage
     */
    TabHandling.initListener = function () {
        window.addEventListener('storage', function (e) {
            if (e.key !== TabHandling.key) return;
        });
        ox.on('beforeunload', function (unsavedChanges) {
            TabCommunication.events.trigger('beforeunload', unsavedChanges);
        });
        // be early, event listener on ox are initialized too late
        window.addEventListener('beforeunload', function () {
            TabSession.clearStorage();
            TabCommunication.clearStorage();
            TabHandling.remove(TabHandling.windowName);
        });
        ox.on('login:success', function () {
            TabHandling.add(_.pick(TabHandling, 'windowName', 'windowType', 'parentName'));
        });
    };

    /**
     * check is the current window is opened by another window
     *
     * @returns {boolean}
     *  returns true if the current window is opened by another
     */
    TabHandling.isTab = function () {
        return !!TabHandling.parentName;
    };

    TabHandling.isParent = function () {
        return !TabHandling.parentName;
    };

    /**
     * An Object for Session Handling
     * @type {{}}
     */
    var TabSession = {};
    // key for the localStorage
    TabSession.key = 'appsuite.session-management';
    // events object to trigger changes
    TabSession.events = _.extend({}, Backbone.Events);

    /**
     * Initialize localStorage listener if localStorage is available
     */
    TabSession.initialize = function () {
        if (!Modernizr.localstorage) return;
        TabSession.initListener();
    };

    /**
     * Initialize listener for storage events and listener for propagation
     */
    TabSession.initListener = function () {
        window.addEventListener('storage', function (e) {
            if (e.key !== TabSession.key) return;
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
                    TabSession.propagateSession();
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
                    require('io.ox/core/main').logout({ force: true, skipSessionLogout: true, autologout: data.parameters && data.parameters.autologout });
                    break;
                case 'propagateLogin':
                    if (ox.session && !data.parameters.relogin) return;
                    TabSession.events.trigger(data.propagate, data.parameters);
                    break;
                default:
                    break;
            }
        });

        TabSession.events.listenTo(TabSession.events, 'getSession', function () {
            TabSession.propagateSession();
        });

        TabSession.events.listenTo(TabSession.events, 'propagateLogin', function (parameters) {
            if (!ox.signin && !parameters.relogin) return;
            require(['io.ox/core/boot/login/tabSession'], function (tabSessionLogin) {
                tabSessionLogin(parameters);
            });
        });
    };

    /**
     * Clear localStorage for TabSession
     */
    TabSession.clearStorage = function () {
        try {
            localStorage.removeItem(TabSession.key);
        } catch (e) {
            if (ox.debug) console.warn('TabSession.clearStorage', e);
        }
    };

    /**
     * Propagate Session Handling over the localStorage
     *
     * @param {String} propagate
     *  the key to trigger event
     * @param {Object} parameters
     *  parameters that should be passed to the trigger
     */
    TabSession.propagate = function (propagate, parameters) {
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

        localStorage.setItem(TabSession.key, jsonString);
        TabSession.clearStorage();
    };

    /**
     * Ask over localStorage if another tab has a session
     */
    TabSession.propagateGetSession = function () {
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
                TabSession.propagate('getSession', {});
            }
        }
    };

    /**
     * Perform a login workflow (i.e. ask for a session and wait for an event)
     */
    TabSession.login = function () {
        TabSession.propagateGetSession();
        var def = $.Deferred(),
            timeout = setTimeout(function () {
                def.reject();
            }, 50);

        TabSession.events.listenTo(TabSession.events, 'propagateSession', def.resolve);

        return def.done(function () { window.clearTimeout(timeout); });
    };

    /**
     * Send a session over localStorage to other tabs
     */
    TabSession.propagateSession = function () {
        if (!ox.session) {
            TabSession.propagate('propagateNoSession');
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
    };

    /**
     * Send a message to other tabs to logout these tabs
     */
    TabSession.propagateLogout = function (options) {
        TabSession.propagate('propagateLogout', options);
    };

    /**
     * Send a session over localStorage to login logged out tabs
     */
    TabSession.propagateLogin = function (relogin) {
        TabSession.propagate('propagateLogin', {
            session: ox.session,
            language: ox.language,
            theme: ox.theme,
            user: ox.user,
            user_id: ox.user_id,
            context_id: ox.context_id,
            relogin: relogin
        });
    };

    /**
     * An Object for the tab communication
     */
    var TabCommunication = {};
    // key for the localStorage
    TabCommunication.key = 'appsuite.window-communication';
    // events object to trigger changes
    TabCommunication.events = _.extend({}, Backbone.Events);

    /**
     * Initialize localStorage listener if localStorage is available
     */
    TabCommunication.initialize = function () {
        if (!Modernizr.localstorage) return;
        TabCommunication.initListener();
    };

    /**
     * Write a new localStorage item to spread to all other tabs or to a
     * specified tab.
     *
     * @param {String} propagate
     *  the key to trigger event
     *
     * Optional parameter
     * @param {Object} [options]
     *  options object
     *  @param {String} [options.parameters]
     *   parameters that should be passed to the trigger
     *  @param {String} [options.exceptWindow]
     *   propagate to all windows except this
     *  @param {String} [options.targetWindow]
     *   propagate to this window
     */
    TabCommunication.propagate = function (propagate, options) {
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
        localStorage.setItem(TabCommunication.key, jsonString);
        TabCommunication.clearStorage();
    };

    /**
     * Clear Storage for TabCommunication
     */
    TabCommunication.clearStorage = function () {
        try {
            localStorage.removeItem(TabCommunication.key);
        } catch (e) {
            if (ox.debug) console.warn('TabCommunication.clearStorage', e);
        }
    };

    /**
     * Propagate to all windows by the localStorage.
     *
     * Note: Due to different browser behaviour in handling localStorage events in the current tab, this function uses
     * the localStorage only for all other browser tabs and triggers the event for the current tab directly.
     *
     * @param {String} propagate
     *  the key to trigger event
     *
     * Optional parameters
     * @param {Object} [parameters]
     *  parameters that should be passed to the trigger
     */
    TabCommunication.propagateToAll = function (propagate, parameters) {
        TabCommunication.propagate(propagate, { parameters: parameters, exceptWindow: TabHandling.windowName });
        TabCommunication.events.trigger(propagate, parameters);
    };

    /**
     * Propagate to all windows, except the specified by the localStorage
     *
     * @param {String} propagate
     *  the key to trigger event
     *
     * @param {String} windowName
     *  the windowName to exclude
     *
     * Optional parameters
     * @param {Object} [parameters]
     *  parameters that should be passed to the trigger
     */
    TabCommunication.propagateToAllExceptWindow = function (propagate, windowName, parameters) {
        TabCommunication.propagate(propagate, { parameters: parameters, exceptWindow: windowName });
    };

    /**
     * Propagate to specified window by the localStorage
     *
     * @param {String} propagate
     *  the key to trigger event
     *
     * @param {String} windowName
     *  the windowName to propagate to
     *
     * Optional parameters
     * @param {Object} [parameters]
     *  parameters that should be passed to the trigger
     */
    TabCommunication.propagateToWindow = function (propagate, windowName, parameters) {
        TabCommunication.propagate(propagate, { parameters: parameters, targetWindow: windowName });
    };

    /**
     * Ask for other windows by localStorage
     */
    TabCommunication.otherTabsLiving = function () {
        TabCommunication.propagateToAllExceptWindow('get-active-windows', TabHandling.windowName);
        var def = $.Deferred(),
            timeout = setTimeout(function () {
                def.reject();
            }, 100);

        TabCommunication.events.listenToOnce(TabCommunication.events, 'propagate-active-window', def.resolve);

        return def.done(function () { window.clearTimeout(timeout); });
    };

    /**
     * initialize the localStorage listener
     */
    TabCommunication.initListener = function () {
        window.addEventListener('storage', function (e) {
            if (e.key !== TabCommunication.key) return;
            var eventData = e.newValue || JSON.stringify({}),
                data;

            try {
                data = JSON.parse(eventData);
            } catch (e) {
                data = {};
                if (ox.debug) console.warn('TabCommunication.initListener', e);
            }

            if (data.targetWindow && data.targetWindow !== TabHandling.windowName) return;
            if (data.exceptWindow && data.exceptWindow === TabHandling.windowName) return;

            if (!data.propagate) return;
            if (data.propagate === 'show-in-drive') return TabCommunication.showInDrive(data.parameters);
            if (data.propagate === 'get-active-windows') return TabCommunication.getActiveWindows(data.exceptWindow);
            if (data.propagate === 'update-ox-object') return TabCommunication.updateOxObject(data.parameters);

            TabCommunication.events.trigger(data.propagate, data.parameters);
        });
    };

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
    TabCommunication.showInDrive = function (parameters) {
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
    };

    /**
     * Set ox-object params
     * @param {String} key
     *  object key
     * @param {String} parameter
     *  parameter to set
     *
     * @returns {boolean}
     */
    TabCommunication.updateOxObject = function (parameters) {
        if (!parameters) return false;

        _.extend(ox, parameters);
        return true;
    };

    /**
     * Tell specified window, that an active tab exist
     *
     * @param {String} targetWindow
     *  windowName for propagation
     */
    TabCommunication.getActiveWindows = function (targetWindow) {
        if (!ox.session) return;
        TabCommunication.propagateToWindow('propagate-active-window', targetWindow, { windowName: TabHandling.windowName });
    };

    // initialize tab object
    if (util.checkTabHandlingSupport() && !TabHandling.initialized) {
        TabHandling.initialize();
        TabCommunication.initialize();
        TabSession.initialize();
    }

    return {
        TabHandling: TabHandling,
        TabSession: TabSession,
        TabCommunication: TabCommunication
    };
});
