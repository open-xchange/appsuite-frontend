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

define('plugins/halo/config', function () {

    'use strict';

    return {
        interpret: function (providersConfig, activeProviders) {

            if (!providersConfig) {
                return activeProviders;
            }
            var providers = [];
            var availability = {};
            _(activeProviders).each(function (provider) {
                availability[provider] = true;
            });

            providersConfig = _(providersConfig).map(function (val) {
                return val;
            });

            providersConfig.sort(function (a, b) {
                return a.position - b.position;
            });

            _(providersConfig).each(function (config) {
                if (availability[config.provider] && config.enabled) {
                    providers.push(config.provider);
                }
            });

            return providers;
        }
    };
});
