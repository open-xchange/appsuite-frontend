/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2013
 * Mail: info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

define('io.ox/core/api/pubsub',
    ['io.ox/core/http',
     'io.ox/core/api/factory'
    ], function (http, apiFactory) {

    'use strict';


    /**
     * clears cache
     * @private
     * @return {deferred}
     */
    var clearCache = function (api, data) {
        var keys = {
                general: api.cid(''),
                folder: api.cid({folder: data.folder}),
                pub: '.' + data.id,
                sub: data.folder + '.'
            };
        return $.when(
            //api.caches.all.remove(keys.folder), //enable to support getAll({folder: folder})
            api.caches.all.remove(keys.general),
            api.caches.get.grepRemove(keys.pub),
            api.caches.get.grepRemove(keys.sub)
        );
    };

    /**
     * for test purposes only
     * @private
     * @return {deferred}
     */
    var dumpKeys = function (api) {
        return $.when(
            api.caches.all.keys().pipe(function (data) { console.log('all', data); }),
            api.caches.get.keys().pipe(function (data) { console.log('get', data); })
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
                return clearCache(this, {id: data.id || '', folder: data.folder || data.entity.folder || ''}).pipe(function () {
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
                return clearCache(that, data.entity)
                    .pipe(function () {
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
        refresh: function (data) { //checked
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
