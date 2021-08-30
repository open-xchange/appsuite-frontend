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

define('plugins/portal/oxdriveclients/settings/defaults', function () {

    'use strict';

    return {
        linkTo: {
            'Android': 'https://play.google.com/store/apps/details?id=com.openexchange.drive.vanilla',
            'iOS': 'https://itunes.apple.com/us/app/ox-drive/id798570177?l=de&ls=1&mt=8',
            'Mac OS': 'https://itunes.apple.com/us/app/ox-drive/id818195014?l=de&ls=1&mt=12',
            'Windows': '' // drive is not delivered via updater anymore, location is maintained by the onboarding wizard config
        },
        // list all languages for which are localized shop images available. All other will fall back to EN
        // images are located under apps/plugins/portal/oxdriveclients/img
        l10nImages: ['de', 'en', 'es', 'fr', 'it', 'nl'],
        // defaults to OX Drive with our logo
        productName: 'OX Drive',
        // App Icon as 144x144px png in base64 encoding as ready to use CSS url: url(data:image/png;base64data)
        // This might be customized by a backend settings overwriting this default, just in case a custom client will be advertised
        appIconAsBase64: 'url(data:image/png;base64,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)'
    };

});
