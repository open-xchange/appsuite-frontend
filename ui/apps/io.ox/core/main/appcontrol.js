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

define('io.ox/core/main/appcontrol', [
    'io.ox/core/extensions',
    'gettext!io.ox/core',
    'settings!io.ox/core'
], function (ext, gt, settings) {

    ext.point('io.ox/core/appcontrol').extend({
        id: 'default',
        draw: function () {

            var sc = ox.serverConfig,
                userOption = settings.get('banner/visible', false),
                globalOption = !!sc.banner;

            if (userOption === false || _.device('!desktop')) return;
            if (globalOption === false && userOption !== true) return;
            $('#io-ox-core').addClass('show-banner');
            $('#io-ox-banner').hide();
            $('#io-ox-appcontrol').show();

            var banner = $('#io-ox-appcontrol');
            var taskbar;

            banner.append(
                $('<div id="io-ox-launcher">').append(
                    $('<button type="button" class="btn btn-link" aria-haspopup="true" aria-expanded="false" aria-label="Navigate to:">').append(
                        $('<i class="fa fa-th" aria-hidden="true">')
                    )
                ),
                $('<div id="io-ox-quicklaunch">').text(' '),
                $('<div id="io-ox-topsearch">').text(' '),
                $('<div id="io-ox-toprightbar">').append(
                    taskbar = $('<ul class="taskbar list-unstyled">')
                )
            );

            // prevent logout action within top-bar drop-down
            ext.point('io.ox/core/topbar/right/dropdown').disable('logout');

            // prevent logo
            ext.point('io.ox/core/topbar/right').disable('logo');

            ext.point('io.ox/core/topbar/right').invoke('draw', taskbar);
        }
    });
});
