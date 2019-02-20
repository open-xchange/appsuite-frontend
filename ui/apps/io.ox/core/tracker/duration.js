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

define('io.ox/core/tracker/duration', [
    'io.ox/core/tracker/api',
    'io.ox/core/uuids',
    'settings!io.ox/core'
], function (api, uuids, settings) {

    'use strict';

    var trackInterval = settings.get('tracker/eyeballInterval', 1) || 1,
        counts = {},
        uuid = uuids.randomUUID(),
        i, first = true;

    function getApp() {
        return ox.ui.App.getCurrentApp().get('name');
    }

    function send(app) {
        api.add('duration', {
            uuid: uuid,
            app: app,
            timestamp: ox.t0
        });
    }

    function track() {
        if (document.visibilityState === 'hidden' || !ox.ui.App.getCurrentApp()) return;
        var app = getApp();
        // track very first "running minute" to create a 0-1 minute interval server side.
        if (first) {
            send(app);
            first = false;
        }
        // counting seconds
        counts[app] = (!!counts[app]) ? counts[app] + 1 : 1;
        // only track full minutes
        if (counts[app] % (60 * trackInterval) === 0) send(app);
    }

    function getCount() {
        return counts;
    }

    function start() {
        if (i) return i;
        i = setInterval(track, 1000);
        return i;
    }

    function stop() {
        clearInterval(i);
    }

    return {
        start: start,
        stop: stop,
        getCount: getCount
    };
});
