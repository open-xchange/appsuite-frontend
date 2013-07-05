/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/settings/downloads/pane',
    ['io.ox/core/extensions',
     'io.ox/core/capabilities',
     'gettext!io.ox/core',
     'less!io.ox/core/settings/downloads/style.less'], function (ext, capabilities, gt) {

    'use strict';

    ext.point('io.ox/settings/pane').extend({
        id: 'io.ox/core/downloads',
        index: 'last',
        title: gt('Downloads'),
        pane: 'io.ox/core/settings/downloads/pane'
    });

    ext.point('io.ox/core/settings/downloads/pane').extend({
        draw: function () {

            this.addClass('downloads-settings-pane')
                .append(
                    $('<h1>').text(gt('Downloads'))
                );

            var point = ext.point('io.ox/core/settings/downloads/pane/detail');

            if (point.list().length === 0) {
                this.append(
                    $('<div class="alert alert-info">').text(gt('No downloads available'))
                );
            } else {
                // draw download items
                ext.point('io.ox/core/settings/downloads/pane/detail').invoke('draw', this);
            }
        }
    });

    /*
     * Default download: Updater
     */

    if (capabilities.has('oxupdater')) {
        ext.point('io.ox/core/settings/downloads/pane/detail').extend({
            id: 'updater',
            index: 100,
            draw: function () {

                var href = ox.apiRoot + '/updater/installer/oxupdater-install.exe?session=' + ox.session;

                this.append(
                    $('<section>').append(
                        $('<h2>').text(gt('Updater')),
                        $('<p>').append(
                            $('<i class="icon-download-alt">'),
                            $.txt(' '),
                            $('<a>', { href: href, target: '_blank' }).addClass('action').text(gt('Download install file (for Windows)'))
                        ),
                        $('<p>').text(
                            gt('The updater provides a simple installation wizard. Follow the instructions to install the application. ' +
                            'The updater will inform you of any updates for the Connector for Microsoft Outlook and the Notifier. ' +
                            'You can download the updates from within the updater.')
                        )
                    )
                );
            }
        });
    }
});
