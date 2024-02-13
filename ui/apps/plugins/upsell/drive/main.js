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

define('plugins/upsell/drive/main', [
    'io.ox/core/extPatterns/stage',
    'io.ox/core/extensions',
    'settings!plugins/upsell'
], function (Stage, ext, settings) {

    'use strict';

    var adSettings =  settings.get('driveAd'),
        extendDrive;

    if (!adSettings) {
        console.error('The upsell bubbles app does not work without settings for plugins/upsell//driveAd.');
        return;
    }

    extendDrive = function () {
        ext.point('io.ox/files/details').extend({
            id: 'upsellad',
            //after the title, right?
            index: 201,
            draw: function () {
                this.append(
                    $('<div>').html(adSettings)
                );
            }
        });
    };

    new Stage('io.ox/core/stages', {
        id: 'upsellbubbles',
        index: 1002,
        run: function () {
            extendDrive();
            return $.when();
        }
    });

    return {
        extendDrive: extendDrive
    };
});
