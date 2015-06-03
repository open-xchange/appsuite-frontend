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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 *
 */

define('io.ox/files/share/api', [
    'io.ox/core/http',
    'io.ox/core/event'
], function (http, Events) {

    'use strict';

    var api = {

        /**
         * invite ot share
         * @param  { object } o
         * @return { deferred } returns share
         */
        invite: function (o) {
            return http.PUT({
                module: 'share/management',
                params: {
                    action: 'invite',
                    timezone: 'UTC'
                },
                data: o
            });
        },

        /**
         * get a temporary link and related token
         * @param  { object } o
         * @return { deferred } returns related token
         */
        create: function (o) {
            return http.PUT({
                module: 'share/management',
                params: {
                    action: 'getLink',
                    timezone: 'UTC'
                },
                data: o
            });
        },

        /**
         * update link
         * @param  { object } o
         * @return { deferred } empty data and timestamp
         */
        update: function (o, timestamp) {
            timestamp = timestamp || _.now();
            return http.PUT({
                module: 'share/management',
                params: {
                    action: 'updateLink',
                    timezone: 'UTC',
                    timestamp: timestamp
                },
                data: o
            });
        },

        /**
         * get all shares
         * @return { deferred } an array with share data
         */
        all: function (module) {
            return http.GET({
                module: 'share/management',
                params: {
                    action: 'all',
                    timezone: 'UTC',
                    module: module
                }
            });
        },

        /**
         * get a share
         * @param  { string }   token
         * @return { deferred } a JSON object with share data
         */
        get: function (token) {
            return http.GET({
                module: 'share/management',
                params: {
                    action: 'get',
                    timezone: 'UTC',
                    token: token
                }
            });
        },

        /**
         * delete shares
         * @param  { array }   shares
         * @return { deferred } empty data and timestamp
         */
        remove: function (shares) {
            return http.PUT({
                module: 'share/management',
                params: {
                    action: 'delete'
                },
                data: shares
            });
        },

        /**
         * delete a link
         * @param  { string }   token
         * @return { deferred } empty data and timestamp
         */
        destroy: function (token) {
            return http.GET({
                module: 'share/management',
                params: {
                    action: 'deleteLink',
                    token: token
                }
            });
        }
    };

    Events.extend(api);

    return api;
});
