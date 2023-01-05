/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/core/api/mailfilter', [
    'io.ox/core/http',
    'io.ox/core/event',
    'io.ox/core/capabilities',
    'io.ox/core/api/jobs'
], function (http, Events, capabilities, jobsAPI) {

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

                // do not send any requests which could fail, just return empty config instead.
                if (!capabilities.has('mailfilter_v2')) return $.when({ actioncmds: [], options: {}, tests: [] });

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
            apply: function (params, longRunningJobCallback) {
                return jobsAPI.enqueue(http.GET({
                    module: 'mailfilter/v2',
                    params: _.extend({ action: 'apply', allow_enqueue: true }, params)
                }), longRunningJobCallback);
            }
        };

    Events.extend(api);

    return api;
});
