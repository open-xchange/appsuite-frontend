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
    'io.ox/core/http',
    'io.ox/core/boot/util',
    'io.ox/core/boot/language',
    'io.ox/core/boot/support',
    'io.ox/core/boot/login/standard',
    'io.ox/core/manifests',
    'io.ox/core/capabilities'

], function (http, util, language, support, login, manifests, capabilities) {

    'use strict';

    /**
     * url params/values (all optional)
     * ================================
     *
     * login_type:      [ 'guest' | 'guest_password' | 'anonymous_password' ]
     * login_name:      [ something ]
     *
     * status:          [ 'reset_password' | 'invalid_request' ]
     *
     * message_type:    [ 'INFO' | 'ERROR' ]
     * message:         [ something ]
     *
     * forgot-password: [ something ]
     * share:           [ something ]
     * confirm:         [ something ]
     * autologout:      [ something ]
     */

    return function () {

        var sc = ox.serverConfig, gt = util.gt,
            bindLogin = true, messageReplacement;

        util.debug('Show form ...');

        function displayMessageOnly() {
            // remove all other inputs
            $('#io-ox-login-form div.row')
                .filter('.username, .password, .options, .buttons')
                .remove();
        }

        function displayContinue() {
            $('#io-ox-login-button').attr({
                'data-i18n': gt('Continue'),
                placeholder: gt('Continue')
            });

            var loginName = _.url.hash('login_name');
            $('.row.username').hide();
            $('.row.password').hide();
            $('#io-ox-forgot-password').hide();
            if (!_.isEmpty(loginName)) {
                $('#io-ox-login-restoremail, #io-ox-login-username').val(loginName).prop('readonly', true);
            }
        }

        function resetPassword() {
            $('#io-ox-login-form').attr({
                action: '/appsuite/api/share/reset/password',
                method: 'post',
                target: '_self'
            }).append(
                $('<input type="hidden" name="share">').val(_.url.hash('share')),
                $('<input type="hidden" name="confirm">').val(_.url.hash('confirm'))
            ).submit(function (e) {
                var pass1 = $.trim($('#io-ox-login-password').val()),
                    pass2 = $.trim($('#io-ox-retype-password').val());
                if (pass1.length === 0 || pass2.length === 0) {
                    e.preventDefault();
                    return util.fail({ error: util.gt('Please enter your new password.'), code: 'UI-0003' }, 'password');
                }
                if (pass1 !== pass2) {
                    e.preventDefault();
                    return util.fail({ error: util.gt('Please enter the same password.'), code: 'UI-0004' }, 'password');
                }
            });
            // remove unused fields
            $('#io-ox-login-form div.row')
                .filter('.username, .options')
                .remove();
            // show retype
            $('#io-ox-login-form div.row.password-retype').show();
            // i18n
            $('#io-ox-login-password').attr({
                'data-i18n': gt('New password'),
                placeholder: gt('New password')
            });
            $('#io-ox-login-button').attr({
                'data-i18n': gt('Set password'),
                placeholder: gt('Set password')
            });
            bindLogin = false;
        }

        function guestLogin() {
            var loginName = _.url.hash('login_name');

            // use more suitable message
            //messageReplacement = gt('Please enter your password.');

            $('.row.username').hide();
            if (!_.isEmpty(loginName)) {
                $('#io-ox-login-restoremail, #io-ox-login-username').val(loginName).prop('readonly', true);
            }
            $('#io-ox-forgot-password, #io-ox-backtosignin').find('a').click(function (e) {
                e.preventDefault();
                $('#io-ox-password-forget-form, #io-ox-login-form').toggle();
            });
            $('#io-ox-password-forget-form').append(
                $('<input type="hidden" name="share">').val(_.url.hash('share'))
            );
        }

        function anonymousLogin() {
            $('.row.username').hide();
            $('#io-ox-forgot-password').remove();
        }

        function defaultLogin() {

            // remove form for sharing
            $('#io-ox-password-forget-form').remove();

            var forgotPassword = _.url.hash('forgot-password') || sc.forgotPassword;
            if (!forgotPassword) {
                // either not configured or guest user
                $('#io-ox-forgot-password').remove();
                $('#io-ox-login-store').toggleClass('col-sm-6 col-sm-12');
            } else {
                $('#io-ox-forgot-password').find('a').attr('href', forgotPassword);
            }
        }

        switch (_.url.hash('login_type')) {

            // show continue screen
            case 'guest':
                displayContinue();
                break;

            // show guest login
            case 'guest_password':
                guestLogin();
                break;

            // show anonymous login
            case 'anonymous_password':
                anonymousLogin();
                break;

            // no login_type
            default:
                switch (_.url.hash('message_type')) {
                    case 'INFO':
                        switch (_.url.hash('status')) {
                            case 'reset_password_info':
                                displayMessageOnly();
                                break;

                            case 'reset_password':
                                resetPassword();
                                break;

                        }
                        break;

                    case 'ERROR':
                        displayMessageOnly();
                        break;

                    default:
                        // at this point we know that a "normal" (i.e. non-guest) login is required
                        // therefore we finally check if a custom login location is set
                        var loginLocation =  ox.serverConfig.loginLocation;
                        if (loginLocation && loginLocation !== 'ui') return util.gotoSignin();
                        defaultLogin();
                        break;
                }
                break;
        }

        $('#io-ox-login-feedback').hide();

        // handle message params
        if (_.url.hash('message') || messageReplacement) {
            var type = (_.url.hash('message_type') || 'info').toLowerCase(),
                message = messageReplacement || _.url.hash('message');
            if (type === 'info') {
                $('#io-ox-login-help').text(message);
            } else {
                util.feedback(type, message);
            }
        }

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
        $('#io-ox-copyright').text(footer.replace(/\(c\)/i, '\u00A9'));

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

        // set username input type to text in IE
        if (_.device('IE > 9')) {
            // cannot change type with jQuery's attr()
            $('#io-ox-login-username')[0].type = 'text';
        }

        // update productname in password reset dialog
        $('#io-ox-password-forget-form .help-block').text(
            //#. %1$s is the product name, e.g. OX App Suite
            gt('Please enter your email address associated with %1$s. You will receive an email that contains a link to reset your password.', sc.productName)
        );

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

            // handle browser support
            support();

            util.debug('Fade in ...');

            $('#background-loader').fadeOut(util.DURATION, function () {
                // show login dialog
                $('#io-ox-login-blocker').on('mousedown', false);
                if (bindLogin) $('#io-ox-login-form').on('submit', login);
                $('#io-ox-login-username').prop('disabled', false);
                // focus password or username
                $($('#io-ox-login-username').is(':hidden') ? '#io-ox-login-password' : '#io-ox-login-username').focus().select();
            });
        });
    };

});
