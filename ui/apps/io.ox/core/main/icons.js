/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
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
                console.log('append id', id);
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
                // 'io.ox/mail': '<i class="fa fa-envelope-o app-icon-mail">',
                'io.ox/mail': $.icon('fa-envelope-o'),
                // 'io.ox/calendar': '<i class="fa fa-calendar app-icon-calendar">',
                'io.ox/calendar': $.icon('fa-calendar'),
                //'io.ox/contacts': '<i class="fa fa-address-book-o app-icon-addressbook">',
                'io.ox/contacts': $.icon('fa-address-book-o'),
                // 'io.ox/files': '<i class="fa fa-cloud app-icon-drive">',
                'io.ox/files': $.icon('fa-cloud'),
                //'io.ox/portal': '<i class="fa fa-th-large app-icon-portal">',
                'io.ox/portal': $.icon('fa-th-large'),
                //'io.ox/tasks': '<i class="fa fa-check-square-o app-icon-tasks">',
                'io.ox/tasks': $.icon('fa-check-square-o'),
                //'io.ox/search': '<i class="fa fa-search">',
                'io.ox/search': $.icon('fa-search'),
                //'io.ox/chat': '<i class="fa fa-comment-o app-icon-chat">',
                'io.ox/chat': $.icon('fa-comment-o'),
                //'launcher': '<i class="fa fa-th" aria-hidden="true">',
                'launcher': $.icon('fa-th'),
                //'fallback': '<i class="fa fa-question">'
                'fallback': $.icon('fa-question')
            };
        }
    }, {
        id: 'expose',
        index: 1500,
        run: function () {
            _.extend(icons, this.icons);
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

    ext.point('io.ox/core/main/icons').invoke('run', {});

    return icons;
});
