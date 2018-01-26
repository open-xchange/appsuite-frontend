/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/main/refresh', [
    'io.ox/core/session',
    'io.ox/core/http',
    'io.ox/core/extensions',
    'io.ox/core/capabilities',
    'settings!io.ox/core'
], function (session, http, ext, capabilities, settings) {

    var refresh;

    (function () {

        var next = _.now(),
            // only trigger every 10 seconds
            REFRESH_THROTTLE = 10000;

        ext.point('io.ox/core/refresh').extend({
            action: _.throttle(function () {
                if (ox.online && ox.session !== '') {
                    try {
                        // trigger global event
                        ox.trigger('refresh^');
                    } catch (e) {
                        console.error('io.ox/core/refresh:default', e.message, e);
                    }
                }
            }, REFRESH_THROTTLE),
            reset: function () {
                next = _.now() + parseInt(settings.get('refreshInterval', 300000), 10);
            }
        });

        function check() {
            if (_.now() > next) {
                ext.point('io.ox/core/refresh').invoke('action');
                ext.point('io.ox/core/refresh').invoke('reset');
            }
        }

        refresh = function () {
            ext.point('io.ox/core/refresh').invoke('action');
            ext.point('io.ox/core/refresh').invoke('reset');
        };
        settings.on('change:refreshInterval', function () {
            ext.point('io.ox/core/refresh').invoke('reset');
        });

        ext.point('io.ox/core/refresh').invoke('reset');
        // check every 10 seconds
        setInterval(check, 10000);
    }());

    return refresh;
});
