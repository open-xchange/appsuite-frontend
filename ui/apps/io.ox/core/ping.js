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
