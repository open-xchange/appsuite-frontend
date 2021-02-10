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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Alexander Quast <alexander.quast@open-xchange.com>
 */

define('io.ox/core/active', [], function () {

    'use strict';

    var active = true, focus = true, counter = 0;

    // check state very second
    setInterval(check, 1000);

    $(window).on('mousemove mousedown keydown mousewheel focus', yes);
    $(document).on('visibilitychange', maybe);
    $(window).on('blur', no);

    function check() {
        counter++;
        active = focus && counter < 60 && document.visibilityState === 'visible';
    }

    // this function is called very often (e.g. mousemove) so it must be very simple
    function yes() {
        counter = 0;
        active = focus = true;
    }

    function maybe() {
        counter = 0;
        check();
    }

    function no() {
        active = focus = false;
    }

    return function isActive() {
        return active;
    };
});
