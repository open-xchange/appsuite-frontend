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
     * @return {deferred}
     */
    var clearCache = function (api) {
        return $.when(
            api.caches.all.clear(),
            api.caches.get.clear(),
            api.caches.list.clear()
        );
    };

    /**
     * gerneralized API for pubsub
     * @param  {object} opt
     * @return {deferred}
     */
    function api(opt) {

        return $.extend(true, apiFactory(opt), {
            /**
             * update publication/subscription
             * @private
             * @param  {string|object} subscription id or object
             * @return {deferred}
             */
            update: function (data) {
                return clearCache(this).pipe(function () {
                    http.PUT({
                        module: opt.module,
                        params: {
                            action: 'update'
                        },
                        data: data
                    });
                });
            },

            /**
             * create publication/subscription
             * @private
             * @param  {string|object} subscription id or object
             * @return {deferred}
             */
            create: function (data) {
                return clearCache(this).pipe(function () {
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

    return {
        publications: api({
            module: 'publications',
            requests: {
                all: {
                    columns: 'id,displayName,enabled'
                }
            }
        }),
        publicationTargets: api({
            module: 'publicationTargets',
            requests: {
                all: {
                    columns: 'id,displayName,icon,module,formDescription'
                }
            }
        }),
        subscriptions: $.extend(true, api({
            module: 'subscriptions',
            requests: {
                all: {
                    columns: 'id,displayName,enabled'
                }
            }
        }),
        {
            /**
             * refresh publication/subscription
             * @private
             * @param  {object} data id and folder
             * @return {deferred} item count
             */
            refresh: function (data) { //checked
                var folder = data.folder || '';
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
        }),
        sources: apiFactory({
            module: 'subscriptionSources'
        })
    };

});
