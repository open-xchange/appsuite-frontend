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
 */

define('io.ox/core/api/pubsub',
    ['io.ox/core/http'], function (http) {

    'use strict';

    //TODO: caching

    /**
     * gerneralized API for pubsub
     * @param  {string} opt
     * @return {deferred}
     */
    function api(opt) {
        var opt = $.extend(true, {
            module: null,
            columns: null
        }, opt || {});

        return {
            /**
             * returns folder publications/subscriptions
             * @private
             * @param  {string} type f.e. 'contacts'
             * @param  {string|object} folder id or object
             * @return {deferred}
             */
            all: function (type, folder) {
                var def = $.Deferred();
                folder = _.isObject(folder) ? folder.id : folder || '';
                return http.GET({
                    module: opt.module,
                    params: {
                        action: 'all',
                        columns: opt.columns,
                        folder: folder,
                        entityModule: type
                    }
                })
                .done(function (data) {
                    def.resolve(data);
                })
                .fail(function (data) {
                    def.reject(data);
                });
            },
            /**
             * returns publication/subscription data
             * @private
             * @param  {string|object} subscription id or object
             * @return {deferred}
             */
            get: function (item) {
                var def = $.Deferred(),
                    id = _.isObject(item) ? item.id : item || '';
                return http.GET({
                    module: opt.module,
                    params: {
                        action: 'get',
                        id: id
                    }
                })
                .done(function (data) {
                    def.resolve(data || []);
                })
                .fail(function (data) {
                    def.reject(data);
                });
            },

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
             * create publication/subscription
             * @private
             * @param  {string|object} subscription id or object
             * @return {deferred}
             */
            refresh: function (id, folder) {
                folder = _.isObject(folder) ? folder.id : folder || '';
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
            },

            /**
             * remove publication/subscription
             * @private
             * @param  {array} array of ids
             * @return {deferred}
             */
            remove: function (data) {
                return http.PUT({
                    module: opt.module,
                    params: {
                        action: 'delete'
                    },
                    data: data
                });
            }
        };
    }


    /**
     * public publication api
     * @public
     * @return {object}
     */
    var publication = function () {
        var opt = {
                module: 'publications',
                columns: 'id,displayName,enabled'
            },
            apimod = api(opt);

        return {
            /**
             * returns folder publications
             * @param  {string} type f.e. 'contacts'
             * @param  {string|object} folder id or object
             * @return {deferred}
             */
            all: function (type, folder) {
                return apimod.all(type, folder);
            },
            /**
             * returns publication data
             * @private
             * @param  {string|object} publication id or object
             * @return {deferred}
             */
            get: function (publication) {
                return apimod.get(publication);
            }
        };
    };


    /**
     * public subscription api
     * @public
     * @return {object}
     */
    var subscription = function () {
        var opt = {
                module: 'subscriptions',
                columns: 'id,displayName,enabled,source'
            },
            apimod = api(opt);

        return {
            /**
             * returns folder subscriptions
             * @param  {string} type f.e. 'contacts'
             * @param  {string|object} folder id or object
             * @return {deferred}
             */
            all: function (type, folder) {
                return apimod.all(type, folder);
            },
            /**
             * returns subscription data
             * @param  {string|object} subscription id or object
             * @return {deferred}
             */
            get: function (publication) {
                return apimod.get(publication);
            },
            /**
             * returns subscription data
             * @param  {object} data
             * @return {deferred}
             */
            create: function (data) {
                return apimod.create(data);
            },
            /**
             * returns subscription data
             * @param  {object} data
             * @return {deferred}
             */
            refresh: function (id, folder) {
                return apimod.refresh(id, folder);
            }
        };
    };


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
        publication: publication(),
        subscription: subscription(),
        sources: sources()
    };

});