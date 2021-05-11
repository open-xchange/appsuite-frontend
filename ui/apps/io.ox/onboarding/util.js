/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2020 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Maik Schäfer <maik.schaefer@open-xchange.com>
 */

define('io.ox/onboarding/util', [
    'settings!io.ox/onboarding',
    'gettext!io.ox/core/onboarding'
], function (settings, gt) {

    var productNames = {
        'mail': settings.get('productNames/mail', gt.pgettext('native app', 'OX Mail')),
        'drive': settings.get('productNames/drive', gt.pgettext('native app', 'OX Drive'))
    };

    var titles = {
        'windows': {
            'title': gt('Windows'),
            'drive': productNames.drive,
            'mailsync': gt('Mail')
        },
        'android': {
            'title': gt('Android'),
            'mailsync': gt('Mail'),
            'mailapp': productNames.mail,
            'addressbook': gt('Address Book'),
            'calendar': gt('Calendar'),
            'driveapp': productNames.drive
        },
        'macos': {
            'title': gt('MacOS'),
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
            'title': gt('MacOS'),
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
        {
            'title': productNames.drive,
            'icon': 'fa-cloud',
            'app': 'drive',
            'platform': 'windows',
            'cap': 'infostore drive'
        },
        {
            'title': gt('Mail'),
            'icon': 'fa-envelope-o',
            'app': 'mailsync',
            'platform': 'windows',
            'cap': 'webmail'
        },
        {
            'title': gt('Email with Android Mail'),
            'icon': 'fa-envelope',
            'app': 'mailsync',
            'platform': 'android',
            'cap': 'webmail'
        },
        {
            //#. 1$s product name of mail application, e.g. OX Mail
            'title': gt('Email with %1$s', productNames.mail),
            'icon': 'fa-envelope-o',
            'app': 'mailapp',
            'platform': 'android',
            'cap': 'webmail mobile_mail_app'
        },
        {
            'title': gt('Address Book'),
            'icon': 'fa-users',
            'app': 'addressbook',
            'platform': 'android',
            'cap': 'contacts carddav'
        },
        {
            'title': gt('Calendar'),
            'icon': 'fa-calendar',
            'app': 'calendar',
            'platform': 'android',
            'cap': 'calendar caldav'
        },
        {
            'title': productNames.drive,
            'icon': 'fa-cloud',
            'app': 'driveapp',
            'platform': 'android',
            'cap': 'infostore drive'
        },
        {
            'title': gt('Exchange Active Sync'),
            'icon': 'fa-users',
            'app': 'eassync',
            'platform': 'android',
            'cap': 'active_sync'
        },
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
            'cap': 'contacts carddav'
        },
        {
            'title': gt('Calendar'),
            'icon': 'fa-calendar',
            'app': 'calendar',
            'platform': 'macos',
            'cap': 'calendar caldav'
        },
        {
            'title': productNames.drive,
            'icon': 'fa-cloud',
            'app': 'drive',
            'platform': 'macos',
            'cap': 'infostore drive'
        },
        {
            'title': gt('Email with iOS Mail'),
            'icon': 'fa-envelope',
            'app': 'mailsync',
            'platform': 'ios',
            'cap': 'webmail'
        },
        {
            //#. 1$s product name of mail application, e.g. OX Mail
            'title': gt('Email with %1$s', productNames.mail),
            'icon': 'fa-envelope-o',
            'app': 'mailapp',
            'platform': 'ios',
            'cap': 'webmail mobile_mail_app'
        },
        {
            'title': gt('Address Book'),
            'icon': 'fa-users',
            'app': 'addressbook',
            'platform': 'ios',
            'cap': 'contacts carddav'
        },
        {
            'title': gt('Calendar'),
            'icon': 'fa-calendar',
            'app': 'calendar',
            'platform': 'ios',
            'cap': 'calendar caldav'
        },
        {
            'title': productNames.drive,
            'icon': 'fa-cloud',
            'app': 'driveapp',
            'platform': 'ios',
            'cap': 'infostore drive'
        },
        {
            'title': gt('Exchange Active Sync'),
            'icon': 'fa-users',
            'app': 'eassync',
            'platform': 'ios',
            'cap': 'active_sync'
        }
    ]);

    return {
        titles: titles,
        platformList: platformList,
        appList: appList
    };
});
