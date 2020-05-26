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
            // remove all form elements except buttons
            hideFormElements('.username, .password, .options');
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
                .filter(elements || '.username, .password, .options, .buttons')
                .remove();
        }

        function resetPassword() {
            loadLoginLayout({ altTitle: gt('Reset password'), newPassword: true });

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
            loadLoginLayout();

            var loginName = _.url.hash('login_name');
            $('.row.username').hide();
            if (!_.isEmpty(loginName)) {
                $('#io-ox-login-restoremail, #io-ox-login-username').val(loginName).prop('readonly', true);
            }
            $('#io-ox-forgot-password, #io-ox-backtosignin').find('a').click(function (e) {
                e.preventDefault();
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
            loadLoginLayout();

            $('.row.username').hide();
            $('#io-ox-forgot-password').remove();
        }

        function defaultLogin() {
            loadLoginLayout();

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
                $('#io-ox-login-username').attr('placeholder', gt('Username'));
                $('#io-ox-login-password').attr('placeholder', gt('Password'));
            }
            $('#io-ox-login-screen').addClass(lc.addClass);

            var toolbar = $('#io-ox-login-toolbar'),
                content = $('#io-ox-login-content'),
                footer = $('#io-ox-login-footer'),
                $language = $('<span id="io-ox-languages">'),
                toolbarElements = {
                    $logo: $('<img class="login-logo" alt="Logo">').attr('src', lc.logo),
                    $language: $language
                },
                footerElemts = {
                    $privacy: $('<span class="login-privacy-police">').append(
                        $('<a>').attr('href', lc.footer.privacy).attr({ 'data-i18n': 'Privacy Policy' }).text(gt('Privacy Policy'))),
                    $imprint: $('<span class="login-imprint">').append(
                        $('<a>').attr('href', lc.footer.imprint).attr({ 'data-i18n': 'Imprint' }).text(gt('Imprint'))),
                    $copyright: $('<span class="login-copyright">').text((lc.footer.copyright || sc.copyright).replace(/\(c\)/i, '\u00A9').replace(/\$year/, moment().year())),
                    $version: $('<span class="login-version">').text(sc.version)
                };

            // header and toolbar
            $('#io-ox-login-background').css({ background: _.device('smartphone') ? lc.backgroundColor : lc.backgroundImage });
            $('#io-ox-login-header').css({ background: 'linear-gradient(rgba(0,0,0,' + lc.topVignette.transparency + '),rgba(0,0,0,0)' });
            createElementComposition(lc.header.sorting, toolbarElements, toolbar);
            $('#io-ox-login-toolbar *').css({ color: lc.header.textColor });
            if (_.device('smartphone')) toolbar.append($('<div id="login-title-mobile">').text(lc.header.title));

            // teaser and boxposition
            var $teaser = $('<div id="io-ox-login-teaser" class="col-sm-6">').html(lc.teaser);
            if (lc.loginBox === 'left' && !_.device('smartphone')) {
                content.append($teaser);
            } else if (lc.loginBox === 'right' && !_.device('smartphone')) {
                content.prepend($teaser);
            } else if (lc.loginBox) {
                $('#io-ox-login-content').css({ 'justify-content': 'center' });
            }

            // form
            $('#box-form-header')
                .text(lc.header.title)
                .css({ color: lc.form.header.textColor,
                    background: lc.form.header.background });
            $('#box-form-body *').css({ color: lc.form.textColor });
            if (lc.altTitle) $('#login-title').attr({ 'data-i18n': lc.altTitle }).text(lc.altTitle);
            else if (!lc.hideTitle) $('#login-title').attr({ 'data-i18n': 'Sign in' }).text(gt('Sign in'));
            else $('#login-title').remove();
            $('#io-ox-login-box a').css({ color: lc.form.linkColor });
            $('#io-ox-login-button').css({ color: lc.form.button.textColor,
                'background-color': lc.form.button.color,
                'border-color': lc.form.button.color
            }).attr({ 'data-i18n': 'Sign in' }).text(gt('Sign in'));
            if (lc.newPassword) $('#io-ox-login-password').val('');
            $('#io-ox-information-message').html(lc.informationMessage);

            // footer
            footer.css({ background: lc.footer.color });
            createElementComposition(lc.footer.sorting, footerElemts, footer);
            $('#io-ox-login-footer *').css({ color: lc.footer.textColor });
            $('#io-ox-login-footer > * a').css({ color: lc.footer.linkColor });
            if (_.device('smartphone')) {
                toolbar.find('#io-ox-languages').remove();
                footer.prepend($language);
            }

            // apply custom css
            $('head').append($('<style type="text/css">').text(util.scopeCustomCss(lc.customCss, '#io-ox-login-screen')));
        }

        function createElementComposition(sorting, elements, target) {
            var $simpleText = $('<div class="io-ox-login-text">'),
                rule = new RegExp('\\$\\w*');

            sorting.split(',').map(function (el) {
                if (el.length === 0) return;

                var $newComposition = $('<div class="composition-element">'),
                    textParts = el.split(rule),
                    match = el.match(rule) ? el.match(rule)[0] : undefined;

                if (match === '$spacer') $newComposition.addClass('login-spacer');
                else {
                    if (textParts[0] !== '') $newComposition.append($simpleText.clone().text(textParts[0]));
                    if (elements[match]) $newComposition.append(elements[match].clone());
                    if (textParts[1] !== '') $newComposition.append($simpleText.clone().text(textParts[1]));
                }

                target.append($newComposition);
            });
        }

        function getLoginConfiguration(options) {
            var lc = $.extend(true, getDefaultLogin(), sc.loginPage, options);
            lc.header.title = lc.header.title || sc.productName;

            return lc;
        }

        function getDefaultLogin() {
            return {
                'backgroundImage': 'radial-gradient(at 33% 50%, #3b6aad, #1f3f6b)',
                'backgroundColor': 'radial-gradient(at 33% 50%, #3b6aad, #1f3f6b)',
                // 'teaser': '<div style="height: 100%; display: flex; justify-content: center; flex-direction: column"><h1 style="text-transform: uppercase; font-family: monospace; text-align: center">lorem ipsum sit dolor',
                'logo': getDefaultLogo(),
                'topVignette': {
                    'transparency': '0.1'
                },
                'header': {
                    'title': 'App Suite',
                    'textColor': '#fffff',
                    'linkColor': '#94c1ec',
                    'sorting': '$logo,$language,$spacer'
                },
                'loginBox': 'center',
                'form': {
                    'textColor': '#333333',
                    'linkColor': '#94c1ec',
                    'header': {
                        'background': '#f5f5f5',
                        'textColor': '#333333'
                    },
                    'button': {
                        'color': '#3662a0',
                        'textColor': '#ffffff'
                    }
                },
                // 'informationMessage': '<div style="text-align: center;">Watch out for phishing mails. For more details see: <a style="color: #ffc800;" href="https://en.wikipedia.org/wiki/Phishing">Wikipedia Phishing</a></div>',
                'footer': {
                    'sorting': '$spacer,$copyright,Version: $version,$privacy,$imprint,$spacer',
                    'privacy': 'https://www.open-xchange.com/privacy/',
                    'imprint': 'https://www.open-xchange.com/legal/',
                    'copyright': '(c) $year OX Software GmbH',
                    'color': 'rgba(0, 0, 0, 0.15)',
                    'textColor': '#ffffff',
                    'linkColor': '#94c1ec'
                }
                // 'customCss': '#login-title { text-transform: uppercase; }'
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


        $('#io-ox-login-feedback');

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
        $('#io-ox-languages *:not([role="menuitem"])').css('color', lc.header.textColor);
        $('#io-ox-languages * > a:not([role="menuitem"]),#language-select,.toggle-text,.caret').css('color', lc.header.linkColor);

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
