/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/boot/config', [
    'io.ox/core/boot/util',
    'io.ox/core/http',
    'io.ox/core/manifests',
    'io.ox/core/capabilities'
], function (util, http, manifests, capabilities) {

    'use strict';

    function propagate(data) {

        ox.serverConfig = data || {};

        // transform language array (hash keeps insertion order if keys are not array indexes)
        if (_.isArray(ox.serverConfig.languages)) {
            ox.serverConfig.languages = _(ox.serverConfig.languages).object();
        }
        capabilities.reset();
        manifests.reset();

        // now we're sure the server is up
        ox.trigger('server:up');
    }

    function fetch(type) {

        var data;

        // try rampup data
        if (type === 'user' && (data = ox.rampup.serverConfig)) {
            propagate(data);
            return $.when(data);
        }

        util.debug('Load config (' + type + ') ... ');

        // fetch fresh manifests
        return http.GET({
            module: 'apps/manifests',
            params: { action: 'config' },
            appendSession: type === 'user'
        })
        .done(function (data) {
            propagate(data);
            util.debug('Load config (' + type + ') DONE', data);
        });
    }

    return {

        server: function () {
            return fetch('server');
        },

        user: function () {
            return fetch('user');
        }
    };
});
