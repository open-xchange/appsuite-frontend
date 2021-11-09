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

define('io.ox/core/boot/i18n', ['io.ox/core/boot/util', 'gettext!io.ox/core/boot'], function (util, gt) {

    'use strict';

    util.gt = gt;

    // A list of all strings to be included in the POT file.
    // eslint-disable-next-line no-unused-vars
    function list() {
        gt('User name');
        gt('Password');
        gt('Reset password');
        gt('Set password');
        gt('Email address');
        gt('Sign in');
        //#. the noun not the verb
        gt.pgettext('word', 'Sign in');
        gt('Stay signed in');
        gt('Forgot your password?');
        gt('Languages');
        gt('Language');
        gt('Language:');
        gt('No connection to server. Please check your internet connection ' +
           'and retry.');
        gt('Please enter your credentials.');
        gt('Please enter your password.');
        gt('Your browser version is not supported');
        gt('Your browser is not supported');
        gt('This browser is not supported on your current platform.');
        //#. %n in the lowest version of Android
        gt('You need to use Android %n or higher.');
        //#. %n is the lowest version of iOS
        gt('You need to use iOS %n or higher.');
        gt('Your platform is not supported');
        gt('This platform is currently not supported.');
        //#. all variables are version strings of the browsers, like 52 in Chrome 52
        gt('Support starts with Chrome %1$d, Firefox %2$d, IE %3$d, and Safari %4$d.');
        //#. 'Google Chrome' is a brand and should not be translated
        gt('For best results we recommend using Google Chrome for Android.');
        //#. The missing word at the end of the sentence ('Play Store') will be injected later by script
        gt('Get the latest version from the ');
        gt('Your operating system is not supported.');
        gt('Your password is expired. Please change your password to continue.');
        gt('Please update your browser.');
        //#. browser recommendation: sentence ends with 'Google Chrome' (wrappend in a clickable link)
        gt('For best results, please use ');
        gt('You have been automatically signed out');
        gt('Unsupported Preview - Certain functions disabled and stability ' +
           'not assured until general release later this year');
        gt('Offline mode');
        gt('Your browser\'s cookie functionality is disabled. Please turn it on.');
        gt('Connection timed out. Please try reloading the page.');
        gt('Something went wrong. Please close this browser tab and try again.');
        gt('Connection error');
        gt('The service is not available right now.');
        gt('Retry');
        gt('Reload');
        gt('Privacy Policy');
        gt('Imprint');
        gt('Confirm new password');
        //#. While or after requesting a new password you can go back to the initial login page
        gt('Back to sign in');
        //#. While requesting a new password on the login page; %1$s will be replaced by the product name e.g. OX App Suite
        gt('Please enter your email address associated with %1$s. You will receive an email that contains a link to reset your password.');
        gt('Next');
        gt('Email address');

    }
});
