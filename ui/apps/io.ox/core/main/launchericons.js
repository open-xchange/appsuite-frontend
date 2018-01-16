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
define('io.ox/core/main/launchericons', [
    'io.ox/core/extensions',
    'settings!io.ox/core'
], function (ext, settings) {

    'use strict';

    var icons = {},
        appList = settings.get('apps/list'),
        iconType = settings.get('iconType', 'svg');

    console.log('asdf', appList);

    ext.point('io.ox/core/appcontrol/launcherIcons').extend({
        id: 'process',
        index: 900,
        run: function () {
            function exposeIcons() {
                jQuery.fn.extend({
                    appIcon: icons
                });
            }
            ox.on('applauncher-icons:loaded', exposeIcons);
        }
    });


    ext.point('io.ox/core/appcontrol/launcherIcons').extend({
        id: 'load',
        index: 1000,
        run: function () {
            // load all icons and expose them for later use
            var apps = 'calendar mail contacts files portal tasks presentation text spreadsheet'.split(' '),
                defs = [];

            _(apps).each(function (name) {
                defs.push($.ajax({
                    url: ox.base + '/apps/themes/' + ox.theme + '/applauncher/' + name + '.' + iconType,
                    dataType: 'text'
                }).done(function (icon) {
                    icons[name] = $(icon);
                    window.icons = icons;
                }));
            });

            $.when.apply($, defs).then(function () {
                ox.trigger('applauncher-icons:loaded');
            });
        }
    });

    ext.point('io.ox/core/appcontrol/launcherIcons').invoke('run');
});
