/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Stefan Eckert <stefan.eckert@open-xchange.com>
 */

define('io.ox/core/tk/sessionrestore', function () {

    // private static methods ----------------------------------------------------

    function isActive() {
        return true;
    }

    /**
     * Names of properties in the `window.name` object to be processed here.
     */
    var ALL_DATA_PROP_NAMES = ['windowName', 'windowType', 'parentName', 'loggingOut'];

    /**
     * Grabs all sessionrestore options from the window.name
     *
     * @param {Object} [options]
     *  Optional parameters:
     *  @param {Boolean} [options.withoutWindow]
     *      get options without the window object variables
     *
     * @returns {Object} windowName data
     */
    function getAllData(options) {
        if (!_.isObject(options)) { options = {}; }

        var allData = null;
        if (window.name) {
            try {
                allData = JSON.parse(window.name);
            } catch (e) {
                allData = {};
            }
        } else {
            allData = {};
        }
        if (!options.withoutWindow) return allData;
        return _.omit(allData, ALL_DATA_PROP_NAMES);
    }

    function setAllData(data) {
        var allData = getAllData({ withoutWindow: false });
        if (_.isEmpty(data)) {
            window.name = JSON.stringify(_.pick(allData, ALL_DATA_PROP_NAMES));
        } else {
            window.name = JSON.stringify(_.extend(_.pick(allData, ALL_DATA_PROP_NAMES), data));
        }
    }

    function resetAllData() {
        var allData = getAllData({ withoutWindow: false });
        window.name = JSON.stringify(_.pick(allData, ALL_DATA_PROP_NAMES));
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
            //console.warn('state', id, state);

            var allData = getAllData({ withoutWindow: true });
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
        var lastStates = getAllData({ withoutWindow: true });

        require(['io.ox/core/extensions', 'io.ox/core/extPatterns/stage']).done(function (ext, Stage) {
            new Stage('io.ox/core/stages', {
                id: 'documents-session-restore',
                index: 2000,
                run: function () {
                    ext.point('io.ox/core/logout').extend({
                        id: 'sessionrestore',
                        logout: resetAllData
                    });

                    var allModules = _.uniq(_.pluck(lastStates, 'module'));
                    require(allModules).done(function () {
                        var promises = [];
                        _.each(lastStates, function (state) {
                            if (state.module) {
                                promises.push(ox.launch(state.module, state));
                            }
                        });
                        $.when.apply($, promises).done(function () {
                            //workaround for wrong 'active-app' in top bar
                            var currentWindow = ox.ui.App.getCurrentWindow();
                            if (currentWindow) {
                                currentWindow.hide();
                                currentWindow.show();
                            }
                        });
                    });
                }
            });
        });

    }

    // exports ================================================================

    return SessionRestore;
});
