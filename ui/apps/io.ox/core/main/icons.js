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
 * @author Alexander Quast <alexander.quast@open-xchange.com>
 */
define('io.ox/core/main/icons', [
    'io.ox/core/extensions'
    //'raw!io.ox/core/images/icons_rounded.json'
], function (ext) {

    'use strict';

    /**
     * Loading the SVG icons is done here to provide a single
     * point for customizing icons
     */

    var map, icons;

    function exposeIcons() {
        // just some sugar
        jQuery.fn.extend({
            appendIcon: function (id) {
                return $(this).append(icons[id]);
            }
        });

        ox.ui.appIcons = icons;
    }

    // just for customizing purposes
    ext.point('io.ox/core/main/icons').extend({
        id: 'iconmap',
        index: 500,
        run: function () {
            // map icons for double use
            map = {
                'io.ox/mail/compose': 'io.ox/mail',
                'io.ox/contacts/edit': 'io.ox/contacts',
                'io.ox/calendar/edit': 'io.ox/calendar',
                'io.ox/tasks/edit': 'io.ox/tasks'
            };
        }
    });

    // just for customizing purposes
    ext.point('io.ox/core/main/icons').extend({
        id: 'parse',
        index: 1000,
        run: function () {
            // reverted for 7.10
            //icons = JSON.parse(icons);
            // use FA icons for 7.10
            icons = {
                'io.ox/mail': '<i class="fa fa-envelope-o app-icon-mail">',
                'io.ox/calendar': '<i class="fa fa-calendar app-icon-calendar">',
                'io.ox/contacts': '<i class="fa fa-address-book-o app-icon-addressbook">',
                'io.ox/files': '<i class="fa fa-cloud app-icon-drive">',
                'io.ox/portal': '<i class="fa fa-th-large app-icon-portal">',
                'io.ox/tasks': '<i class="fa fa-check-square-o app-icon-tasks">',
                'io.ox/search': '<i class="fa fa-search">',
                'launcher': '<i class="fa fa-th" aria-hidden="true">',
                'fallback': '<i class="fa fa-question">'
            };
            exposeIcons();
        }
    });

    // map child-apps to core apps
    ext.point('io.ox/core/main/icons').extend({
        id: 'mapping',
        index: 2000,
        run: function () {
            var set = {};
            _(map).each(function (value, key) {
                set[key] = icons[value];
            });
            _(ox.ui.appIcons).extend(set);
        }
    });

    ext.point('io.ox/core/main/icons').invoke('run');

    return icons;
});
