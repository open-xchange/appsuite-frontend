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
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */
define('io.ox/core/api/mailfilter',
    ['io.ox/core/http',
     'io.ox/core/event',
     'io.ox/core/capabilities'
    ], function (http, Events, capabilities) {

    'use strict';

    var api = {

        /**
         * delete rule
         * @param  {string} ruleId
         * @return {deferred}
         */
        deleteRule: function (ruleId) {

            return http.PUT({
                module: 'mailfilter',
                params: {action: 'delete'},
                data: {id: ruleId}
            });
        },

        /**
         * create rule
         * @param  {object} data
         * @return {deferred}
         */
        create: function (data) {

            return http.PUT({
                module: 'mailfilter',
                params: {action: 'new'},
                data: data
            });
        },

        /**
         * get rules
         * @param  {string} flag (filters list)
         * @return {deferred}
         */
        getRules: function (flag) {

            return http.GET({
                module: 'mailfilter',
                params: {
                    action: 'list',
                    flag: flag
                }
            });
        },

        /**
         * update rule
         * @param  {object} data
         * @return {deferred}
         */
        update: function (data) {

            return http.PUT({
                module: 'mailfilter',
                params: {action: 'update'},
                data: data
            });
        },

        /**
         * get config
         * @return {deferred}
         */
        getConfig: function () {
            return http.PUT({
                module: 'mailfilter',
                params: {action: 'config'}
            });
        },

        /**
         * reorder rules
         * @param  {array} data
         * @return {deferred}
         */
        reorder: function (data) {
            return http.PUT({
                module: 'mailfilter',
                params: {action: 'reorder'},
                data: data
            });
        }
    };

    Events.extend(api);

    // global refresh
    api.refresh = function () {
        api.getRules().done(function () {
            // trigger local refresh
            api.trigger('refresh.all');
        });
    };

    /**
     * bind to global refresh; clears caches and trigger refresh.all
     * @fires  api#refresh.all
     * @return {promise}
     */
    if (capabilities.has('mailfilter')) {
        ox.on('refresh^', function () {
            api.refresh();
        });
    }

    return api;
});
