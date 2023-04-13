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

define('io.ox/multifactor/login/loginScreen', [
    'settings!io.ox/core',
    'less!io.ox/multifactor/login/style'
], function (settings) {

    'use strict';

    function loadBackground() {
        $('body').append($('<iframe class="multifactorBackground" src="' + ox.serverConfig.multifactorBackground + '">'));
        document.styleSheets[0].insertRule('.modal-backdrop.in { opacity: 0.1 !important; }', 0);
    }

    return {
        create: function () {
            // If configured background, use that instead of toolbar
            if (ox.serverConfig.multifactorBackground) return loadBackground();
            var logoFileName = settings.get('logoFileName', 'logo.png');
            // fake topbar logo (do not use the actual toolbar here -> leads to various errors because code is required to early (no settings set etc.))
            $('#io-ox-appcontrol').append($('<div id="io-ox-top-logo">').append(
                $('<img>').attr({
                    alt: ox.serverConfig.productName,
                    src: ox.base + '/apps/themes/' + ox.theme + '/' + logoFileName
                })
            ));
            require(['io.ox/core/main/designs']);  // Load the users selected colors for the top bar
            $('#io-ox-core, #io-ox-appcontrol').show(); // We need to show the core if hidden
        },
        destroy: function () {
            if (ox.serverConfig.multifactorBackground) {
                $('.multifactorBackground').remove();
                document.styleSheets[0].deleteRule(0);
            }
            $('#io-ox-appcontrol').empty();   // Wipe the temporary bar
        }
    };
});
