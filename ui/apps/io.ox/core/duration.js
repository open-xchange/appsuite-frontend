/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Alexander Quast <alexander.quast@open-xchange.com>
 */

define('io.ox/core/duration', [
    'io.ox/core/tracker',
    'settings!io.ox/core'
], function (tracker, settings) {

    'use strict';
    /*
    we want to track "eyeball time" here and report it to
    our tracker. We want to calculate the real seconds of visible
    UI per App. As soon as the Browser is not visibile anymore
    we stop tracking eyeball time.
    For each full minite of eyeball time we will send a POST to the tracker, aka
    we use the core tracker and call the .add() function with our object like
    {duration: 1, app: 'io.ox/mail/main'}. The tracking will only be done per module, open
    floating windows will not be taken into account.
    We will use visibilitychange event on document and query the value of document.isHidden (true/false)
    which indicates if the browser is hidden (aka, minimized, another tab is open, completely hidden by other windows)
    This does not cover the case that only a part of the browser is not visible.
    */
    // feature toggle
    if (settings.get('tracker/eyeballs', true) === false) return;

    var interval = 1000,
        temp = {},
        counts = {};

    function getApp() {
        return ox.ui.App.getCurrentApp().id;
    }

    function send(app, duration) {
        tracker.add([app, duration]);
    }

    function track() {
        var app = getApp();

        if (document.hidden === false) {
            temp[app] = (!!temp[app]) ? temp[app] + 1 : 1;
        }
        // only track full minutes
        if (temp[app] % 60 === 0) {
            counts[app] = (!!counts[app]) ? counts[app] + 1 : 1;
            send(app, counts[app]);
        }
    }

    window.counts = counts;
    setInterval(track, interval);
});
