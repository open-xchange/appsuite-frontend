/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

define('io.ox/core/api/pubsub',
    ['io.ox/core/http',
     'io.ox/core/api/factory',
     'io.ox/core/folder/api',
    ], function (http, apiFactory, folderAPI) {

    'use strict';

    /**
     * clears cache
     * @private
     * @return {deferred}
     */
    var clearCache = function (api, data) {
        var keys = {
            general: api.cid(''),
            folder: api.cid({ folder: data.folder }),
            pub: '.' + data.id,
            sub: data.folder + '.'
        };
        return $.when(
            //enable to support getAll({folder: folder})
            //api.caches.all.remove(keys.folder),
            api.caches.all.remove(keys.general),
            api.caches.get.grepRemove(keys.pub),
            api.caches.get.grepRemove(keys.sub)
        );
    };

    /**
     * gerneralized API for pubsub
     * @param  {object} opt
     * @return {object} api
     */
    function api(opt) {

        return $.extend(true, apiFactory(opt), {
            /**
             * update publication/subscription
             * @param  {object} data
             * @return {deferred}
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
             * @return {deferred}
             */
            destroy: function (id) {
                var that = this;
                return clearCache(this, {id: id})
                    .pipe(function () {
                        return that.remove(id);
                    });
            },

            /**
             * create publication/subscription
             * @param  {object} data (pubsub model attributes)
             * @return {deferred} subscription id
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
        })
        .on('delete', function () {
            //remove cloud icon
            folderAPI.refresh();
        });
    }

    var publications = api({
        module: 'publications',
        requests: {
            all: {
                columns: 'id,displayName,enabled',
                extendColumns: 'io.ox/core/api/pubsub/publications/all'
            }
        }
    });

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
         * @return {deferred} item count
         */
        refresh: function (data) {
            if (!data) {
                //triggered by global refresh
                return;
            }
            var folder = data.folder || '';
            return clearCache(this, data).pipe(function () {
                return http.GET({
                    module: 'subscriptions',
                    appendColumns: false,
                    params: {
                        action: 'refresh',
                        id : data.id,
                        folder: folder
                    }
                }).then(this.resolve, function (resp) {
                    //special error 'verfication needed': create clickable link
                    var link = resp.error_params[0];
                    if (resp.code === 'SUB-90112' && link) {
                        resp.error_html = resp.error.replace(link, '<a href="' + link + '" title="' + link + '" target="_blank">Link</>');
                    }
                    return resp;
                });
            });
        }
    });

    ox.on('refresh^', function () {
        _([publications, subscriptions]).each(function (api) {
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
        publications: publications,
        publicationTargets: api({
            module: 'publicationTargets',
            requests: {
                all: {
                    columns: 'id,displayName,icon,module,formDescription',
                    extendColumns: 'io.ox/core/api/pubsub/publicationTargets/all'
                }
            }
        }),
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
