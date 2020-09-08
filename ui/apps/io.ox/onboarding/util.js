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
    'gettext!io.ox/core/onboarding'
], function (gt) {

    var titles = {
        'windows': {
            'title': gt('Windows'),
            'drive': gt('Drive App'),
            'mailsync': gt('Windows Mail'),
            'emclient': gt('EM Client')
        },
        'android': {
            'title': gt('Android'),
            'mailsync': gt('Android Mail'),
            'mailapp': gt('OX Mail App'),
            'addressbook': gt('Contacts'),
            'calendar': gt('Calendar'),
            'driveapp': gt('OX Drive App')
        },
        'macos': {
            'title': gt('MacOS'),
            'drive': gt('Drive App'),
            'mailsync': gt('Apple Mail'),
            'calendar': gt('Calendar'),
            'addressbook': gt('Contacts')
        },
        'ios': {
            'title': gt('iOS'),
            'mailsync': gt('iOS Mail'),
            'mailapp': gt('OX Mail App'),
            'addressbook': gt('Addressbook'),
            'calendar': gt('Calendar'),
            'driveapp': gt('OX Drive App'),
            'eassync': gt('Mail, Calendar and Addressbook')
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
            'title': gt('Drive App'),
            'icon': 'fa-cloud',
            'app': 'drive',
            'platform': 'windows',
            'cap': 'infostore'
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
            'icon': 'fa-cloud',
            'app': 'mailsync',
            'platform': 'android',
            'cap': 'webmail'
        },
        {
            'title': gt('Email with OX Mail App'),
            'icon': 'fa-envelope-o',
            'app': 'mailapp',
            'platform': 'android',
            'cap': 'webmail'
        },
        {
            'title': gt('Contacts'),
            'icon': 'fa-users',
            'app': 'addressbook',
            'platform': 'android',
            'cap': 'contacts'
        },
        {
            'title': gt('Calendar'),
            'icon': 'fa-calendar',
            'app': 'calendar',
            'platform': 'android',
            'cap': 'calendar'
        },
        {
            'title': gt('Drive'),
            'icon': 'fa-cloud',
            'app': 'driveapp',
            'platform': 'android',
            'cap': 'infostore'
        },
        {
            'title': gt('Email with Apple Mail'),
            'icon': 'fa-envelope',
            'app': 'mailsync',
            'platform': 'macos',
            'cap': 'webmail'
        },
        {
            'title': gt('Contacts'),
            'icon': 'fa-users',
            'app': 'addressbook',
            'platform': 'macos',
            'cap': 'contacts'
        },
        {
            'title': gt('Calendar'),
            'icon': 'fa-calendar',
            'app': 'calendar',
            'platform': 'macos',
            'cap': 'calendar'
        },
        {
            'title': gt('Drive'),
            'icon': 'fa-cloud',
            'app': 'drive',
            'platform': 'macos',
            'cap': 'infostore'
        },
        {
            'title': gt('Email with iOS Mail'),
            'icon': 'fa-envelope',
            'app': 'mailsync',
            'platform': 'ios',
            'cap': 'webmail'
        },
        {
            'title': gt('Email with OX Mail App'),
            'icon': 'fa-envelope-o',
            'app': 'mailapp',
            'platform': 'ios',
            'cap': 'webmail'
        },
        {
            'title': gt('Contacts'),
            'icon': 'fa-users',
            'app': 'addressbook',
            'platform': 'ios',
            'cap': 'contacts'
        },
        {
            'title': gt('Calendar'),
            'icon': 'fa-calendar',
            'app': 'calendar',
            'platform': 'ios',
            'cap': 'calendar'
        },
        {
            'title': gt('Drive'),
            'icon': 'fa-cloud',
            'app': 'driveapp',
            'platform': 'ios',
            'cap': 'infostore'
        },
        {
            'title': gt('Mail + Addressbook + Calendar'),
            'icon': 'fa-users',
            'app': 'eassync',
            'platform': 'ios',
            'cap': 'webmail contacts calendar'
        }
    ]);

    return {
        titles: titles,
        platformList: platformList,
        appList: appList
    };
});
