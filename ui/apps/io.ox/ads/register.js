/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 *
 */
define('io.ox/ads/register', [
    'io.ox/core/extensions',
    'io.ox/core/capabilities'
], function (ext, capabilities) {
    'use strict';

    var config = [];

    ext.point('io.ox/ads').extend({
        id: 'default',
        inject: function (baton) {
            this.append(
                baton.data.inject
            );
        },
        changeModule: function (module, baton) {
            var activeAds = baton.data.config.filter(function moduleFilter(conf) {
                return _.isEmpty(conf.showadinmodules) || _.contains(conf.showadinmodules, module);
            }).filter(function capabilityFilter(conf) {
                return _.isEmpty(conf.capabilities) || capabilities.has(conf.capabilities);
            });

            //TODO: rerender all the ads, only show active ones?
        }
    });

    /**
     * Load Ad configuration from config load
     *
     * @params ad - { inject: function, config: array }
     */
    function loadAdConfig(ad) {
        var baton = ext.Baton.ensure(ad);
        ext.point('io.ox/ads').invoke('inject', $('head'), baton);

        //handle configuration
        ext.point('io.ox/ads').invoke('config', undefined, baton);
        config.push.apply(config, _.compact([].concat(baton.data.config)));
    }

    ox.manifests.loadPluginsFor('io.ox/ads/config').then(function () {
        for (var i = 0; i < arguments.length; i++) {
            loadAdConfig(arguments[i]);
        }
    });

    function changeModule(app) {
        var baton = ext.Baton.ensure({
            app: app,
            config: config
        });
        ext.point('io.ox/ads').invoke('changeModule', undefined, app.get('id'), baton);
    }

    ox.on('app:start', changeModule);

    ox.on('app:resume', changeModule);
});
