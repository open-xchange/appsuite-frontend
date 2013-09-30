/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
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