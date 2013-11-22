/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
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