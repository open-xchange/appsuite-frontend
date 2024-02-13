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

define.async('io.ox/realtime/rt', [
    'io.ox/core/extensions',
    'io.ox/core/capabilities'
], function (ext, caps) {

    'use strict';

    var POINT = ext.point('io.ox/realtime/transport'),
        def = null;

    POINT.extend({
        id: 'polling',
        index: 100,
        enabled: true,
        getModule: function () {
            return require(['io.ox/realtime/polling_transport']);
        }
    });

    POINT.extend({
        id: 'noop',
        // before 'last'
        index: 0,
        enabled: !caps.has('rt'),
        getModule: function () {
            console.error('Backend does not support realtime communication.');
            return require(['io.ox/realtime/noop_transport']);
        }
    });

    ext.point('io.ox/realtime/transport').each(function (transport) {
        if (def || !POINT.isEnabled(transport.id)) return;
        def = transport.getModule();
    });

    return def;
});
