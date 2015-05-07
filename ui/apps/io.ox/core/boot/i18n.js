/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Viktor Pracht <viktor.pracht@open-xchange.com>
 */

define('io.ox/core/boot/i18n', ['io.ox/core/boot/util', 'gettext!io.ox/core/boot'], function (util, gt) {

    'use strict';

    util.gt = gt;

    // A list of all strings to be included in the POT file.
    /* jshint unused: false */
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
        gt('This browser is not supported on your current platform.');
        //#. %n in the lowest version of Android
        gt('You need to use Android %n or higher.');
        //#. %n is the lowest version of iOS
        gt('You need to use iOS %n or higher.');
        gt('Your operating system is not supported.');
        gt('Please update your browser.');
        //#. browser recommendation: sentence ends with 'Google Chrome' (wrappend in a clickable link)
        gt('For best results, please use ');
        gt('You have been automatically signed out');
        gt('Unsupported Preview - Certain functions disabled and stability ' +
           'not assured until general release later this year');
        gt('Offline mode');
        gt('Your browser\'s cookie functionality is disabled. Please turn it on.');
    }
});
