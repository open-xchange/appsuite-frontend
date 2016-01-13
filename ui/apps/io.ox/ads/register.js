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
], function () {
    'use strict';

    /**
     * Load Ad configuration from config load
     *
     * @params ad - { inject: function, config: array }
     */
    function loadAdConfig(ad) {
        //inject some code (TODO: may be, rename this API?)
        console.log(ad.inject);

        //handle configuration
        console.log(ad.config);
    }

    ox.manifests.loadPluginsFor('io.ox/ads/config').then(function () {
        new Array(arguments).forEach(loadAdConfig);
    });

    ox.on('app:start', function (app) {
        console.log('start', app.get('name'));
    });

    ox.on('app:resume', function (app) {
        console.log('resume', app.get('name'));
    });
});
