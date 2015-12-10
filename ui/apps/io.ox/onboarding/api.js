/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/onboarding/api', [
    'io.ox/core/http',
    'gettext!io.ox/core/onboarding'
], function (http, gt) {

    'use strict';

    // generate basic API
    var api = {};

    // fixed set of modules for development purposes
    api.meta = function () {
        var MODULES = ['mail', 'contacts', 'calendar', 'drive'];
        return {
            teaser: {
                //#. %1$s is the product name, e.g. OX.
                platform: gt('Take %1$s with you! Stay up-to-date on your favorite devices.', ox.serverConfig.productName),
                device: gt('Which device do you want to configure?'),
                module: gt('Which app do you want to use on your device?'),
                service: gt('What service do you want to use?')
            },

            platforms: [
                {
                    id: 'android',
                    title: 'Android',
                    icon: 'fa-android',
                    devices: ['android-phone', 'android-tablet']
                },
                {
                    id: 'apple',
                    title: 'Apple',
                    icon: 'fa-apple',
                    devices: ['iphone', 'ipad', 'mac']
                },
                {
                    id: 'windows',
                    title: 'Windows',
                    icon: 'fa-windows',
                    devices: ['windows-phone', 'windows-pc']
                }
            ],

            devices: [
                {
                    id: 'android.phone',
                    icon: 'fa-mobile',
                    modules: MODULES,
                    teaser: gt('What to you want to use on your smartphone?'),
                    title: gt('Smartphone')
                },
                {
                    id: 'android.tablet',
                    icon: 'fa-tablet',
                    modules: MODULES,
                    teaser: gt('What do you want to use on your tablet?'),
                    title: gt('Tablet')
                },
                {
                    id: 'apple.iphone',
                    icon: 'fa-mobile',
                    modules: MODULES,
                    teaser: gt('What do you want to use on your iPhone?'),
                    title: gt('iPhone')
                },
                {
                    id: 'apple.ipad',
                    icon: 'fa-tablet',
                    modules: MODULES,
                    teaser: gt('What do you want to use on your iPad?'),
                    title: gt('iPad')
                },
                {
                    id: 'apple.mac',
                    icon: 'fa-desktop',
                    modules: MODULES,
                    teaser: gt('What do you want to use on your Mac?'),
                    title: gt('Mac')
                },
                {
                    id: 'windows.phone',
                    icon: 'fa-mobile',
                    modules: MODULES,
                    teaser: gt('What do you want to use on your Windows Phone?'),
                    title: gt('Windows Phone')
                },
                {
                    id: 'windows.desktop',
                    icon: 'fa-desktop',
                    modules: MODULES,
                    teaser: gt('What do you want to use on your Windows PC?'),
                    title: gt('Windows PC')
                }
            ],
            modules: [
                {
                    id: 'email',
                    title: gt('EMail'),
                    icon: 'fa-envelope'
                },
                {
                    id: 'contacts',
                    title: gt('Contacts'),
                    icon: 'fa-book'
                },
                {
                    id: 'calendar',
                    title: gt('Calendar'),
                    icon: 'fa-calendar'
                },
                {
                    id: 'drive',
                    title: gt('Files'),
                    icon: 'fa-file'
                }
            ]
        };
    };

    // fixed set of modules for development purposes (current api implementauiin)
    api.config = function () {
        return {
            'platforms': [
                {
                    'id': 'apple',
                    'enabled': true,
                    'title': 'Apple',
                    'description': 'The Apple platform',
                    'icon': null
                },
                {
                    'id': 'android',
                    'enabled': true,
                    'title': 'Android',
                    'description': 'The Android platform',
                    'icon': null
                },
                {
                    'id': 'windows',
                    'enabled': true,
                    'title': 'Windows',
                    'description': 'The Windows platform',
                    'icon': null
                }
            ],
            'devices': [
                {
                    'id': 'apple.mac',
                    'enabled': true,
                    'title': 'Apple Mac',
                    'description': 'The device for an Apple Mac',
                    'icon': null
                },
                {
                    'id': 'apple.ipad',
                    'enabled': true,
                    'title': 'Apple iPad',
                    'description': 'The device for an Apple iPad',
                    'icon': null
                },
                {
                    'id': 'apple.iphone',
                    'enabled': true,
                    'title': 'Apple iPhone',
                    'description': 'The device for an Apple iPhone',
                    'icon': null
                },
                {
                    'id': 'android.tablet',
                    'enabled': true,
                    'title': 'Android tablet',
                    'description': 'The device for an Android/Google tablet',
                    'icon': null
                },
                {
                    'id': 'android.phone',
                    'enabled': true,
                    'title': 'Android phone',
                    'description': 'The device for an Android/Google phone',
                    'icon': null
                },
                {
                    'id': 'windows.desktop',
                    'enabled': true,
                    'title': 'Windows Desktop',
                    'description': 'The device for a Windows Desktop',
                    'icon': null
                }
            ],
            'modules': [
                {
                    'id': 'email',
                    'enabled': true,
                    'title': 'E-Mail',
                    'description': 'The E-Mail module for accessing/synchronizing E-Mails.',
                    'icon': null
                },
                {
                    'id': 'contacts',
                    'enabled': true,
                    'title': 'Kontakte',
                    'description': 'The contacts module for accessing/synchronizing contacts.',
                    'icon': null
                },
                {
                    'id': 'calendar',
                    'enabled': true,
                    'title': 'Kalender',
                    'description': 'The calendar module for accessing/synchronizing events.',
                    'icon': null
                }
            ],
            'selections': [
                {
                    'id': 'apple.ipad/contacts/carddav/download',
                    'enabled': true,
                    'title': null,
                    'description': null,
                    'icon': null,
                    'type': 'download'
                },
                {
                    'id': 'apple.ipad/contacts/carddav/email',
                    'enabled': true,
                    'title': null,
                    'description': null,
                    'icon': null,
                    'type': 'email'
                },
                {
                    'id': 'apple.ipad/contacts/carddav/display',
                    'enabled': true,
                    'title': null,
                    'description': null,
                    'icon': null,
                    'type': 'display'
                },
                {
                    'id': 'apple.iphone/contacts/carddav/download',
                    'enabled': true,
                    'title': null,
                    'description': null,
                    'icon': null,
                    'type': 'download'
                },
                {
                    'id': 'apple.iphone/contacts/carddav/sms',
                    'enabled': true,
                    'title': null,
                    'description': null,
                    'icon': null,
                    'type': 'sms'
                },
                {
                    'id': 'apple.iphone/contacts/carddav/email',
                    'enabled': true,
                    'title': null,
                    'description': null,
                    'icon': null,
                    'type': 'email'
                },
                {
                    'id': 'apple.iphone/contacts/carddav/display',
                    'enabled': true,
                    'title': null,
                    'description': null,
                    'icon': null,
                    'type': 'display'
                },
                {
                    'id': 'apple.mac/contacts/carddav/download',
                    'enabled': true,
                    'title': null,
                    'description': null,
                    'icon': null,
                    'type': 'download'
                },
                {
                    'id': 'apple.mac/contacts/carddav/email',
                    'enabled': true,
                    'title': null,
                    'description': null,
                    'icon': null,
                    'type': 'email'
                },
                {
                    'id': 'apple.mac/contacts/carddav/display',
                    'enabled': true,
                    'title': null,
                    'description': null,
                    'icon': null,
                    'type': 'display'
                },
                {
                    'id': 'apple.ipad/email/imap/download',
                    'enabled': true,
                    'title': null,
                    'description': null,
                    'icon': null,
                    'type': 'download'
                },
                {
                    'id': 'apple.ipad/email/imap/email',
                    'enabled': true,
                    'title': null,
                    'description': null,
                    'icon': null,
                    'type': 'email'
                },
                {
                    'id': 'apple.ipad/email/imap/display',
                    'enabled': true,
                    'title': null,
                    'description': null,
                    'icon': null,
                    'type': 'display'
                },
                {
                    'id': 'apple.iphone/email/imap/download',
                    'enabled': true,
                    'title': null,
                    'description': null,
                    'icon': null,
                    'type': 'download'
                },
                {
                    'id': 'apple.iphone/email/imap/sms',
                    'enabled': true,
                    'title': null,
                    'description': null,
                    'icon': null,
                    'type': 'sms'
                },
                {
                    'id': 'apple.iphone/email/imap/email',
                    'enabled': true,
                    'title': null,
                    'description': null,
                    'icon': null,
                    'type': 'email'
                },
                {
                    'id': 'apple.iphone/email/imap/display',
                    'enabled': true,
                    'title': null,
                    'description': null,
                    'icon': null,
                    'type': 'display'
                },
                {
                    'id': 'apple.mac/email/imap/download',
                    'enabled': true,
                    'title': null,
                    'description': null,
                    'icon': null,
                    'type': 'download'
                },
                {
                    'id': 'apple.mac/email/imap/email',
                    'enabled': true,
                    'title': null,
                    'description': null,
                    'icon': null,
                    'type': 'email'
                },
                {
                    'id': 'apple.mac/email/imap/display',
                    'enabled': true,
                    'title': null,
                    'description': null,
                    'icon': null,
                    'type': 'display'
                },
                {
                    'id': 'android.phone/email/imap/display',
                    'enabled': true,
                    'title': null,
                    'description': null,
                    'icon': null,
                    'type': 'display'
                },
                {
                    'id': 'android.tablet/email/imap/display',
                    'enabled': true,
                    'title': null,
                    'description': null,
                    'icon': null,
                    'type': 'display'
                },
                {
                    'id': 'apple.ipad/calendar/caldav/download',
                    'enabled': true,
                    'title': 'CalDAV profile download',
                    'description': 'Downloads your CalDAV profile',
                    'icon': null,
                    'type': 'download'
                },
                {
                    'id': 'apple.ipad/calendar/caldav/email',
                    'enabled': true,
                    'title': 'CalDAV profile E-Mail',
                    'description': 'Sends an E-Mail containing the CalDAV profile',
                    'icon': null,
                    'type': 'email'
                },
                {
                    'id': 'apple.ipad/calendar/caldav/display',
                    'enabled': true,
                    'title': 'CalDAV profile display',
                    'description': 'Displays the CalDAV settings for manual creation of a CalDAV account',
                    'icon': null,
                    'type': 'display'
                },
                {
                    'id': 'apple.iphone/calendar/caldav/download',
                    'enabled': true,
                    'title': 'CalDAV profile download',
                    'description': 'Downloads your CalDAV profile',
                    'icon': null,
                    'type': 'download'
                },
                {
                    'id': 'apple.iphone/calendar/caldav/sms',
                    'enabled': true,
                    'title': 'CalDAV profile SMS',
                    'description': 'Sends an SMS containing the CalDAV profile',
                    'icon': null,
                    'type': 'sms'
                },
                {
                    'id': 'apple.iphone/calendar/caldav/email',
                    'enabled': true,
                    'title': 'CalDAV profile E-Mail',
                    'description': 'Sends an E-Mail containing the CalDAV profile',
                    'icon': null,
                    'type': 'email'
                },
                {
                    'id': 'apple.iphone/calendar/caldav/display',
                    'enabled': true,
                    'title': 'CalDAV profile display',
                    'description': 'Displays the CalDAV settings for manual creation of a CalDAV account',
                    'icon': null,
                    'type': 'display'
                },
                {
                    'id': 'apple.mac/calendar/caldav/download',
                    'enabled': true,
                    'title': 'CalDAV profile download',
                    'description': 'Downloads your CalDAV profile',
                    'icon': null,
                    'type': 'download'
                },
                {
                    'id': 'apple.mac/calendar/caldav/email',
                    'enabled': true,
                    'title': 'CalDAV profile E-Mail',
                    'description': 'Sends an E-Mail containing the CalDAV profile',
                    'icon': null,
                    'type': 'email'
                },
                {
                    'id': 'apple.mac/calendar/caldav/display',
                    'enabled': true,
                    'title': 'CalDAV profile display',
                    'description': 'Displays the CalDAV settings for manual creation of a CalDAV account',
                    'icon': null,
                    'type': 'display'
                }
            ],
            'services': [
                {
                    'id': 'carddav',
                    'enabled': true,
                    'title': 'CardDAV',
                    'description': 'The CardDAV account for synchronizing contact entries with Open-Xchange Server.',
                    'icon': null
                },
                {
                    'id': 'imap',
                    'enabled': true,
                    'title': null,
                    'description': null,
                    'icon': null
                },
                {
                    'id': 'caldav',
                    'enabled': true,
                    'title': 'CalDAV',
                    'description': 'The CalDAV account for synchronizing calendar entries with Open-Xchange Server.',
                    'icon': null
                }
            ]
        };
    };

    return api;
});
