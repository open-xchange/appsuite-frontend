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

define('io.ox/core/count/main', [
    'io.ox/core/count/api',
    'io.ox/core/count/timing',
    'io.ox/core/count/errors',
    'io.ox/core/count/eyeballtime',
    'io.ox/core/count/lifetime',
    'io.ox/core/count/nps',
    'io.ox/core/count/sendmail',
    'io.ox/core/count/appointments'
], function (api) {

    'use strict';

    if (api.disabled) return;

    // track browser and unique visit once on setup
    api.add('browser');
    api.add('device', { platform: api.platform, device: api.device });
    api.add('unique', { id: ox.context_id + '/' + ox.user_id });
});
