/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Stefan Eckert <stefan.eckert@open-xchange.com>
 */

define('io.ox/core/sessionrestore', [
    'io.ox/core/extensions',
    'settings!io.ox/core'
], function (ext, settings) {

    // private static methods ----------------------------------------------------

    function isActive() {
        try {
            return Boolean(settings.get('autorestoredocuments'));
        } catch (e) {
            if (ox.debug) {
                console.error(e);
            }
            return false;
        }
    }

    function getAllData() {
        var allData = null;
        if (window.name) {
            allData = JSON.parse(window.name);
        } else {
            allData = {};
        }
        return allData;
    }

    function setAllData(data) {
        if (_.isEmpty(data)) {
            window.name = '';
        } else {
            window.name = JSON.stringify(data);
        }
    }

    function resetAllData() {
        window.name = '';
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
        state: function (id, state) {
            if (!isActive()) {
                resetAllData();
                return null;
            }
            //console.warn('state', id, state);

            var allData = getAllData();
            var result = allData[id];

            if (_.isUndefined(state)) {
                //only getter
            } else {
                if (_.isNull(state) || _.isUndefined(state)) {
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

        var lastStates = getAllData();

        _.defer(function () {
            require(['io.ox/core/desktop']).done(function () {
                ext.point('io.ox/core/logout').extend({
                    id: 'sessionrestore',
                    logout: resetAllData
                });

                var allModules = _.uniq(_.pluck(lastStates, 'module'));
                require(allModules).done(function () {
                    _.each(lastStates, function (state) {
                        //console.warn('launch', state);
                        if (state.module) {
                            ox.launch(state.module, state);
                        }
                    });
                });
            });
        });
    }

    // exports ================================================================

    return SessionRestore;
});
