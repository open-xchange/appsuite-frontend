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
    'io.ox/core/extensions',
    'raw!io.ox/core/images/icons_rounded.json'
], function (ext, rawIcons) {

    'use strict';

    /**
     * Loading the SVG icons is done here to provide a single
     * point for customizing icons
     */

    var icons,
        // map some icons for double use
        map = {
            'io.ox/mail/compose': 'io.ox/mail',
            'io.ox/contacts/edit': 'io.ox/contacts',
            'io.ox/calendar/edit': 'io.ox/calendar',
            'io.ox/tasks/edit': 'io.ox/tasks'
        };

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
        id: 'load',
        index: 1000,
        run: function () {
            icons = JSON.parse(rawIcons);
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

    /*
    ext.point('io.ox/core/main/icons').extend({
        id: 'load',
        index: 1000,
        run: function () {
            if (!loadIcons) return;
            // load all icons and expose them for later use
            var iconlist = 'default launcher calendar mail contacts files portal tasks presentation text spreadsheet'.split(' '),
                defs = [];

            _(iconlist).each(function (name) {
                defs.push($.ajax({
                    url: ox.base + '/apps/themes/' + ox.theme + '/applauncher/' + name + '.' + iconType,
                    dataType: 'text'
                }).done(function (icon) {
                    icons[name] = icon;
                    window.icons = icons;
                }));
            });

            $.when.apply($, defs).then(function () {
                exposeIcons();
                ox.trigger('applauncher-icons:loaded');
            });
        }
    });*/

    ext.point('io.ox/core/main/icons').invoke('run');

    return icons;
});
