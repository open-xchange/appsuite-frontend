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

define('io.ox/core/main/offline', [
    'io.ox/core/notifications',
    'gettext!io.ox/core'
], function (notifications, gt) {

    //
    // handle online/offline mode
    //
    function showIndicator(text) {
        $('#io-ox-offline').text(text).stop().show().animate({ bottom: '0px' }, 200);
        notifications.yell('screenreader', text);
    }

    function hideIndicator() {
        $('#io-ox-offline').stop().animate({ bottom: '-41px' }, 200, function () { $(this).hide(); });
    }

    ox.on({
        'connection:online': function () {
            hideIndicator();
            ox.online = true;
        },
        'connection:offline': function () {
            showIndicator(gt('Offline'));
            ox.online = false;
        },
        'connection:up': function () {
            if (ox.online) hideIndicator();
        },
        'connection:down': function () {
            if (ox.online) showIndicator(gt('Server unreachable'));
        }
    });

    if (!ox.online) {
        $(window).trigger('offline');
    }
});
