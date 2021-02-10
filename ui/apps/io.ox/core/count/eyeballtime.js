/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Alexander Quast <alexander.quast@open-xchange.com>
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
