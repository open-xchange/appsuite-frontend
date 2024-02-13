/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
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
        region: '',
        refreshInterval: 5 * 60000,
        design: 'primary',
        autoStart: 'io.ox/mail/main',
        coloredIcons: false,
        autoOpenNotification: true,
        autoLogout: 0,
        showDesktopNotifications: true,
        settings: {
            downloadsDisabled: false
        },
        onboardingWizard: true
    };

});
