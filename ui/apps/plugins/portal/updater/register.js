/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define('plugins/portal/updater/register', [
    'io.ox/core/extensions',
    'gettext!plugins/portal'
], function (ext, gt) {

    'use strict';

    ext.point('io.ox/portal/widget/updater').extend({

        title: gt('Updater'),

        preview: function () {

            var href = ox.apiRoot + '/updater/installer/oxupdater-install.exe?session=' + ox.session;

            this.append(
                $('<div class="content">').append(
                    $('<div class="paragraph text-justify">').text(
                        gt('When executing the downloaded file, an installation wizard will be launched. ' +
                            'Follow the instructions and install the updater. ' +
                            'Installs latest versions of Windows® client software. The Updater automatically informs about new updates. ' +
                            'You can download the updates from within the Updater.')
                    ),
                    $('<div class="paragraph">').append(
                        $('<a>', { href: href, target: '_blank', tabindex: '1', 'role': 'button' }).addClass('action').text(gt('Download'))
                    )
                )
            );
        }
    });

    ext.point('io.ox/portal/widget/updater/settings').extend({
        title: gt('Updater'),
        type: 'updater',
        editable: false,
        unique: true
    });
});
