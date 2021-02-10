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
        'productNames': {
            'mail': gt.pgettext('native app', 'OX Mail'),
            'drive': gt.pgettext('native app', 'OX Drive')
        },
        'android': {
            'mailapp': {
                'url': 'https://play.google.com/store/apps/details?id=com.openxchange.mobile.oxmail'
            },
            'driveapp': {
                'url': 'https://play.google.com/store/apps/details?id=com.openexchange.drive.vanilla'
            },
            'storeIcon': 'apps/themes/icons/default/googleplay/google-play-badge_$country.svg'
        },
        'ios': {
            'mailapp': {
                'url': 'https://itunes.apple.com/us/app/ox-mail-v2/id1385582725'
            },
            'driveapp': {
                'url': 'https://itunes.apple.com/de/app/ox-drive/id798570177'
            },
            'storeIcon': 'apps/themes/icons/default/appstore/App_Store_Badge_$country_135x40.svg'
        },
        'macos': {
            'driveapp': {
                'url': 'https://itunes.apple.com/de/app/ox-drive/id818195014',
                'icon': 'apps/themes/icons/default/apps/iOS_Drive_App_Icon.png'
            },
            'storeIcon': 'apps/themes/icons/default/appstore/Mac_App_Store_Badge_$country_165x40.svg'
        },
        'windows': {
            'driveapp': {
                'url': ox.abs + '/appsuite/api/drive/client/windows/install?session=' + ox.session
            }
        }
    };

    return defaultSettings;
});
