/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/boot/form', [

    'io.ox/core/boot/util',
    'io.ox/core/boot/language',
    'io.ox/core/boot/login',
    'io.ox/core/manifests',
    'io.ox/core/capabilities'

], function (util, language, login, manifests, capabilities) {

    'use strict';

    return function () {

        var sc = ox.serverConfig, gt = util.gt;

        util.debug('Show form ...');

        language.render();

        // update header
        $('#io-ox-login-header-prefix').text((sc.pageHeaderPrefix || '\u00A0') + ' ');
        $('#io-ox-login-header-label').text(sc.pageHeader || '\u00A0');

        // update footer
        var footer = sc.copyright ? sc.copyright + ' ' : '';
        footer += sc.version ? 'Version: ' + sc.version + ' ' : '';
        var revision = 'revision' in sc ? sc.revision : ('Rev' + ox.revision);
        footer += revision !== '' ? revision + ' ' : '';
        footer += sc.buildDate ? '(' + sc.buildDate + ')' : '';
        $('#io-ox-copyright').text(footer);

        // hide checkbox?
        if (!capabilities.has('autologin')) {
            $('#io-ox-login-store').remove();
        } else {
            // check/uncheck?
            var box = $('#io-ox-login-store-box'), cookie = _.getCookie('staySignedIn');
            if (cookie !== undefined) {
                box.prop('checked', cookie === 'true');
            } else if ('staySignedIn' in sc) box.prop('checked', !!sc.staySignedIn);
            box.on('change', function () {
                _.setCookie('staySignedIn', $(this).prop('checked'));
            });
        }

        // hide forgot password?
        var forgotPassword = _.url.hash('forgot-password') || sc.forgotPassword;
        if (!forgotPassword) {
            $('#io-ox-forgot-password').remove();
        } else {
            $('#io-ox-forgot-password').find('a').attr('href', forgotPassword);
        }

        // set username input type to text in IE
        if (_.device('IE > 9')) {
            // cannot change type with jQuery's attr()
            $('#io-ox-login-username')[0].type = 'text';
        }

        util.debug('Load "signin" plugins & set default language');

        // make sure we get 'signin' plugins
        manifests.reset();

        return $.when(
            // load extensions
            manifests.manager.loadPluginsFor('signin'),
            // use browser language
            language.setDefaultLanguage()
        )
        .always(function () {

            // autologout message
            if (_.url.hash('autologout')) {
                util.feedback('info', function () {
                    return $.txt(gt('You have been automatically signed out'));
                });
            }

            util.debug('Check browser support');

            // supported browser?
            if (!window.isBrowserSupported()) {

                if (_.device('android')) {
                    // special info for not supported android
                    util.feedback('info', function () {
                        return $.txt(
                            //#. %n in the lowest version of Android
                            gt('You need to use Android %n or higher.',
                                _.browserSupport.Android));
                    });

                } else if (_.device('ios')) {
                    // special info for not supported iOS
                    util.feedback('info', function () {
                        return $.txt(
                            //#. %n is the lowest version of iOS
                            gt('You need to use iOS %n or higher.',
                                _.browserSupport.iOS));
                    });
                } else if (_.browser.Chrome) {
                    // warning about Chrome version
                    util.feedback('info', function () {
                        return $('<b>').text(gt('Your browser version is not supported!'))
                            .add($.txt(_.noI18n('\xa0')))
                            .add($('<div>').text(gt('Please update your browser.')));
                    });

                } else if (_.browser.unknown) {
                    // warning about all unknown browser-platform combinations, might be chrome on iOS
                    util.feedback('info', function () {
                        return $('<b>').text(gt('Your browser is not supported!'))
                            .add($.txt(_.noI18n('\xa0')))
                            //#. Should tell the user that his combination of browser and operating system is not supported
                            .add($('<div>').text(gt('This browser is not supported on your current platform.')));
                    });
                } else {
                    // general warning about browser
                    util.feedback('info', function () {
                        return $('<b>').text(gt('Your browser is not supported!'))
                            .add($.txt(_.noI18n('\xa0')))
                            .add($.txt(gt('For best results, please use ')))
                            .add($('<br><a href="http://www.google.com/chrome" target="_blank">Google Chrome</a>.'));
                    });
                }

            } else if (_.device('android') && !_.browser.chrome) {
                // Offer Chrome to all non-chrome users on android
                util.feedback('info', function () {
                    return $('<b>').text(
                        //#. 'Google Chrome' is a brand and should not be translated
                        gt('For best results we recommend using Google Chrome for Android.'))
                        .add($.txt(_.noI18n('\xa0')))
                        //.# The missing word at the end of the sentence ('Play Store') will be injected later by script
                        .add($.txt(gt('Get the latest version from the ')))
                        .add($('<a href="http://play.google.com/store/apps/details?id=com.android.chrome">Play Store</>'));
                });
            } else {
                // cookie check (else clause because we don't want to show multiple warnings; plus this is an edge case)
                _.setCookie('test', 'cookie');
                if (_.getCookie('test') !== 'cookie') {
                    util.feedback('info', gt('Your browser\'s cookie functionality is disabled. Please turn it on.'));
                }
                _.setCookie('test', null, -1);
            }

            util.debug('Fade in ...');

            $('#background-loader').fadeOut(util.DURATION, function () {
                // show login dialog
                $('#io-ox-login-blocker').on('mousedown', false);
                $('#io-ox-login-form').on('submit', login);
                $('#io-ox-login-username').prop('disabled', false).focus().select();
            });
        });
    };

});
