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

define('io.ox/onboarding/settings/defaults', ['gettext!io.ox/core/onboarding'], function (gt) {

    var defaultSettings = {
        'caldav': {
            'url': 'https://dav-appsuite-dev.open-xchange.com',
            'login': '123'
        },
        'carddav': {
            'url': 'https://dav-appsuite-dev.open-xchange.com',
            'login': '123'
        },
        'android': {
            'mailapp': {
                'title': gt('OX Mail App'),
                'url': 'https://play.google.com/store/apps/details?id=com.openxchange.mobile.oxmail'
            },
            'driveapp': {
                'title': gt('OX Drive App'),
                'url': 'https://play.google.com/store/apps/details?id=com.openexchange.drive.vanilla'
            },
            'storeIcon': 'apps/themes/icons/default/googleplay/google-play-badge_$country.svg'
        },
        'ios': {
            'mailapp': {
                'title': gt('OX Mail App'),
                'url': 'https://itunes.apple.com/us/app/ox-mail-v2/id1385582725'
            },
            'driveapp': {
                'title': gt('OX Drive App'),
                'url': 'https://itunes.apple.com/de/app/ox-drive/id798570177'
            },
            'storeIcon': 'apps/themes/icons/default/appstore/App_Store_Badge_$country_135x40.svg'
            //'mailsync': { 'url': }
        },
        'macos': {
            'driveapp': {
                'title': gt('OX Drive App'),
                'url': 'https://itunes.apple.com/de/app/ox-drive/id818195014',
                'icon': 'apps/themes/icons/default/apps/mailapp-googleplay.png'
            },
            'storeIcon': 'apps/themes/icons/default/appstore/Mac_App_Store_Badge_$country_165x40.svg'
        },
        'windows': {
            'drive_url': 'https://appsuite-dev.open-xchange.com/appsuite/api/drive/client/windows/install?session=' + ox.session
        }
    };

    return defaultSettings;
});
