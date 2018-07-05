/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */
define('io.ox/core/api/certificate', [
    'io.ox/core/http',
    'io.ox/core/event'
], function (http, Events) {

    'use strict';


    var api = {

        examine: function (data) {
            return http.GET({
                module: 'certificate',
                params: { action: 'examine', fingerprint: data.fingerprint },
                data: data
            });
        },

        getAll: function () {

            return http.GET({
                module: 'certificate',
                params: { action: 'all' }
            });
        },

        get: function (data) {

            return http.GET({
                module: 'certificate',
                params: { action: 'get', fingerprint: data.fingerprint }

            });
        },

        update: function (data) {
            return http.GET({
                module: 'certificate',
                params: { action: 'update', fingerprint: data.fingerprint, hostname: data.hostname, trust: data.trust }

            });
        },

        remove: function (data) {
            return http.PUT({
                module: 'certificate',
                params: { action: 'delete', fingerprint: data.fingerprint, hostname: data.hostname }

            });
        }

    };

    Events.extend(api);

    return api;
});
