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

define('io.ox/core/count/timing', [
    'io.ox/core/count/api',
    'settings!io.ox/core'
], function (api, settings) {

    'use strict';

    if (api.disabled) return;

    if (settings.get('autoStart') === 'io.ox/mail/main') {
        // mail ready and content showing
        ox.once('timing:mail:ready', function (duration) {
            api.add('t/m/ready', { d: duration });
        });
    }

    ox.on('timing:mail:load', function (duration) {
        api.add('t/m/load', { d: duration });
    });

    ox.on('timing:mail:sanitize', function (duration) {
        // sanitizing is fast, we try to measure hundreths
        // duration type is a performance timestamp (window.performance)
        var d = Number(duration.toFixed(0));
        api.add('t/m/sanitize', { d: d });
    });
});
