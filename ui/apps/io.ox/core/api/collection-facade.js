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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/api/collection-facade', ['io.ox/core/api/collection-pool', 'io.ox/core/http'], function (Pool, http) {

    'use strict';

    function process(deferred, context, collection, method) {
        return deferred
            .done(context.addIndex.bind(context, method === 'add' ? collection.length : 0))
            .then(function (data) {
                return collection[method](data);
            });
    }

    function toHash(array) {
        var hash = {};
        _(array).each(function (i) { hash[i] = true; });
        return hash;
    }

    function CollectionFacade(options) {

        _.extend(this, {
            columns: '1,20',
            module: 'mail',
            ignore: 'limit max'
        }, options);

        this.pool = new Pool(this.module);
        this.ignore = toHash(String(this.ignore).split(' '));
        this.collection = null;
    }

    function ignore(key) {
        return !this.ignore[key];
    }

    function map(key) {
        return key + '=' + this[key];
    }

    _.extend(CollectionFacade.prototype, {

        LIMIT: 30,

        cid: function (obj) {
            return _(obj || {}).chain()
                .keys()
                .filter(ignore, this)
                .map(map, obj)
                .value().sort().join('&') || 'default';
        },

        getDefaultCollection: function () {
            return this.pool.getDefault();
        },

        getCollection: function (params) {
            var cid = this.cid(params);
            return this.pool.get(cid);
        },

        each: function (/* obj, index, offset */) {
        },

        addIndex: function (offset, data) {
            _(data).each(function (obj, index) {
                obj.index = offset + index;
                this.each(obj, index, offset);
            }, this);
        },

        httpGet: function (params) {
            return http.GET({ module: this.module, params: params });
        },

        getQueryParams: function () {
            return {};
        },

        load: function (params) {

            params = this.getQueryParams(params || {});
            params.limit = '0,' + this.LIMIT;
            this.collection = this.getCollection(params);

            if (this.collection.length > 0) {
                this.collection.trigger('reset');
                return $.Deferred().resolve(this.collection);
            }

            return process(this.httpGet(params), this, this.collection.reset(), 'reset');
        },

        paginate: function (params) {

            var offset = this.collection.length;
            params = this.getQueryParams(_.extend({ offset: offset }, params));
            params.limit = offset + ',' + (offset + this.LIMIT);

            return process(this.httpGet(params), this, this.collection, 'add');
        },

        reload: function (params) {

            params = this.getQueryParams(_.extend({ offset: 0 }, params));
            params.limit = '0,' + this.collection.length;

            return process(this.httpGet(params), this, this.collection, 'set');
        }
    });

    return CollectionFacade;
});
