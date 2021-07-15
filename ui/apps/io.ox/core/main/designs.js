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
