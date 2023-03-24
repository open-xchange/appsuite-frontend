/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
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

define('io.ox/onboarding/util', [
    'settings!io.ox/onboarding',
    'gettext!io.ox/core/onboarding'
], function (settings, gt) {

    'use strict';

    var productNames = {
        'mail': settings.get('productNames/mail', gt.pgettext('native app', 'OX Mail')),
        'drive': settings.get('productNames/drive', gt.pgettext('native app', 'OX Drive'))
    };

    var titles = {
        'windows': {
            'title': gt('Windows'),
            'mailsync': gt('Mail'),
            'addressbook': gt('Address Book'),
            'calendar': gt('Calendar'),
            'drive': productNames.drive
        },
        'android': {
            'title': gt('Android'),
            'mailsync': gt('Mail'),
            'mailapp': productNames.mail,
            'addressbook': gt('Address Book'),
            'calendar': gt('Calendar'),
            'driveapp': productNames.drive,
            'syncapp': gt('OX Sync App')
        },
        'macos': {
            'title': gt('macOS'),
            'drive': productNames.drive,
            'mailsync': gt('Apple Mail'),
            'calendar': gt('Calendar'),
            'addressbook': gt('Address Book')
        },
        'ios': {
            'title': gt('iOS'),
            'mailsync': gt('iOS Mail'),
            'mailapp': productNames.mail,
            'addressbook': gt('Address Book'),
            'calendar': gt('Calendar'),
            'driveapp': productNames.drive,
            'eassync': gt('EAS')
        }
    };

    var platformList = new Backbone.Collection([
        {
            'title': gt('Windows PC'),
            'icon': 'fa-windows',
            'platform': 'windows'
        },
        {
            'title': gt('Android phone or tablet'),
            'icon': 'fa-android',
            'platform': 'android'
        },
        {
            'title': gt('macOS'),
            'icon': 'fa-apple',
            'platform': 'macos'
        },
        {
            'title': gt('iPhone or iPad'),
            'icon': 'fa-apple',
            'platform': 'ios'
        }
    ]);

    var appList = new Backbone.Collection([
        // Windows
        {
            'title': gt('Mail'),
            'icon': 'fa-envelope-o',
            'app': 'mailsync',
            'platform': 'windows',
            'cap': 'webmail'
        },
        {
            'title': gt('Address Book'),
            'icon': 'fa-users',
            'app': 'addressbook',
            'platform': 'windows',
            'cap': 'carddav'
        },
        {
            'title': gt('Calendar'),
            'icon': 'fa-calendar',
            'app': 'calendar',
            'platform': 'windows',
            'cap': 'caldav'
        },
        {
            'title': productNames.drive,
            'icon': 'fa-cloud',
            'app': 'drive',
            'platform': 'windows',
            'cap': 'infostore drive'
        },
        // Android
        {
            'title': gt('Email with Android Mail'),
            'icon': 'fa-envelope',
            'app': 'mailsync',
            'platform': 'android',
            'cap': 'webmail'
        },
        {
            'title': gt('Address Book'),
            'icon': 'fa-users',
            'app': 'addressbook',
            'platform': 'android',
            'cap': 'carddav'
        },
        {
            'title': gt('Calendar'),
            'icon': 'fa-calendar',
            'app': 'calendar',
            'platform': 'android',
            'cap': 'caldav'
        },
        {
            'title': productNames.drive,
            'icon': 'fa-cloud',
            'app': 'driveapp',
            'platform': 'android',
            'cap': 'drive'
        },
        {
            'title': gt('Exchange Active Sync'),
            'icon': 'fa-users',
            'app': 'eassync',
            'platform': 'android',
            'cap': 'active_sync'
        },
        {
            'title': gt('OX Sync App'),
            'icon': 'fa-users',
            'app': 'syncapp',
            'platform': 'android',
            'cap': 'carddav caldav'
        },
        // macOS
        {
            'title': gt('Email with Apple Mail'),
            'icon': 'fa-envelope',
            'app': 'mailsync',
            'platform': 'macos',
            'cap': 'webmail'
        },
        {
            'title': gt('Address Book'),
            'icon': 'fa-users',
            'app': 'addressbook',
            'platform': 'macos',
            'cap': 'carddav'
        },
        {
            'title': gt('Calendar'),
            'icon': 'fa-calendar',
            'app': 'calendar',
            'platform': 'macos',
            'cap': 'caldav'
        },
        {
            'title': productNames.drive,
            'icon': 'fa-cloud',
            'app': 'drive',
            'platform': 'macos',
            'cap': 'drive'
        },
        // iOS
        {
            'title': gt('Email with iOS Mail'),
            'icon': 'fa-envelope',
            'app': 'mailsync',
            'platform': 'ios',
            'cap': 'webmail'
        },
        {
            'title': gt('Address Book'),
            'icon': 'fa-users',
            'app': 'addressbook',
            'platform': 'ios',
            'cap': 'carddav'
        },
        {
            'title': gt('Calendar'),
            'icon': 'fa-calendar',
            'app': 'calendar',
            'platform': 'ios',
            'cap': 'caldav'
        },
        {
            'title': productNames.drive,
            'icon': 'fa-cloud',
            'app': 'driveapp',
            'platform': 'ios',
            'cap': 'drive'
        },
        {
            'title': gt('Exchange Active Sync'),
            'icon': 'fa-users',
            'app': 'eassync',
            'platform': 'ios',
            'cap': 'active_sync'
        }
    ]);

    // hide specific apps by jslob setting
    var appListHidden = settings.get('hidden/apps', ['syncapp']);
    appList.remove(
        appList.filter(function (model) {
            return appListHidden.indexOf(model.get('app')) > -1;
        })
    );

    return {
        titles: titles,
        platformList: platformList,
        appList: appList,
        productNames: productNames
    };
});
