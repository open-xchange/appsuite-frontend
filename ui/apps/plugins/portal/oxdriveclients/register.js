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
 * @author Alexander Quast <alexander.quast@open-xchange.com>
 */

define('plugins/portal/oxdriveclients/register',
    ['io.ox/core/extensions',
    'gettext!plugins/portal',
    'io.ox/core/capabilities',
    'settings!plugins/portal/oxdriveclients',
    'less!plugins/portal/oxdriveclients/style'
    ], function (ext, gt, capabilities, settings) {

    'use strict';

    function getPlatform() {
        var isAndroid = _.device('android'),
            isIOS = _.device('ios'),
            isMac = _.device('macos'),
            isWindows = _.device('windows');

        if (isWindows) return 'Windows';
        if (isAndroid) return 'Android';
        if (isIOS) return 'iOS';
        if (isMac) return 'Mac OS';
        // .# Will be used as part of another string, forming a sentence like "Download OX Drive for your platform". Platform is meant as operating system like Windows or Mac OS
        return gt('your platform');
    }

    function getAllOtherPlatforms() {
        var isAndroid = _.device('android'),
            isIOS = _.device('ios'),
            isMac = _.device('macos'),
            isWindows = _.device('windows');

        if (isWindows) return ['Android', 'iOS', 'Mac OS'];
        if (isAndroid) return  ['Windows', 'iOS', 'Mac OS'];
        if (isIOS) return ['Mac OS', 'Windows', 'Android'];
        if (isMac) return ['iOS', 'Android', 'Windows'];
        // fallback for others
        return ['Android', 'iOS', 'Mac OS', 'Windows'];
    }

    function getShopLinkWithImage(platform, url) {

        var lang = ox.language.split('_')[0],
            // languages we have custom shop icons for
            langs = settings.get('l10nImages'),
            imagePath = ox.abs + ox.root + '/apps/plugins/portal/oxdriveclients/img/',
            platform = platform.toLowerCase();
        // fallback
        if (_.indexOf(langs, lang) === -1) lang = 'en';

        if (platform.match(/android|ios|mac os/)) {
            if (platform === 'mac os') platform = 'mac_os';
            var $img = $('<div class="oxdrive-shop-image ' + platform +'">')
                .css('background-image', 'url(' + imagePath + lang + '_'  + platform + '.png)');

            return $('<a class="shoplink">').attr({
                href: url,
                target: '_blank'
            }).append($img, $('<span class="sr-only">').text(gt.format(gt('Download the %s client for %s'), settings.get('productName'), platform)));
        } else if (platform === 'windows' && settings.get('standaloneWindowsClient') === true) {
            return [
                $('<i class="fa fa-download">'),
                $.txt(' '),
                $('<a class="shoplink">').attr({
                    href: ox.apiRoot + url + '?session=' + ox.session,
                    target: '_blank'
                }).text(gt.format(gt('Download %s'), settings.get('productName')))
            ];
        } else if (platform === 'windows' && capabilities.has('oxupdater')) {
            return [
                $('<i class="fa fa-download">'),
                $.txt(' '),
                $('<a class="shoplink">').attr({
                    href: ox.apiRoot + url + '?session=' + ox.session,
                    target: '_blank'
                }).text(gt.format(gt('Download %s via the OX Updater'), settings.get('productName')))
            ];
        } else {
            return $();
        }
    }

    function createAppIcon() {
        var icon = settings.get('appIconAsBase64');
        return $('<div class="appicon">').css('background-image', icon && ('url(' + icon + ')'));
    }

    ext.point('io.ox/portal/widget/oxdriveclients').extend({

        //.# Product name will be inserted to adevertise the product. I.e. "Get OX Drive" but meant in terms of gettings a piece of software from a online store
        title: gt.format(gt('Get %s'), settings.get('productName')),

        load: function (baton) {
            var def = $.Deferred();
            // .# String will include a product name and a platform forming a sentence like "Download OX Drive for Windows now."
            baton.message = gt.format(gt('Download %s for %s now'), settings.get('productName'), getPlatform());

            baton.teaser = gt.format(gt('The %s client lets you store and share your photos, files, documents and videos, anytime, ' +
                'anywhere. Access any file you save to %s from all your computers, iPhone, iPad or from within %s itself.'), settings.get('productName'), settings.get('productName'), ox.serverConfig.productName);
            baton.link = settings.get('linkTo/' + getPlatform());

            return def.resolve();
        },

        preview: function (baton) {
            var platform = getPlatform(),
                link = getShopLinkWithImage(platform, settings.get('linkTo/' + platform)),
                icon = settings.get('appIconAsBase64');
            this.append(
                $('<ul class="oxdrive content pointer list-unstyled">').append(
                    $('<li class="first">').append(
                        $('<div class="appicon">').css('background-image', icon && ('url(' + icon + ')'))
                    ),
                    $('<li class="message">').append($('<h4>').text(baton.message)),
                    $('<li class="teaser">').text(baton.teaser),
                    $('<li class="link">').append(link)
                )
            );
        },

        draw: function (baton) {
            var ul, platform = getPlatform(),
                link = getShopLinkWithImage(platform, settings.get('linkTo/' + platform));
            this.append(
                ul = $('<ul class="oxdrive content pointer list-unstyled">').append(
                    $('<li class="first">').append(createAppIcon()),
                    $('<li class="message">').append($('<h3>').text(baton.message)),
                    $('<li class="teaser">').text(baton.teaser),
                    $('<li class="link">').append(link)
                )
            );
            // all other platforms
            // .# Product name will be inserted, i.E. "Ox Drive is also available for other platforms". Platforms is meant as operating system like Windows
            ul.append($('<li>').append($('<h3>').text(gt.format(gt('%s is also available for other platforms:'), settings.get('productName')))));

            _.each(getAllOtherPlatforms(), function (os) {
                ul.append($('<li class="link">').append(getShopLinkWithImage(os, settings.get('linkTo/' + os))));
            });
        }
    });

    ext.point('io.ox/portal/widget/oxdriveclients/settings').extend({
        //.# Product name will be inserted to adevertise the product. I.e. "Get OX Drive" but meant in terms of gettings a piece of software from a online store
        title: gt.format(gt('Get %s'), settings.get('productName')),
        type: 'oxdriveclients',
        editable: false,
        unique: true
    });
});
