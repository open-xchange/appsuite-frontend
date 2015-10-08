/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/ping', [
    'io.ox/core/http',
    'settings!io.ox/core'
], function (http, settings) {

    'use strict';

    var enabled = settings.get('ping/enabled', false),
        interval = settings.get('ping/interval', 30),
        mode = 'none',
        intervalHandle = null;

    function ping() {
        // don't ping if offline, invalid session, or within first 10 seconds
        if (!ox.session || ox.session === 'unset' || !ox.online || _.device('phantomjs || karma') || (_.now() - ox.t0) < 10000) return;
        http.ping();
    }

    function stopInterval() {
        if (intervalHandle) clearInterval(intervalHandle);
    }

    function normalPing() {
        if (mode === 'normal') {
            return;
        }
        stopInterval();
        mode = 'normal';
        ox.reachable = true;
        ox.trigger('reachableChange');

        if (enabled) {
            ping();
            intervalHandle = setInterval(ping, interval * 1000);
        }
    }

    function hecticPing() {
        if (mode === 'hectic') return;
        stopInterval();
        ox.reachable = false;
        ox.trigger('reachableChange');
        mode = 'hectic';
        ping();
        intervalHandle = setInterval(ping, interval * 200);
    }

    http.on('unreachable', hecticPing);
    http.on('reachable', normalPing);

    normalPing();
});
