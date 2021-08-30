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

define('io.ox/core/api/sub', [
    'io.ox/core/http',
    'io.ox/core/api/factory'
], function (http, apiFactory) {

    'use strict';

    /**
     * clears cache
     * @private
     * @return { deferred }
     */
    var clearCache = function (api, data) {
        var keys = {
            general: api.cid(''),
            folder: api.cid({ folder: data.folder }),
            pub: '.' + data.id,
            sub: data.folder + '.'
        };
        return $.when(
            //api.caches.all.remove(keys.folder), //enable to support getAll({ folder: folder })
            api.caches.all.remove(keys.general),
            api.caches.get.grepRemove(keys.pub),
            api.caches.get.grepRemove(keys.sub)
        );
    };

    /**
     * gerneralized API for pubsub
     * @param  {object} opt
     * @return { object} api
     */
    function api(opt) {
        return $.extend(true, apiFactory(opt), {
            /**
             * update publication/subscription
             * @param  {object} data
             * @return { deferred }
             */
            update: function (data) {
                return clearCache(this, { id: data.id || '', folder: data.folder || data.entity.folder || '' })
                .then(function () {
                    return http.PUT({
                        module: opt.module,
                        params: {
                            action: 'update'
                        },
                        data: data
                    });
                });
            },

            /**
             * removes publication/subscription
             * @param  {string} id
             * @return { deferred }
             */
            destroy: function (id) {
                var that = this;
                return clearCache(this, { id: id })
                    .then(function () {
                        return that.remove(id);
                    });
            },

            /**
             * create publication/subscription
             * @param  {object} data (pubsub model attributes)
             * @return { deferred} subscription id
             */
            create: function (data) {
                var that = this;
                return clearCache(that, data.entity).then(function () {
                    return http.PUT({
                        module: opt.module,
                        appendColumns: false,
                        params: {
                            action: 'new'
                        },
                        data: data
                    });
                });
            }
        });
    }

    var subscriptions = $.extend(true, api({
        module: 'subscriptions',
        requests: {
            all: {
                columns: 'id,folder,displayName,enabled',
                extendColumns: 'io.ox/core/api/pubsub/subscriptions/all'
            }
        }
    }), {
        /**
         * refresh subscription
         * @param  {object} data (id,folder)
         * @return { deferred} item count
         */
        refresh: function (data) { //checked
            if (!data) {
                //triggered by global refresh
                return;
            }

            var folder = data.folder || data.attributes.folder || '';
            return clearCache(this, data).then(function () {
                return http.GET({
                    module: 'subscriptions',
                    appendColumns: false,
                    params: {
                        action: 'refresh',
                        id: data.id,
                        folder: folder
                    }
                }).then(this.resolve, function (resp) {
                    //special error 'verfication needed': create clickable link
                    var link = resp.error_params[0];
                    if (resp.code === 'SUB-90112' && link) {
                        resp.error_html = resp.error.replace(link, '<a href="' + link + '" title="' + link + '" target="_blank">Link</>');
                    }
                    throw resp;
                });
            });
        }
    });

    ox.on('refresh^', function () {
        _([subscriptions]).each(function (api) {
            api.caches.get.clear();
            api.caches.all.clear().then(function () {
                api.trigger('refresh:all');
            });
        });
    });

    /**
     * @link: https://intranet.open-xchange.com/wiki/development:misc:subscription.api.proposal
     * @link: https://intranet.open-xchange.com/wiki/development:misc:publication.api.proposal
     */
    return {
        subscriptions: subscriptions,
        sources: apiFactory({
            module: 'subscriptionSources',
            requests: {
                all: {
                    columns: 'id,displayName,icon,module,formDescription'
                }
            }
        })
    };

});
