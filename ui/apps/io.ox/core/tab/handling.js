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

define('io.ox/core/tab/handling', ['io.ox/core/boot/util'], function (util) {

    'use strict';

    // DEFINITIONS --------------------------------------------------

    /**
     * @typedef {Object} windowNameObject
     * @property {String} windowName
     *   the name of the current window
     * @property {TabHandling.WINDOW_TYPE} windowType
     *   is the current window a child or parent tab
     * @property {String} [parentName]
     *   the name of the opener
     */

    // PRIVATE --------------------------------------------------

    var initialized    = false,

        // object for the tab handling
        TabHandling,

        // key for the localStorage
        storageKey     = 'appsuite.window-handling',

        /**
         * all opened windows in localStorage
         * @type {Array.<windowNameObject>}
         */
        currentWindows = [];

    /**
     * fetch localStorage and initialize current window
     */
    function initialize() {
        if (!Modernizr.localstorage) return;

        fetch();
        setCurrentWindow();
        initialized = true;
    }

    /**
     * update opened windows from localStorage
     */
    function fetch() {
        var data = localStorage.getItem(storageKey) || JSON.stringify([]);

        try {
            currentWindows = JSON.parse(data);
            if (!_.isArray(currentWindows)) currentWindows = [];
        } catch (e) {
            currentWindows = [];
            if (ox.debug) console.warn('TabHandling.fetch', e);
        }
    }

    /**
     * save windows from object to localStorage
     */
    function store() {
        var currentWindowsObject = currentWindows || [],
            data;

        try {
            data = JSON.stringify(currentWindowsObject);
        } catch (e) {
            data = JSON.stringify([]);
            if (ox.debug) console.warn('TabHandling.store', e);
        } finally {
            localStorage.setItem(storageKey, data);
        }
    }


    /**
     * add a new window to localStorage
     *
     * @param {windowNameObject} windowNameObject
     *  the windowNameObject to add
     */
    function add(windowNameObject) {
        if (!windowNameObject || _.isEmpty(windowNameObject)) return;
        if (!windowNameObject.windowName) return;

        var windowObject = _.pick(windowNameObject, 'windowName', 'windowType');
        if (windowNameObject.windowType === TabHandling.WINDOW_TYPE.CHILD) _.extend(windowObject, { parent: windowNameObject.parentName });

        if (getFromStore(windowNameObject.windowName)) return;

        currentWindows.push(windowObject);
        store();
    }

    /**
     * remove specified window from localStorage
     *
     * @param {String} windowName
     *  which window should be removed
     */
    function remove(windowName) {
        fetch();
        currentWindows = _.without(currentWindows, _.findWhere(currentWindows, {
            windowName: windowName
        }));
        store();
    }

    /**
     * checks if current window is a parent or a child window
     */
    function setCurrentWindow() {
        // TODO check if isChild information does already exists to use a existing variable
        var isChild = location.href.indexOf('office?app') >= 0;
        var windowNameObject = getSanitizeWindowNameObject(isChild);

        window.name = JSON.stringify(windowNameObject);
        _.extend(TabHandling, _.pick(windowNameObject, 'windowName', 'windowType', 'parentName'));

        initListener();
    }

    /**
     *  Returns a sanitized windowNameObject for a given windowType (parent/child).
     *
     * @param {Boolean} isChild
     *  Whether it's a child or a parent window.
     *
     * @returns {windowNameObject}
     */
    function getSanitizeWindowNameObject(isChild) {

        var windowNameObject = parseWindowName(window.name);

        if (isChild) {
            windowNameObject = _.extend(windowNameObject, {
                // specified child window data, re-use existing data (e.g. reload, child tab creation)
                windowName: windowNameObject.windowName || createIdentifier(TabHandling.WINDOW_TYPE.CHILD),
                windowType: TabHandling.WINDOW_TYPE.CHILD,
                parentName: windowNameObject.parentName || createIdentifier(TabHandling.WINDOW_TYPE.PARENT)
            });
        }

        if (!isChild) {
            // clean up previous child data to get a clean state
            if (windowNameObject.windowType === TabHandling.WINDOW_TYPE.CHILD) {
                delete windowNameObject.parentName;
                // delete the windowName so that a new parent name is created later
                delete windowNameObject.windowName;
            }

            windowNameObject = _.extend(windowNameObject, {
                // specified parent window data, re-use existing data (e.g. reload)
                // note: parent windowName must be retained after re-login for 'show in drive' action
                windowName: windowNameObject.windowName || createIdentifier(TabHandling.WINDOW_TYPE.PARENT),
                windowType: TabHandling.WINDOW_TYPE.PARENT
            });
        }

        return windowNameObject;
    }


    /**
     * extracts an object out of a JSON String
     *
     * @param {String} windowName
     *  JSON String from window name
     *
     * @returns {Object} windowNameObject
     */
    function parseWindowName(windowName) {
        windowName = windowName || JSON.stringify({});
        var returnValue;

        try {
            returnValue = JSON.parse(windowName);
        } catch (e) {
            returnValue = {};
            if (ox.debug) console.warn('TabHandling.parseWindowName', e);
        }

        return returnValue;
    }

    /**
     * return a new window name
     *
     * @param {TabHandling.WINDOW_TYPE} type
     *  'child' or 'parent'
     *
     * @returns {string} windowName
     *  returns window name
     */
    function createIdentifier(type) {
        return type + '-' + Date.now();
    }

    /**
     * check if a window already exists in localStorage
     *
     * @param {String} windowName
     *  which windowName should be searched
     *
     * @returns {boolean} found
     *  returns true if the windowName is found
     */
    function getFromStore(windowName) {
        fetch();
        return _.find(currentWindows, function (obj) {
            return obj.windowName === windowName;
        });
    }

    /**
     * initialize listener for beforeunload event to remove window from localStorage
     */
    function initListener() {
        ox.on('login:success', function () {
            add(_.pick(TabHandling, 'windowName', 'windowType', 'parentName'));
        });
    }

    // PUBLIC --------------------------------------------------

    TabHandling = {
        // current window.name
        windowName: '',

        // current window type: parent|child
        windowType: '',

        // the opener name, if window is a child
        parentName: '',

        /**
         * Logging out states
         * @readonly
         * @enum {String}
         */
        LOGGING_OUT_STATE: { LEADER: 'leader', FOLLOWER: 'follower' },

        /**
         * Window type values
         * @readonly
         * @enum {String}
         */
        WINDOW_TYPE: { PARENT: 'parent', CHILD: 'child' },

        /**
         * update opened windows from localStorage
         *
         * @returns {Array.<windowNameObject>}
         */
        getWindowList: function () {
            fetch();
            return currentWindows;
        },

        /**
         * Set the logout state that is retained even after a page reload.
         *
         * @param {TabHandling.LOGGING_OUT_STATE} reason
         */
        setLoggingOutState: function (reason) {
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
        },

        /**
         * Get the logout state that is retained even after a page reload.
         *
         * @returns {TabHandling.LOGGING_OUT_STATE}
         */
        getLoggingOutState: function () {
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
        },

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
        createURL: function (params, options) {

            // get the anchor map from the current URL
            var anchor = _.omit(_.url.hash(), '!!');

            // exclude the specified anchor parameters
            var exclude = options && options.exclude;
            if (exclude) {
                anchor = _.omit(anchor, exclude);
            }

            // add the passed anchor parameters
            _.extend(anchor, params);

            // build the URL with specified suffix and anchor parameters
            var suffix = '/' + ((options && options.suffix) || '');
            return ox.abs + ox.root + suffix + '#!&' + $.param(anchor);
        },

        /**
         * opens a new tab
         *
         * @param {String} url
         *  url to open in the tab
         * @param {windowNameObject} [windowObject]
         *  if the windowObject is empty the windowObject is extracted from the TabHandling object
         *
         * @returns {Window} newly created window
         */
        openTab: function (url, windowObject) {
            var urlToOpen = url || ox.abs + ox.root + '/busy.html', windowName;

            if (_.isEmpty(windowObject)) windowObject = _.pick(this, 'windowName', 'windowType', 'parentName');
            windowName = JSON.stringify(_.pick(windowObject, 'windowName', 'windowType', 'parentName'));

            // try to open via window.opener property
            if (windowObject.windowType === this.WINDOW_TYPE.PARENT && window.opener && window.opener.name) windowName = window.opener.name;

            return window.open(urlToOpen, windowName);
        },

        /**
         * Opens a parent browser tab.
         *
         * @param {String|Dict} urlOrParams
         *  A fixed URL to be opened in the browser tab, or anchor attributes that
         *  will be passed to the function `TabHandling.createURL()` to create the
         *  URL.
         *
         * @param {Object} [options]
         *  Optional parameters for the function `TabHandling.createURL()`. Will be
         *  ignored if the argument `urlOrParams` is a URL.
         *
         * @returns {window}
         *  returns the new created or reused window Object
         */
        openParent: function (urlOrParams, options) {
            var url = _.isString(urlOrParams) ? urlOrParams : this.createURL(urlOrParams, options);
            var newWindow = this.openTab(url, {
                windowName: this.parentName,
                windowType: this.WINDOW_TYPE.PARENT
            });
            if (!window.opener) window.opener = newWindow;
            return newWindow;
        },

        /**
         * Opens a child browser tab.
         *
         * @param {String|Dict} urlOrParams
         *  A fixed URL to be opened in the browser tab, or anchor attributes that
         *  will be passed to the function `TabHandling.createURL()` to create the
         *  URL.
         *
         * @param {Object} [options]
         *  Optional parameters for the function `TabHandling.createURL()`. Will be
         *  ignored if the argument `urlOrParams` is a URL.
         *
         * @returns {window}
         *  returns the new created window Object
         */
        openChild: function (urlOrParams, options) {
            var url = _.isString(urlOrParams) ? urlOrParams : this.createURL(urlOrParams, options);
            return this.openTab(url, {
                windowName: createIdentifier(this.WINDOW_TYPE.CHILD),
                windowType: this.WINDOW_TYPE.CHILD,
                parentName: this.windowType === this.WINDOW_TYPE.CHILD ? this.parentName : this.windowName
            });
        },

        /**
         * Returns true if the current window is a parent tab
         *
         * @returns {boolean}
         */
        isParent: function () {
            return !this.parentName;
        },

        /**
         * Returns the current windowNameObject
         *
         * @returns {windowNameObject}
         */
        getWindowNameObject: function () {
            return _.pick(this, 'windowName', 'windowType', 'parentName');
        },

        /**
         * Remove specified window from windowList
         *
         * @param {String} windowName
         */
        removeFromWindowList: function (windowName) {
            if (!windowName) return;
            remove(windowName);
        }
    };

    if (util.checkTabHandlingSupport() && !initialized) {
        initialize();
    }

    return TabHandling;
});
