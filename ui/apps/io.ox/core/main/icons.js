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
    'raw!io.ox/core/images/icons.json',
    'settings!io.ox/core'
], function (ext, rawIcons, settings) {

    'use strict';

    var icons = JSON.parse(rawIcons),
        //appList = settings.get('apps/list'),
        iconType = settings.get('iconType', 'svg'),
        loadIcons = settings.get('loadThemeIcons', false);

    function exposeIcons() {
        // just some sugar
        jQuery.fn.extend({
            appendIcon: function (app) {
                return $(this).append(icons[app]);
            }
        });

        ox.ui.appIcons = icons;
    }

    console.log(icons);
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
    });

    ext.point('io.ox/core/appcontrol/launcherIcons').invoke('run');
});
