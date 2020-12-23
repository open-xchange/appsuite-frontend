/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/boot/form', [
    'io.ox/core/http',
    'io.ox/core/boot/util',
    'io.ox/core/boot/locale',
    'io.ox/core/boot/support',
    'io.ox/core/boot/login/standard',
    'io.ox/core/manifests'
], function (http, util, locale, support, login, manifests) {

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

        var sc = ox.serverConfig, gt = util.gt, bindLogin = true;

        util.debug('Show form ...');

        function displayMessageContinue() {
            loadLoginLayout({ hideTitle: true, addClass: 'login-type-message' });
            hideFormElements();
        }

        function displayContinue(data) {
            $('#io-ox-login-button').attr('data-i18n', 'Continue').text(gt('Continue'));
            $('#io-ox-login-restoremail, #io-ox-login-username').val(data.login_name || '').prop('readonly', true);
            $('#io-ox-login-password').val('');
        }

        function displayMessageOnly() {
            loadLoginLayout({ hideTitle: true, addClass: 'login-type-message' });
            hideFormElements();
        }

        function hideFormElements(elements) {
            // remove all other inputs
            $('#io-ox-login-form div.row')
                .filter(elements || '.username, .password, .options, .button')
                .remove();
        }

        function resetPassword() {
            loadLoginLayout({ altTitle: gt('Reset password'), newPassword: true, showAlert: true });

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
            $('#io-ox-login-form div.row.username').remove();
            $('#io-ox-login-store').remove();
            $('#io-ox-forgot-password').remove();
            // show retype
            $('#io-ox-login-form div.row.password-retype').show();
            // i18n
            $('#io-ox-login-password').attr({
                'data-i18n': gt('New password'),
                placeholder: gt('New password')
            });
            $('#io-ox-retype-password').attr({
                'data-i18n': gt('Confirm new password'),
                placeholder: gt('Confirm new password')
            });
            $('#io-ox-login-button').attr({
                'data-i18n': gt('Set password'),
                placeholder: gt('Set password')
            });
            bindLogin = false;
        }

        function guestLogin() {
            loadLoginLayout({ showAlert: true });

            var loginName = _.url.hash('login_name');
            $('.row.username').hide();
            if (!_.isEmpty(loginName)) {
                $('#io-ox-login-restoremail, #io-ox-login-username').val(loginName).prop('readonly', true);
            }
            $('#io-ox-forgot-password, #io-ox-backtosignin').find('a').click(function (e) {
                e.preventDefault();
                $('#io-ox-resetpassword-button').attr({ 'data-i18n': 'Next' }).text(gt('Next'));
                // If restore email is already populated and readOnly, submit the form
                if ($('#io-ox-login-restoremail, #io-ox-login-username').prop('readOnly')) {
                    $('#io-ox-password-forget-form').submit();
                } else {
                    $('#io-ox-password-forget-form, #io-ox-login-form').toggle();
                }
            });
            $('#io-ox-password-forget-form').append(
                $('<input type="hidden" name="share">').val(_.url.hash('share'))
            );
        }

        function anonymousLogin() {
            loadLoginLayout({ showAlert: true });

            $('.row.username').hide();
            $('#io-ox-forgot-password').remove();
        }

        function defaultLogin() {
            loadLoginLayout({ showAlert: true });

            // remove form for sharing
            $('#io-ox-password-forget-form').remove();

            if (!sc.forgotPassword) {
                // either not configured or guest user
                $('#io-ox-forgot-password').remove();
                $('#io-ox-login-store').toggleClass('col-sm-6 col-sm-12');
            } else {
                $('#io-ox-forgot-password').find('a').attr('href', sc.forgotPassword);
            }
        }

        function loadLoginLayout(options) {
            var lc = getLoginConfiguration(options);

            // apply login screen specific classes
            if (_.device('smartphone')) {
                $('#io-ox-login-username').attr({ 'data-i18n-attr': 'placeholder', 'placeholder': gt('Username') });
                $('#io-ox-login-password').attr({ 'data-i18n-attr': 'placeholder', 'placeholder': gt('Password') });
            }
            $('#io-ox-login-screen').addClass(lc.addClass);

            var toolbar = $('#io-ox-login-toolbar'),
                content = $('#io-ox-login-content'),
                footer = $('#io-ox-login-footer');

            var standardNodes = {
                $logo: $('<img class="login-logo" alt="Logo">').attr('src', lc.logo),
                $language: $('<span id="io-ox-languages">'),
                $spacer: $('<div class="composition-element login-spacer">'),
                $privacy: $('<span>').append(
                    $('<a>').attr({ 'target': '_blank', 'href': lc.footer.privacy, 'data-i18n': 'Privacy Policy' }).data('href-translations', getTranslations(lc.footer.$privacy)).text(gt('Privacy Policy'))),
                $imprint: $('<span>').append(
                    $('<a>').attr({ 'target': '_blank', 'href': lc.footer.imprint, 'data-i18n': 'Imprint' }).data('href-translations', getTranslations(lc.footer.$imprint)).text(gt('Imprint'))),
                $copyright: $('<span>').text((lc.footer.copyright || sc.copyright).replace(/\(c\)/g, '\u00A9').replace(/\$year/g, moment().year())),
                $version: $('<span>').text(sc.version)
            };

            function getNodes(bucket) {
                return bucket.sorting.split(',').map(function (str) {
                    if (standardNodes[str]) return standardNodes[str].clone(true, true);
                    return $('<div class="composition-element">').append(
                        str.match(/(\$[a-zA-Z]+|[^$]+)/g).map(function (match) {
                            if (standardNodes[match]) return standardNodes[match].clone(true, true);
                            if (bucket[match]) return $('<span data-i18n>').data('translations', getTranslations(bucket[match]));
                            return $('<span>').text(match);
                        })
                    );
                });
            }

            function getTranslations(o) {
                return _.isObject(o) ? o : { en_US: o };
            }

            // header and toolbar
            toolbar.append(getNodes(lc.header));
            if (_.device('smartphone')) toolbar.append($('<div id="login-title-mobile">').text(lc.header.title));

            // teaser and boxposition
            var teaser = $('<div id="io-ox-login-teaser" class="col-sm-6" data-i18n-attr="html" data-i18n>').data('translations', getTranslations(lc.teaser));
            if (lc.loginBox === 'left' && !_.device('smartphone')) {
                content.append(teaser);
            } else if (lc.loginBox === 'right' && !_.device('smartphone')) {
                content.prepend(teaser);
            }

            // form
            $('#box-form-header').text(lc.header.title).attr({ 'data-i18n': '', 'data-i18n-attr': 'text' }).data('translations', getTranslations(lc.header.title));
            if (lc.altTitle) $('#login-title').attr({ 'data-i18n': lc.altTitle }).text(lc.altTitle);
            else if (!lc.hideTitle) $('#login-title').attr({ 'data-i18n': 'Sign in' }).text(gt('Sign in'));
            else $('#login-title').remove();
            $('#io-ox-login-button').attr({ 'data-i18n': 'Sign in' }).text(gt('Sign in'));
            if (lc.newPassword) $('#io-ox-login-password').val('');
            if (lc.informationMessage) $('#io-ox-information-message').attr({ 'data-i18n': '', 'data-i18n-attr': 'html' }).data('translations', getTranslations(lc.informationMessage));

            // alert info
            if (options.showAlert) $('#io-ox-login-feedback').addClass('alert-highlight');

            // footer
            footer.append(getNodes(lc.footer));
            if (_.device('smartphone')) {
                toolbar.find('#io-ox-languages').remove();
                footer.prepend(standardNodes.$language);
            }

            var configCss = '';

            var background = lc.backgroundColor ? lc.backgroundColor : false;
            if (!_.device('smartphone')) background = (lc.backgroundImage ? lc.backgroundImage : false) || background;
            if (background) configCss += '#io-ox-login-container { background: ' + background + ' } ';

            if (lc.topVignette && lc.topVignette.transparency) configCss += '#io-ox-login-header { background: linear-gradient(rgba(0,0,0,' + lc.topVignette.transparency + '),rgba(0,0,0,0)) } ';

            var h = lc.header;
            if (h) {
                if (h.textColor) configCss += '#io-ox-languages :not([role=menuitem]) { color: ' + h.textColor + '} ';
                if (h.linkColor) configCss += '#io-ox-languages a:not([role="menuitem"]),#language-select,.toggle-text,.caret { color: ' + h.linkColor + '} ';
            }

            var form = lc.form;
            if (form) {
                if (form.header && form.header.textColor) configCss += '#box-form-header, #login-title-mobile { color: ' + form.header.textColor + ' } ';
                if (form.header && form.header.bgColor) configCss += '#box-form-header { background: ' + form.header.bgColor + ' } ';
                if (form.textColor) configCss += '#box-form-body *:not(button) { color: ' + form.textColor + ' } ';
                if (form.linkColor) configCss += '#box-form a { color: ' + form.linkColor + ' } ';
                if (form.button && form.button.bgColor) configCss += '#box-form button, #io-ox-login-button { background-color: ' + form.button.bgColor + '; border-color: ' + form.button.bgColor + ' } ';
                if (form.button && form.button.borderColor) configCss += '#box-form button, #io-ox-login-button { border-color: ' + form.button.borderColor + ' } ';
                if (form.button && form.button.textColor) configCss += '#box-form button, #io-ox-login-button { color: ' + form.button.textColor + ' } ';
            }

            var f = lc.footer;
            if (f) {
                if (f.bgColor) configCss += '#io-ox-login-footer { background: ' + f.bgColor + ' } ';
                if (f.textColor) configCss += '#io-ox-login-footer * { color: ' + f.textColor + ' } ';
                if (f.linkColor) configCss += '#io-ox-login-footer > * a { color: ' + f.linkColor + ' } ';
            }

            if (!lc.loginBox || lc.loginBox === 'center') configCss += '#io-ox-login-content { justify-content: center }';

            //apply styles from server configuration (login page)
            $('head').append($('<style data-src="login-page-configuration" type="text/css">').text(util.scopeCustomCss(configCss, '#io-ox-login-screen')));

            // apply custom css
            $('head').append($('<style data-src="login-page-configuration-custom" type="text/css">').text(util.scopeCustomCss(lc.customCss, '#io-ox-login-screen')));
        }

        function getLoginConfiguration(options) {
            var lc = $.extend(true, getDefaultConfiguration(), sc.loginPage, options);
            lc.header.title = lc.form && lc.form.header && lc.form.header.title || sc.productName;
            lc.logo = lc.logo || getDefaultLogo();
            return lc;
        }

        function getDefaultConfiguration() {
            return {
                'header': {
                    'sorting': '$logo,$language,$spacer'
                },
                'footer': {
                    'sorting': '$spacer,$copyright,Version $version,$privacy,$imprint,$spacer',
                    '$privacy': 'https://www.open-xchange.com/privacy/',
                    '$imprint': 'https://www.open-xchange.com/legal/',
                    'copyright': '(c) $year OX Software GmbH'
                }
            };
        }

        function getDefaultLogo() {
            return 'data:image/svg+xml,%3Csvg width=\'180px\' height=\'64px\' viewBox=\'0 0 180 64\' version=\'1.1\' xmlns=\'http://www.w3.org/2000/svg\' xmlns:xlink=\'http://www.w3.org/1999/xlink\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg id=\'ox_logo_white\' fill=\'%23FFFFFF\' fill-rule=\'nonzero\'%3E%3Cpath d=\'M68.9893238,14.336 L68.9893238,49.664 C68.9893238,50.304 69.2455516,50.944 69.7259786,51.456 C69.2455516,50.976 68.6049822,50.72 67.9323843,50.72 L20.7544484,50.72 C20.113879,50.72 19.4733096,50.976 18.9928826,51.456 C19.4733096,50.976 19.7295374,50.304 19.7295374,49.664 L19.7295374,14.336 C19.7295374,13.696 19.4733096,13.056 18.9928826,12.544 C19.4733096,13.024 20.113879,13.28 20.7544484,13.28 L67.9323843,13.28 C68.5729537,13.28 69.2135231,13.024 69.7259786,12.544 C69.2455516,13.056 68.9893238,13.696 68.9893238,14.336 M88.6868327,45.568 L88.6868327,18.432 C88.6868327,8.256 80.4234875,0 70.2384342,0 L18.4483986,0 C8.2633452,0 0,8.256 0,18.432 L0,45.568 C0,55.744 8.2633452,64 18.4483986,64 L70.2384342,64 C80.4234875,64 88.6868327,55.744 88.6868327,45.568\' id=\'Shape\'%3E%3C/path%3E%3Cpath d=\'M133.046263,43.2 C133.046263,43.936 132.725979,44.608 132.245552,45.056 L114.822064,62.464 C113.893238,63.424 112.6121,64 111.170819,64 L86.1565836,64 L118.729537,31.456 C119.209964,31.008 119.818505,30.72 120.523132,30.72 C119.818505,30.72 119.177936,30.432 118.729537,29.984 L88.7188612,0 L115.846975,0 L132.245552,16.384 C132.758007,16.864 133.046263,17.504 133.046263,18.24 C133.046263,17.504 133.366548,16.832 133.846975,16.384 L150.245552,0 L177.373665,0 L147.330961,29.984 C146.850534,30.432 146.241993,30.72 145.537367,30.72 C146.241993,30.72 146.882562,31.008 147.330961,31.456 L179.935943,64 L154.921708,64 C153.480427,64 152.199288,63.392 151.270463,62.464 L133.846975,45.056 C133.33452,44.608 133.046263,43.936 133.046263,43.2\' id=\'Path\'%3E%3C/path%3E%3C/g%3E%3C/g%3E%3C/svg%3E';
        }

        var loginType = _.url.hash('login_type'), showContinue = false;


        switch (loginType) {

            case 'guest':
            case 'message_continue':
                displayMessageContinue();
                showContinue = true;
                break;

            // show guest login
            case 'guest_password':
                guestLogin();
                break;

            // show anonymous login
            case 'anonymous_password':
                anonymousLogin();
                break;

            case 'reset_password':
                resetPassword();
                break;

            case 'message':
                displayMessageOnly();
                break;

            default:
                // at this point we know that a "normal" (i.e. non-guest) login is required
                // therefore we finally check if a custom login location is set
                var loginLocation = ox.serverConfig.loginLocation;
                if (loginLocation && loginLocation !== 'ui') return util.gotoSignin();
                defaultLogin();
                break;
        }


        var redeem = function (lang) {
            http.GET({
                module: 'share/redeem/token',
                params: { token: _.url.hash('token'), language: lang },
                appendSession: false,
                processResponse: false
            }).done(function (data) {
                if (data.message_type === 'ERROR') {
                    util.feedback('error', data.message);
                } else {
                    $('#io-ox-login-help').text(data.message);
                }
                if (showContinue) displayContinue(data);
            })
            .fail(function (e) {
                util.feedback('error', e.error);
                if (showContinue) hideFormElements();
            });
        };

        // handle message params
        if (_.url.hash('token')) {
            ox.on('language', redeem);
        }

        locale.render();

        // set language select to link color defined by the given configuration
        var lc = getLoginConfiguration();

        // update header
        $('#io-ox-login-header-prefix').text((sc.pageHeaderPrefix || '\u00A0') + ' ').removeAttr('aria-hidden');
        $('#io-ox-login-header-label').text(sc.pageHeader || '\u00A0').removeAttr('aria-hidden');

        // update footer
        var footer = sc.copyright ? sc.copyright + ' ' : '';
        footer += sc.version ? 'Version: ' + sc.version + ' ' : '';
        var revision = 'revision' in sc ? sc.revision : ('Rev' + ox.revision);
        footer += revision !== '' ? revision + ' ' : '';
        footer += sc.buildDate ? '(' + sc.buildDate + ')' : '';
        $('#io-ox-copyright').text(footer.replace(/\(c\)/i, '\u00A9'));

        // check/uncheck?
        var box = $('#io-ox-login-store-box'), cookie = _.getCookie('staySignedIn');
        if (cookie !== undefined) {
            box.prop('checked', cookie === 'true');
        } else if ('staySignedIn' in sc) {
            box.prop('checked', !!sc.staySignedIn);
        }
        box.on('change', function () {
            _.setCookie('staySignedIn', $(this).prop('checked'));
        });

        if (_.device('IE')) {
            // cannot change type with jQuery's attr()
            ($('#io-ox-login-username')[0] || {}).type = 'text';
        }

        // update productname in password reset dialog
        $('#io-ox-password-forget-form .help-block').text(
            //#. %1$s is the product name, e.g. OX App Suite
            gt('Please enter your email address associated with %1$s. You will receive an email that contains a link to reset your password.', lc.header.title)
        );

        util.debug('Set default locale');

        // make sure we get 'signin' plugins
        manifests.reset();

        return $.when(
            manifests.manager.loadPluginsFor('signin'),
            locale.setDefaultLocale()
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

            if ($('#showstopper').is(':visible')) return;

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
