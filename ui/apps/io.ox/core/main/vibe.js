/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2018 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/main/vibe', ['settings!io.ox/core'], function (settings) {

    'use strict';

    // doesn't work on IE
    if (_.device('ie <= 11')) return;

    // feature toggle; default: on
    if (!settings.get('features/vibe', true)) return;

    // update now and check time every 5 minutes
    update();
    var tick = setInterval(update, 5 * 60 * 1000);

    // demo/debug access
    $(document).on('dblclick', '#io-ox-appcontrol', function (e) {
        if (!e.altKey) return;
        clearInterval(tick);
        update(24 * e.pageX / $(window).width() >> 0);
    });

    function update(hour) {
        var vibe = getVibe(arguments.length ? hour : moment().hour());
        $('#io-ox-appcontrol').attr('class', vibe);
    }

    function getVibe(h) {
        if (h < 6) return 'night';
        if (h < 10) return 'dawn';
        if (h < 18) return 'day';
        if (h < 22) return 'dusk';
        return 'late';
    }
});
