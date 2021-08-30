/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
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

define('io.ox/core/count/eyeballtime', [
    'io.ox/core/count/api',
    'io.ox/core/active'
], function (api, isActive) {

    'use strict';

    if (api.disabled) return;

    var counts = {};

    function count() {
        if (!isActive()) return;
        var app = getCurrentApp();
        if (!app) return;
        // track first "running minute" per app to create a 0-1 minute interval server side.
        if (counts[app] === undefined) send(app);
        // counting seconds
        counts[app] = (counts[app] || 0) + 1;
        // only track full minutes
        if (counts[app] >= 60) {
            send(app);
            counts[app] = 0;
        }
    }

    function getCurrentApp() {
        var app = ox.ui.App.getCurrentFloatingApp() || ox.ui.App.getCurrentApp();
        return app ? app.get('name') : '';
    }

    function send(app) {
        api.add('ebt', { app: app, uuid: api.uuid, t0: ox.t0, d: api.device });
    }

    setInterval(count, 1000);
});
