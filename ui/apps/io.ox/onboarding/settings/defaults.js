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

define('io.ox/onboarding/settings/defaults', [], function () {

    'use strict';

    var defaultSettings = {
        'android': {
            'mailapp': {
                'url': 'https://play.google.com/store/apps/details?id=com.openxchange.mobile.oxmail',
                'icon': 'apps/themes/icons/default/apps/mailapp-googleplay.png'
            },
            'driveapp': {
                'url': 'https://play.google.com/store/apps/details?id=com.openexchange.drive.vanilla',
                'icon': 'apps/themes/icons/default/apps/Android_Drive_App_Icon.png'
            },
            'syncapp': {
                'url': 'https://play.google.com/store/apps/details?id=com.openexchange.mobile.syncapp.enterprise',
                'icon': 'apps/themes/icons/default/apps/OX_Sync_App_Icon.png'
            },
            'storeIcon': 'apps/themes/icons/default/googleplay/google-play-badge_$country.svg'
        },
        'ios': {
            'mailapp': {
                'url': 'https://itunes.apple.com/us/app/ox-mail-v2/id1385582725',
                'icon': 'apps/themes/icons/default/apps/mailapp-appstore.png'
            },
            'driveapp': {
                'url': 'https://itunes.apple.com/de/app/ox-drive/id798570177',
                'icon': 'apps/themes/icons/default/apps/iOS_Drive_App_Icon.png'
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
