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

define('plugins/portal/oxdriveclients/register', [
    'io.ox/core/extensions',
    'gettext!plugins/portal',
    'io.ox/core/capabilities',
    'settings!plugins/portal/oxdriveclients',
    'less!plugins/portal/oxdriveclients/style'
], function (ext, gt, capabilities, settings) {

    'use strict';

    var linkTo = settings.get('linkTo', {});
    // workaround, see OXUIB-795
    linkTo['Mac OS'] = linkTo.MacOS || linkTo['Mac OS'];

    // sanitize, see OXUIB-2285
    for (var os in linkTo) {
        if (encodeURI(linkTo[os]) !== linkTo[os]) linkTo[os] = undefined;
    }

    function getPlatform() {
        var isAndroid = _.device('android'),
            isIOS = _.device('ios'),
            isMac = _.device('macos'),
            isWindows = _.device('windows');

        if (isWindows) return 'Windows';
        if (isAndroid) return 'Android';
        if (isIOS) return 'iOS';
        if (isMac) return 'Mac OS';
        //#. Will be used as part of another string, forming a sentence like "Download OX Drive for your platform". Platform is meant as operating system like Windows or Mac OS
        return gt('your platform');
    }

    function getAllOtherPlatforms() {
        var isAndroid = _.device('android'),
            isIOS = _.device('ios'),
            isMac = _.device('macos'),
            isWindows = _.device('windows');

        if (isWindows) return ['Android', 'iOS', 'Mac OS'];
        if (isAndroid) return ['Windows', 'iOS', 'Mac OS'];
        if (isIOS) return ['Mac OS', 'Windows', 'Android'];
        if (isMac) return ['iOS', 'Android', 'Windows'];
        // fallback for others
        return ['Android', 'iOS', 'Mac OS', 'Windows'];
    }

    function getShopLinkWithImage(_platform, url) {

        var lang = ox.language.split('_')[0],
            // languages we have custom shop icons for
            langs = settings.get('l10nImages'),
            imagePath = ox.abs + ox.root + '/apps/plugins/portal/oxdriveclients/img/',
            platform = _platform.toLowerCase();

        // convenience: support string of comma separated values
        langs = _.isString(langs) ? langs.split(',') : langs;
        // fallback
        if (_.indexOf(langs, lang) === -1) lang = 'en';

        if (platform.match(/android|ios|mac os/)) {
            if (platform === 'mac os') platform = 'mac_os';
            var $img = $('<div class="oxdrive-shop-image ' + platform + '">')
                .css('background-image', 'url(' + imagePath + lang + '_' + platform + '.png)');

            return $('<a class="shoplink" target="_blank" rel="noopener">').attr('href', url)
                .append($img, $('<span class="sr-only">').text(
                    //#. Label of download button
                    //#. %1$s is the product name
                    //#. %2$s is the platform
                    //#, c-format
                    gt('Download the %1$s client for %2$s'), settings.get('productName'), platform)
                );
        } else if (platform === 'windows') {
            return [
                $('<i class="fa fa-download" aria-hidden="true">'),
                $.txt(' '),
                $('<a class="shoplink" target="_blank" rel="noopener">').attr('href', ox.apiRoot + url + '?session=' + ox.session).text(
                    //#. Label of download button
                    //#. %s is the product name
                    //#, c-format
                    gt('Download %s', settings.get('productName'))
                )
            ];
        }
        return $();
    }

    function createAppIcon() {
        return $('<div class="appicon" aria-hidden="true">').css('background-image', settings.get('appIconAsBase64'));
    }

    function getText(baton) {
        var ul, platform = getPlatform(),
            link = getShopLinkWithImage(platform, linkTo[platform]);

        // simple fallback for typical wrong configured customer systems (OX Drive for windows)
        if (_.isEmpty(linkTo[platform])) {
            console.warn('OX Drive for windows settings URL not present! Please configure "plugins/portal/oxdriveclients/linkTo/Windows" correctly');
            //#. Points the user to a another place in the UI to download an program file. Variable will be the product name, ie. "OX Drive"
            link = $('<p style="font-weight: bold">').text(gt('Please use the "Connect your device" wizard to download %s', settings.get('productName')));
        }


        ul = $('<ul class="oxdrive content pointer list-unstyled">').append(
            $('<li class="first">').append(createAppIcon()),
            $('<li class="message">').append($('<h3>').text(baton.message)),
            $('<li class="teaser">').text(baton.teaser),
            $('<li class="link">').append(link)
        );

        return ul;
    }

    ext.point('io.ox/portal/widget/oxdriveclients').extend({

        //#. Product name will be inserted to advertise the product. I.e. "Get OX Drive" but meant in terms of gettings a piece of software from a online store
        title: gt('Get %s', settings.get('productName')),

        load: function (baton) {
            var def = $.Deferred();
            //#. String will include a product name and a platform forming a sentence like "Download OX Drive for Windows now."
            //#. %1$s is the product name
            //#. %2$s is the platform
            //#, c-format
            baton.message = gt('Download %1$s for %2$s now', settings.get('productName'), getPlatform());
            //#. %1$s is the product name of the client app
            //#. %2$s is the AppSuite product name
            //#, c-format
            baton.teaser = gt('The %1$s client lets you store and share your photos, files, documents and videos, anytime, ' +
                'anywhere. Access any file you save to %1$s from all your computers, iPhone, iPad or from within %2$s itself.', settings.get('productName'), ox.serverConfig.productName);
            baton.link = linkTo[getPlatform()];

            return def.resolve();
        },

        preview: function (baton) {
            this.append(getText(baton));
        },

        draw: function (baton) {
            var ul = getText(baton);
            this.append(ul);
            // all other platforms
            //#. Product name will be inserted, i.E. "Ox Drive is also available for other platforms". Platforms is meant as operating system like Windows
            ul.append($('<li>').append($('<h3>').text(gt('%s is also available for other platforms:', settings.get('productName')))));

            _.each(getAllOtherPlatforms(), function (os) {
                // use isEmpty here to detect missing settings, null, undefined and emptystring
                if (!_.isEmpty(linkTo[os])) {
                    ul.append($('<li class="link">').append(getShopLinkWithImage(os, linkTo[os])));
                }
            });
        }
    });

    ext.point('io.ox/portal/widget/oxdriveclients/settings').extend({
        //#. Product name will be inserted to adevertise the product. I.e. "Get OX Drive" but meant in terms of gettings a piece of software from a online store
        title: gt('Get %s', settings.get('productName')),
        type: 'oxdriveclients',
        editable: false,
        unique: true
    });
});
