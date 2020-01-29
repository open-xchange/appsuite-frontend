/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
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

    var userConfigFetched = false;

    function propagate(data, isUser) {
        // Parallel fetch of general config can take longer than
        // the user config.
        if (!isUser && userConfigFetched) return;
        userConfigFetched = isUser;

        ox.serverConfig = data || {};

        // see bug 48361
        if (ox.rampup && ox.rampup.errors && ox.rampup.errors['MSG-0113']) {
            ox.serverConfig.capabilities = _.filter(ox.serverConfig.capabilities, function (cap) {
                return cap.id !== 'webmail';
            });
        }

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
            propagate(data, type === 'user');

            return $.when(data);
        }

        util.debug('Load config (' + type + ') ... ');

        // fetch fresh manifests
        return http.GET({
            module: 'apps/manifests',
            params: { action: 'config', version: ox.version },
            appendSession: type === 'user',
            failOnError: true
        })
        .done(function (data) {
            propagate(data, type === 'user');
            util.debug('Load config (' + type + ') DONE', data);
        });
    }

    return {

        server: _.memoize(function () {
            return fetch('server');
        }),

        user: _.memoize(function () {
            return fetch('user');
        })
    };
});
