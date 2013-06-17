/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2011
 * Mail: info@open-xchange.com
 *
 * @author Viktor Pracht <viktor.pracht@open-xchange.com>
 */

define('io.ox/core/login-i18n', ['gettext!io.ox/core/login'], function (gt) {
    'use strict';
    return gt;
    
    // A list of all strings to be included in the POT file.
    function list() {
        gt('User name');
        gt('Password');
        gt('Sign in');
        gt('Stay signed in');
        gt('Forgot your password?');
        gt('Languages');
        gt('No connection to server. Please check your internet connection ' +
           'and retry.');
        gt('Please enter your credentials.');
        gt('Please enter your password.');
        gt('Your browser version is not supported!');
        gt('Your browser is not supported!');
        //#. %n in the lowest version of Android
        gt('You need to use Android %n or higher.');
        //#. %n is the lowest version of iOS
        gt('You need to use iOS %n or higher.');
        gt('Your operating system is not supported.');
        gt('Please update your browser.');
        gt('For best results, please use ');
        gt('Your browser is slow and outdated!');
        gt('You have been automatically logged out');
        gt('Unsupported Preview - Certain functions disabled and stability ' +
           'not assured until general release later this year');
        gt('Offline mode');
    }
});
