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
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define('io.ox/core/settings/defaults', function () {

    'use strict';

    var defaultLanguage;

    if (!ox.serverConfig || !ox.serverConfig.languages) {
        defaultLanguage = 'en_US';
    } else {
        var keys = Object.keys(ox.serverConfig.languages);
        defaultLanguage = _(keys).contains('en_US') ? 'en_US' : keys[0];
    }
    var cookieLanguage = _.getCookie('language');
    if (cookieLanguage) {
        defaultLanguage = cookieLanguage;
    }

    return {
        language: defaultLanguage,
        refreshInterval: 5 * 60000,
        autoStart: 'io.ox/mail/main',
        autoOpenNotification: 'noEmail',
        autoLogout: 0,
        showDesktopNotifications: true,
        settings: {
            downloadsDisabled: false
        }
    };

});
