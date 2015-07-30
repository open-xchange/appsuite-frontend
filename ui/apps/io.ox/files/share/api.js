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
        getLink: function (o) {
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
        updateLink: function (o, timestamp) {
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
         * get all shares by share/management API
         * @return { deferred } an array with share data
         */
        allShares: function (module) {
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
         * get all shares by folder and files API
         * @return { deferred } an array with share data
         */
        all: function () {
            return $.when(
                this.allFolderShares(),
                this.allFileShares()
            ).then(function (folder, files) {
                return [].concat(folder[0], files[0]);
            });
        },

        /**
         * get all shares by folder API
         * @return { deferred } an array with share data
         */
        allFolderShares: function () {
            return http.GET({
                module: 'folders',
                params: {
                    action: 'shares',
                    'content_type': 'infostore',
                    tree: 0,
                    all: 0,
                    altNames: true,
                    columns: '1,2,5,300,301,302,305,3060'
                }
            });
        },

        /**
         * get all shares by files API
         * @return { deferred } an array with share data
         */
        allFileShares: function () {
            return http.GET({
                module: 'files',
                params: {
                    action: 'shares',
                    'content_type': 'infostore',
                    tree: 0,
                    all: 0,
                    altNames: true,
                    columns: '1,2,5,20,700,7010'
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
            if (_.isString(shares)) {
                shares = [ shares ];
            }
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
         * @param  { object } o target data
         * @return { deferred } empty data and timestamp
         */
        deleteLink: function (o, timestamp) {
            return http.PUT({
                module: 'share/management',
                params: {
                    action: 'deleteLink',
                    timezone: 'UTC',
                    timestamp: timestamp
                },
                data: o
            });
        },

        /**
         * send invitation related to a link target
         * @param  { object } o target data
         * @return { deferred } empty data and timestamp
         */
        sendLink: function (o) {
            return http.PUT({
                module: 'share/management',
                params: {
                    action: 'sendLink'
                },
                data: o
            });
        }
    };

    Events.extend(api);

    return api;
});
