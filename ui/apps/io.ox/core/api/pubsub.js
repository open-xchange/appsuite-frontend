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
     * gerneralized API for pubsub
     * @param  {object} opt
     * @return {deferred}
     */
    function api(opt) {
        var opt = $.extend(true, {
            module: null,
            columns: null
        }, opt || {});

        return apiFactory({
            module: opt.module,

            /**
             * update publication/subscription
             * @private
             * @param  {string|object} subscription id or object
             * @return {deferred}
             */
            update: function (data) {
                return http.PUT({
                    module: opt.module,
                    params: {
                        action: 'update'
                    },
                    data: data
                });
            },
            /**
             * refresh publication/subscription
             * @private
             * @param  {string|object} subscription id or object
             * @return {deferred}
             */
            refresh: function (id, folder) {
                folder = _.isObject(folder) ? folder.id : folder || '';
                return http.GET({
                    module: opt.module,
                    appendColumns: false,
                    params: {
                        action: 'refresh',
                        id : id,
                        folder: folder
                    }
                });
            },

            /**
             * create publication/subscription
             * @private
             * @param  {string|object} subscription id or object
             * @return {deferred}
             */
            create: function (data) {
                return http.PUT({
                    module: opt.module,
                    appendColumns: false,
                    params: {
                        action: 'new'
                    },
                    data: data
                });
            }
        });
    }

    /**
     * public subscription sources api
     * @public
     * @return {object}
     */
    var sources = function () {
        var opt = {
                module: 'soures',
                columns: 'id,displayName,icon,module,formDescription'
            },
            apimod = api(opt);

        return {
            /**
             * returns folder subscriptions
             * @param  {string} type f.e. 'contacts'
             * @param  {string|object} folder id or object
             * @return {deferred}
             */
            all: function (type) {
                return apimod.all(type);
            }
        };
    };

    return {
        publication: api({
            module: 'publications',
            columns: 'id,entity,entityModule,enabled,target'
        }),
        subscription: api({
            module: 'subscriptions',
            columns: 'id,displayName,enabled,source'
        }),
        sources: sources()
    };

});
