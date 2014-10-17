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

define('io.ox/core/boot/login', [

    'io.ox/core/boot/util',
    'io.ox/core/boot/language',
    'io.ox/core/session'

], function (util, language, session) {

    'use strict';

    return function login(e) {

        // stop unless iOS
        e.preventDefault();

        // get user name / password
        var username = $('#io-ox-login-username').val(),
            password = $('#io-ox-login-password').val(),
            form = $(this);

        // be busy
        $('#io-ox-login-form').css('opacity', 0.5);
        $('#io-ox-login-blocker').show();
        $('#io-ox-login-feedback').busy().empty();

        // user name and password shouldn't be empty
        if ($.trim(username).length === 0) {
            return fail({ error: util.gt('Please enter your credentials.'), code: 'UI-0001' }, 'username');
        }
        if ($.trim(password).length === 0) {
            return fail({ error: util.gt('Please enter your password.'), code: 'UI-0002' }, 'password');
        }

        // login
        session.login(
            username,
            password,
            $('#io-ox-login-store-box').prop('checked'),
            // temporary language for error messages
            language.getCurrentLanguage(),
            // permanent language change!?
            language.getSelectedLanguage()
        )
        .done(function (data) {
            // don't respond to submit any more
            form.off('submit');
            // store credentials
            storeCredentials(form);
            // success
            restore();
            ox.trigger('login:success', data);
        })
        .fail(fail);
    };

    function restore() {
        // stop being busy
        $('#io-ox-login-form').css('opacity', '');
        $('#io-ox-login-blocker').hide();
        $('#io-ox-login-feedback').idle();
    }

    function fail(error, focus) {
        // fail
        $('#io-ox-login-feedback').idle();
        // visual response (shake sucks on touch devices)
        $('#io-ox-login-form').css('opacity', '');
        // show error
        if (error && error.error === '0 general') {
            util.feedback('error', 'No connection to server. Please check your internet connection and retry.');
        } else {
            util.feedback('error', $.txt(_.formatError(error, '%1$s (%2$s)')));
        }
        // restore form
        restore();
        // reset focus
        $('#io-ox-login-' + (_.isString(focus) ? focus : 'username')).focus().select();
        // event
        ox.trigger('login:fail', error);
    }

    // post form into iframe to store username and password
    function storeCredentials(form) {

        var location = window.location.pathname.replace(/[^/]+$/, '') + 'busy.html'; // blank does not work in chrome
        util.debug('Store credentials', location);
        form.find('input[name="location"]').val(location);
        form.attr('target', 'store-credentials').submit();
    }

});
