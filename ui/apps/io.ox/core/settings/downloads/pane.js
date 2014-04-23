/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/settings/downloads/pane',
    ['io.ox/core/extensions',
     'io.ox/core/capabilities',
     'gettext!io.ox/core',
     'settings!io.ox/core',
     'less!io.ox/core/settings/downloads/style'
    ], function (ext, capabilities, gt, settings) {

    'use strict';

    // please no download on mobile devices or when disabled via setting
    if (_.device('!desktop') || settings.get('settings/downloadsDisabled')) return;

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
                            $('<i class="fa fa-download">'),
                            $.txt(' '),
                            $('<a>', { href: href, target: '_blank' }).addClass('action').text(gt('Download installation file (for Windows)'))
                        ),
                        $('<p>').text(
                            gt('When executing the downloaded file, an installation wizard will be launched. ' +
                            'Follow the instructions and install the updater. ' +
                            'Installs latest versions of Windows® client software. The Updater automatically informs about new updates. ' +
                            'You can download the updates from within the Updater.')
                        )
                    ),
                    $('<section>').append(
                        $('<h2>').text(gt('Connector for Microsoft Outlook®')),
                        $('<p>').text(
                            gt('Synchronization of E-Mails, Calendar, Contacts and Tasks, along with Public, Shared and System Folders to Microsoft Outlook® clients.')
                        )
                    ),
                    $('<section>').append(
                        $('<h2>').text(gt('Notifier')),
                        $('<p>').text(
                            gt('Informs about the current status of E-Mails and appointments without having to display the user interface or another Windows® client.')
                        )
                    ),
                    $('<section>').append(
                        $('<h2>').text(gt('Drive Client')),
                        $('<p>').text(
                            gt('Data synchronization with your local (Windows) machine. Drive Client lets you configure the folders to be synchronized.')
                        )
                    )
                );
            }
        });
    }

    // no download available?
    if (ext.point('io.ox/core/settings/downloads/pane/detail').list().length === 0) return;

    //
    // draw settings pane
    //
    ext.point('io.ox/settings/pane').extend({
        id: 'io.ox/core/downloads',
        index: 'last',
        title: gt('Downloads'),
        pane: 'io.ox/core/settings/downloads/pane',
        advancedMode: true
    });

    ext.point('io.ox/core/settings/downloads/pane').extend({
        draw: function () {
            // headline
            this.addClass('downloads-settings-pane').append(
                $('<h1>').text(gt('Downloads'))
            );
            // draw download items
            ext.point('io.ox/core/settings/downloads/pane/detail').invoke('draw', this);
        }
    });
});
