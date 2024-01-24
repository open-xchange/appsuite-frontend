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

define('io.ox/files/actions/move-copy', [
    'io.ox/files/api',
    'io.ox/core/folder/actions/move',
    'io.ox/core/capabilities',
    'settings!io.ox/files'
], function (api, move, capabilities, settings) {

    'use strict';

    return function (list, baton, options) {

        // auto-open folder 10 for guests (see bug 42621)
        if (capabilities.has('guest')) options.open = ['10'];

        move.item({
            api: api,
            button: options.label,
            list: list,
            module: 'infostore',
            root: '9',
            open: options.open,
            fullResponse: options.fullResponse,
            settings: settings,
            success: options.success,
            successCallback: options.successCallback,
            target: baton.target,
            title: options.label,
            type: options.type
        });
    };
});
