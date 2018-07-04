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

define('io.ox/core/main/designs', ['settings!io.ox/core'], function (settings) {

    'use strict';

    // doesn't work on IE
    if (_.device('ie <= 11')) return;

    // feature toggle; default: on
    if (!settings.get('features/userDesigns', true)) return;

    var tick;

    function setClass(name) {
        var classes = $('html').attr('class').replace(/\s?design-\w+/g, '');
        $('html').attr('class', classes + ' design-' + name);
    }

    function update(hour) {
        var name = getTimeDependentDesign(arguments.length ? hour : moment().hour());
        setClass(name);
    }

    function getTimeDependentDesign(h) {
        if (h < 6) return 'night';
        if (h < 9) return 'twilight';
        if (h < 12) return 'dawn';
        if (h < 18) return 'day';
        if (h < 23) return 'dusk';
        return 'late';
    }

    function startTimeDependentDesign() {
        // update now and check time every 5 minutes
        update();
        var tick = setInterval(update, 5 * 60 * 1000);
        $('html').addClass('time-dependent');
        // demo/debug access
        $(document).on('dblclick', '#io-ox-appcontrol', function (e) {
            if (!e.altKey) return;
            clearInterval(tick);
            update(24 * e.pageX / $(window).width() >> 0);
        });
    }

    function stopTimeDependentDesign() {
        clearInterval(tick);
        $('html').removeClass('time-dependent');
        $(document).off('dblclick', '#io-ox-appcontrol');
    }

    function applyDesign(design) {
        switch (design) {
            // unicolor
            case 'primary':
            // multicolor
            // falls through
            case 'night':
            case 'twilight':
            case 'dawn':
            case 'day':
            case 'dusk':
                setClass(design);
                break;
            // automatic
            case 'time':
                startTimeDependentDesign();
                break;
            default:
                setClass('primary');
        }
    }

    settings.on('change:design', function (design) {
        console.log('change:design');
        // always stop timer to be sure
        stopTimeDependentDesign();
        applyDesign(design);
    });

    applyDesign(settings.get('design'));

});
