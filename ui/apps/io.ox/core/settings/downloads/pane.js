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
     'io.ox/core/config',
     'gettext!io.ox/core',
     'settings!io.ox/core',
     'settings!plugins/portal/oxdriveclients',
     'less!io.ox/core/settings/downloads/style',
     'less!plugins/portal/oxdriveclients/style'
    ], function (ext, capabilities, config, gt, settings, driveClientsSettings) {

    'use strict';

    // please no download when disabled via setting
    if (settings.get('settings/downloadsDisabled')) return;

    //available products (ox6 setting)
    var list = ((config.get('modules') || {})['com.openexchange.oxupdater'] || {}).products || [],
        products = {};
    //build products hash
    _.each(list, function (product) {
        var keys = Object.keys(product);
        _.each(keys, function (key) {
            products[key] = product[key];
        });
    });

    /*
     * Default download: Updater
     */
    if (capabilities.has('oxupdater') && driveClientsSettings.get('standaloneWindowsClient') !== true) {
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
                    $('<section>')
                        .addClass(products['com.openexchange.outlook.updater.oxtender2'] ? '' : 'hidden')
                        .append(
                            $('<h2>').text(gt('Connector for Microsoft Outlook®')),
                            $('<p>').text(
                                gt('Synchronization of E-Mails, Calendar, Contacts and Tasks, along with Public, Shared and System Folders to Microsoft Outlook® clients.')
                        )
                    ),
                    $('<section>')
                        .addClass(products['com.openexchange.oxnotifier'] ? '' : 'hidden')
                        .append(
                            $('<h2>').text(gt('Notifier')),
                            $('<p>').text(
                                gt('Informs about the current status of E-Mails and appointments without having to display the user interface or another Windows® client.')
                        )
                    )
                );
            }
        });
    }

    // add OX Drive download links
    if (capabilities.has('drive')) {

        var productName = driveClientsSettings.get('productName'),
            linkTo = driveClientsSettings.get('linkTo');

        var getShopLinkWithImage = function (platform, url) {
            var lang = ox.language.split('_')[0],
                // languages we have custom shop icons for
                langs = driveClientsSettings.get('l10nImages'),
                imagePath = ox.abs + ox.root + '/apps/plugins/portal/oxdriveclients/img/',
                platform = platform.toLowerCase();
            // fallback
            if (_.indexOf(langs, lang) === -1) lang = 'en';

            var $img = $('<div aria-hidden="true" class="oxdrive-shop-image ' + platform +'">')
                .css('background-image', 'url(' + imagePath + lang + '_'  + platform + '.png)');

            return $('<a class="shoplink">').attr({
                        href: url,
                        target: '_blank'
                    }).append($img, $('<span class="sr-only">').text(gt.format(gt('Download the %s client for %s'), productName, platform)));
        };

        ext.point('io.ox/core/settings/downloads/pane/detail').extend({
            id: 'oxdrive',
            index: 200,
            draw: function () {

                // "standalone" takes care of custom branded drive clients that run without the updater
                var standaloneClient = driveClientsSettings.get('standaloneWindowsClient') === true,
                    hasWindowsClient = standaloneClient || products['com.openexchange.updater.drive'],
                    windowsClientUrl = standaloneClient ?
                        linkTo.Windows :
                        ox.apiRoot + '/updater/installer/oxupdater-install.exe?session=' + ox.session,
                    windowsClientLabel = standaloneClient ?
                        //.# String will include the product name, "OX Drive for Windows"
                        gt.format(gt('%s client for Windows'), productName) :
                        //.# String will include the product name, "OX Drive for Windows"
                        gt.format(gt('%s client for Windows (Installation via the OX Updater)'), productName);

                this.append(
                    $('<section class="oxdrive">').append(
                        $('<h2>').text(productName),
                        hasWindowsClient ? $('<div class="shop-link-container">').append(
                            $.txt(windowsClientLabel),
                            $('<br>'),
                            $('<i class="fa fa-download">'),
                            $('<a>', { href: windowsClientUrl, target: '_blank' }).addClass('action').text(gt('Download installation file'))
                        ) : [],
                        $('<div class="shop-link-container">').append(
                            //.# String will include the product name, "OX Drive for Mac OS"
                            gt.format(gt('%s client for Mac OS'), productName),
                            getShopLinkWithImage('mac_os', linkTo['Mac OS'])
                        ),
                        $('<div class="shop-link-container">').append(
                            //.# String will include the product name, "OX Drive for Mac OS"
                            gt.format(gt('%s client for iOS'), productName),
                            getShopLinkWithImage('iOS', linkTo.iOS)
                        ),
                        $('<div class="shop-link-container">').append(
                            //.# String will include the product name, "OX Drive for Mac OS"
                            gt.format(gt('%s client for Android'), productName),
                            getShopLinkWithImage('Android', linkTo.Android)
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
