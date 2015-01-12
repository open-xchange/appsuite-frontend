/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/metrics', [], function () {

    'use strict';

    var that = {

        // get time since t0
        getTime: function () {
            return _.now() - ox.t0;
        },

        // format milliseconds, e.g. 0.75s
        formatTimestamp: function (ms) {
            return (Math.ceil(ms / 100) / 10).toFixed(2) + 's';
        },

        // listen to some demo events and generate console output
        debug: function () {
            ox.on('login core:load core:ready app:start app:ready app:stop', function () {
                var t = that.formatTimestamp(that.getTime());
                console.log('Event', t);
            });
        }
    };

    return that;

});
