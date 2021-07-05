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

define('io.ox/core/tk/sessionrestore', function () {

    // private static methods ----------------------------------------------------

    function isActive() {
        return true;
    }

    /**
     * Names of properties in the `window.name` object to be processed here.
     */
    var TAB_HANDLING_PROPS = ['windowName', 'windowType', 'parentName', 'loggingOut'];

    function getWindowNameObj() {

        var windowNameObj = null;
        if (window.name) {
            try {
                windowNameObj = JSON.parse(window.name);
            } catch (e) {
                windowNameObj = {};
            }
        } else {
            windowNameObj = {};
        }
        return windowNameObj;
    }

    /**
    * Grabs all session restore properties from the window.name.
    *
    * note: For legacy reasons we retain the 'old' getAllData function, that
    * means window.name filtered by information that are just used for the tab handling
    *
    * @returns {Object}
    *  Return session restore object.
    */
    function getAllData() {
        return _.omit(getWindowNameObj(), TAB_HANDLING_PROPS);
    }

    function setAllData(data) {
        var windowNameObj = getWindowNameObj();
        if (_.isEmpty(data)) {
            window.name = JSON.stringify(_.pick(windowNameObj, TAB_HANDLING_PROPS));
        } else {
            window.name = JSON.stringify(_.extend(_.pick(windowNameObj, TAB_HANDLING_PROPS), data));
        }
    }

    function resetAllData() {
        window.name = JSON.stringify(_.pick(getWindowNameObj(), TAB_HANDLING_PROPS));
    }

    // class SessionRestore ================================================

    /**
     *
     * SessionRestore only restores registered modules on reload.
     * no localstorage is used.
     * on logout registered modules are deleted
     *
     * it works with "window.name" as long as the window is not closed,
     * every entry is kept.
     *
     */
    var SessionRestore = {

        // public static methods -----------------------------------------------------

        /**
         * saves and reads states by assigned id
         *
         * as long as the current tab stay alive, the states stay alive!
         *
         * states can be deleted by assigning undefined
         * states will be deleted automatically when user presses on the logout button
         *
         * @param {String} id unique String
         *  unique string must be still known after reload
         *
         * @param {Object} state (optional)
         *
         *  if state is undefined nothing will be changed, that function only works like a getter.
         *
         *  if state is null all entries to assigned id are deleted.
         *
         *  if state has the entry "module" SessionRestore tries to load that module after a reload.
         *  ox.launch(state.module, state)
         *
         * @returns {Object}
         *  returns old state to assigned id or null if there is was no state before
         *
         */
        state: function (id, state) {
            if (!isActive()) {
                resetAllData();
                return null;
            }

            var allData = getAllData();
            var result = allData[id];

            if (_.isUndefined(state)) {
                //only getter
            } else {
                if (_.isNull(state)) {
                    delete allData[id];
                } else {
                    allData[id] = state;
                }
                setAllData(allData);
            }

            if (_.isUndefined(result)) {
                result = null;
            }

            return result;
        }
    }; // class SessionRestore

    // initialization -----------------------------------------------------

    if (isActive()) {
        require(['io.ox/core/extensions', 'io.ox/core/extPatterns/stage']).done(function (ext, Stage) {
            new Stage('io.ox/core/stages', {
                id: 'documents-session-restore',
                index: 2000,
                run: function () {
                    ext.point('io.ox/core/logout').extend({
                        id: 'sessionrestore',
                        logout: resetAllData
                    });
                }
            });
        });

    }

    // exports ================================================================

    return SessionRestore;
});
