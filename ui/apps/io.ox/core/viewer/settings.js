/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Mario Schroeder <mario.schroeder@open-xchange.com>
 */
define('io.ox/core/viewer/settings', [
    'settings!io.ox/core'
], function (CoreViewerSettings) {

    'use strict';

    var Settings = {

        /**
         * Returns the sidebar open state.
         * Mobile devices don't store the state,the result is always 'false'.
         * On desktop the state is stored in the settings and defaulted to 'true'.
         */
        getSidebarOpenState: function () {
            return _.device('desktop') ? CoreViewerSettings.get('viewer/sidebarOpenState', true) : false;
        },

        /**
         * Store the sidebar state on desktop.
         * Mobile devices don't sore the state.
         */
        setSidebarOpenState: function (state) {
            if (_.device('desktop')) {
                CoreViewerSettings.set('viewer/sidebarOpenState', state).save();
            }
        }

    };

    return Settings;
});
