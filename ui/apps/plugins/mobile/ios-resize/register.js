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

define('plugins/mobile/ios-resize/register', function () {

    'use strict';

    // just do this for iphone with iOS6!
    if (!_.device('small && !standalone && iOS >= 6 && iOS < 7')) return;

    // mattes: once we have precise numbers from ios7 beta, we can unlock this for ios7

    var height = 0;

    function resize() {
        var h = document.documentElement.clientHeight;
        // not changed?
        if (h === height) return;
        // remember
        height = h;
        // is not in landscape fullscreen? if not add height of address bar
        if (h !== 320) h += 60;
        $('body').css({ position: 'relative', minHeight: h + 'px' });
        setTimeout(scrollTo, 0, 0, 1);
    }

    resize();
    $(window).on('resize', _.debounce(resize, 10));
});
