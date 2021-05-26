/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define('io.ox/core/boot/support', [

    'io.ox/core/boot/util',
    'io.ox/core/extensions'

], function (util, ext) {

    'use strict';

    var gt;

    function checkDeviceSupport() {

        gt = util.gt;

        util.debug('Check device support', _.device());

        if (window.isBrowserSupported() && window.isPlatformSupported()) {
            // handle supported devices
            ext.point('io.ox/core/boot/supported').invoke('draw', null, ext.Baton());
        } else {
            // handle unsupported devices
            ext.point('io.ox/core/boot/unsupported').invoke('draw', null, ext.Baton());
        }
    }

    //
    // UNSUPPORTED devices
    //

    ext.point('io.ox/core/boot/unsupported').extend(
        //
        // Android. General check
        //
        {
            id: 'android',
            index: 100,
            draw: function (baton) {

                // only show this if android version is too low
                if (!_.device('android') || (window.isPlatformSupported() && !window.isBrowserSupported())) return;

                // special info for not supported android
                util.feedback('info', function () {
                    return $('<div data-error="outdated-platform">').text(
                        //#. %n in the lowest version of Android
                        gt('You need to use Android %n or higher.', _.platformSupport.Android)
                    );
                });

                baton.stopPropagation();
            }
        },
        //
        // IOS. General check
        //
        {
            id: 'ios',
            index: 300,
            draw: function (baton) {

                // only show this if ios version is too low
                if (!_.device('ios') || window.isPlatformSupported() && !window.isBrowserSupported()) return;

                // special info for not supported iOS
                util.feedback('info', function () {
                    return $('<div data-error="outdated-platform">').text(
                        //#. %n is the lowest version of iOS
                        gt('You need to use iOS %n or higher.', _.platformSupport.iOS)
                    );
                });

                baton.stopPropagation();
            }
        },
        //
        // Unknown device
        //
        {
            id: 'unknown',
            index: 400,
            draw: function (baton) {

                if (_.device('desktop') || window.isBrowserSupported()) return;

                // warning about all unknown browser-platform combinations, might be chrome on iOS
                util.feedback('info', function () {
                    return $('<b>').text(gt('Your browser is not supported'))
                        .add($.txt('\xa0'))
                        //#. Should tell the user that his combination of browser and operating system is not supported
                        .add($('<div data-error="unkown-combination">').text(gt('This browser is not supported on your current platform.')));
                });

                baton.stopPropagation();
            }
        },
        //
        // unsupported platform
        //
        {
            id: 'unsupported-platform',
            index: 500,
            draw: function (baton) {
                if (!_.device('windowsphone')) return;

                util.feedback('info', function () {
                    return $('<b>').text(gt('Your platform is not supported!'))
                        .add($.txt('\xa0'))
                        //#. Should tell the user that his combination of browser and operating system is not supported
                        .add($('<div data-error="unkown-platform">').text(gt('This platform is currently not supported.')));
                });

                baton.stopPropagation();
            }
        },
        //
        // Desktop browsers. Detailed response.

        {
            id: 'update-required',
            index: 1000000000000,
            draw: function () {

                util.feedback('info', function () {
                    return $('<b>').text(gt('Your browser is not supported'))
                        .add($.txt('\xa0'))
                        .add(
                            $('<div data-error="outdated-browser">').text(
                                gt('Support starts with Chrome %1$d, Firefox %2$d, IE %3$d, and Safari %4$d.',
                                    _.browserSupport.Chrome, _.browserSupport.Firefox, _.browserSupport.IE, _.browserSupport.Safari
                                )
                            )
                        );
                });
            }
        }
    );

    //
    // SUPPORTED devices
    //

    ext.point('io.ox/core/boot/supported').extend(
        //
        // Android. Check for stock browser.
        //
        {
            id: 'android-stock',
            index: 100,
            draw: function (baton) {

                if (_.device('!android || chrome')) return;

                // Offer Chrome to all non-chrome users on android
                util.feedback('info', function () {
                    return $('<b>').text(
                        //#. 'Google Chrome' is a brand and should not be translated
                        gt('For best results we recommend using Google Chrome for Android.')
                    )
                    .add($.txt('\xa0'))
                    //#. The missing word at the end of the sentence ('Play Store') will be injected later by script
                    .add($.txt(gt('Get the latest version from the ')))
                    .add($('<a href="http://play.google.com/store/apps/details?id=com.android.chrome">Play Store</>'));
                });

                baton.stopPropagation();
            }
        },
        //
        // Cookie support
        //
        {
            id: 'cookies',
            index: 1000000000000,
            draw: function () {

                // cookie check (else clause because we don't want to show multiple warnings; plus this is an edge case)
                _.setCookie('test', 'cookie');
                if (_.getCookie('test') !== 'cookie') {
                    util.feedback('info', gt('Your browser\'s cookie functionality is disabled. Please turn it on.'));
                }
                _.setCookie('test', null, -1);
            }
        }
    );

    return checkDeviceSupport;
});
