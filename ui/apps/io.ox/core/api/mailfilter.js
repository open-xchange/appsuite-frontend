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
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */
define('io.ox/core/api/mailfilter', [
    'io.ox/core/http',
    'io.ox/core/event'
], function (http, Events) {

    'use strict';

    var configHash = {},

        api = {

            /**
             * delete rule
             * @param  {string} ruleId
             * @return { deferred }
             */
            deleteRule: function (ruleId) {

                return http.PUT({
                    module: 'mailfilter/v2',
                    params: { action: 'delete' },
                    data: { id: ruleId }
                });
            },

            /**
             * create rule
             * @param  {object} data
             * @return { deferred }
             */
            create: function (data) {

                return http.PUT({
                    module: 'mailfilter/v2',
                    params: { action: 'new' },
                    data: data
                });
            },

            /**
             * get rules
             * @param  {string} flag (filters list)
             * @return { deferred }
             */
            getRules: function (flag) {

                return http.GET({
                    module: 'mailfilter/v2',
                    params: { action: 'list', flag: flag }
                })
                .then(function (data) {
                    return data;
                });
            },

            /**
             * update rule
             * @param  {object} data
             * @return { deferred }
             */
            update: function (data) {

                return http.PUT({
                    module: 'mailfilter/v2',
                    params: { action: 'update' },
                    data: data
                });
            },

            /**
             * get config
             * @return { deferred }
             */
            getConfig: function () {

                var getter = function () {
                    return http.GET({
                        module: 'mailfilter/v2',
                        params: { action: 'config' }
                    }).then(function (config) {
                        configHash = config;
                        return configHash;
                    });
                };

                return !_.isEmpty(configHash) ? $.Deferred().resolve(configHash) : getter();
            },

            /**
             * reorder rules
             * @param  {array} data
             * @return { deferred }
             */
            reorder: function (data) {
                return http.PUT({
                    module: 'mailfilter/v2',
                    params: { action: 'reorder' },
                    data: data
                });
            },

            apply: function (params) {
                return http.GET({
                    module: 'mailfilter/v2',
                    params: _.extend({ action: 'apply' }, params)
                });
            }
        };

    Events.extend(api);

    return api;
});
