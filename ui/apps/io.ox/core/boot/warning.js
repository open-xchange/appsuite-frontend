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

define('io.ox/core/boot/warning', [
    'io.ox/core/extensions',
    'gettext!io.ox/core/boot'
], function (ext, gt) {

    'use strict';

    ext.point('io.ox/core/boot/warning').extend({
        id: 'self-xss',
        index: 100,
        draw: function () {
            if (ox.debug) return;
            var warning = gt('Warning!'),
                message = gt('This is a browser feature for developers. If you were asked to copy and paste anything here, somebody might want to take over your account. Do not enter any script code without knowing what it does.');

            if (_.device('!ie')) {
                console.log('%c' + warning, 'font-size: 32px; color: #df0000');
                console.log('%c' + message, 'font-size: 20px;');
            } else {
                console.log('======================================');
                console.log(warning);
                console.log(message);
                console.log('======================================');
            }
        }
    });
});
