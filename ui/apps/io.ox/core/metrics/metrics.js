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

define('io.ox/core/metrics/metrics', [], function () {

    'use strict';

    var that = {

        // get time since t0
        getTime: function () {
            return _.now() - ox.t0;
        },

        // format milliseconds, e.g. 0.75s
        formatTimestamp: function (ms) {
            return Number(ms / 1000).toFixed(2) + 's';
        },

        getBrowser: function () {
            var b = _.browser;
            if (b.Chrome) return 'Chrome ' + b.Chrome;
            if (b.Firefox) return 'Firefox' + b.Firefox;
            if (b.Safari) return 'Safari' + b.Safari;
            if (b.IE) return 'IE' + b.IE;
            return 'Unknown';
        },

        // listen to some demo events and generate console output
        debug: function () {
            ox.on('login core:load core:ready app:start app:ready app:resume app:stop', function (data) {
                var t = that.formatTimestamp(that.getTime());
                console.log('Event', t, data);
            });
        }
    };

    return that;

});
