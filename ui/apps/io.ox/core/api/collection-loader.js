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

define('io.ox/core/api/collection-loader', ['io.ox/core/api/collection-pool', 'io.ox/core/http'], function (Pool, http) {

    'use strict';

    function process(params, collection, method) {

        return this.fetch(params)
            .done(this.addIndex.bind(this, method === 'add' ? collection.length : 0, params))
            .then(function (data) {
                return collection[method](data);
            });
    }

    function toHash(array) {
        var hash = {};
        _(array).each(function (i) { hash[i] = true; });
        return hash;
    }

    function CollectionLoader(options) {

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

    _.extend(CollectionLoader.prototype, {

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

        before: function (/* offset, params, data */) {
        },

        each: function (/* obj, index, offset, params */) {
        },

        after: function (/* offset, params, data */) {
        },

        addIndex: function (offset, params, data) {
            this.before(offset, params, data);
            _(data).each(function (obj, index) {
                obj.index = offset + index;
                this.each(obj, index, offset, params);
            }, this);
            this.after(offset, params, data);
        },

        fetch: function (params) {

            var key = this.module + '/' + $.param(params) + '&session=' + ox.session,
                rampup = ox.rampup[key];

            if (rampup) {
                delete ox.rampup[key];
                return $.Deferred().resolve(rampup);
            }

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

            return process.call(this, params, this.collection.reset(), 'reset');
        },

        paginate: function (params) {

            var offset = this.collection.length;
            params = this.getQueryParams(_.extend({ offset: offset }, params));
            params.limit = offset + ',' + (offset + this.LIMIT);

            return process.call(this, params, this.collection, 'add');
        },

        reload: function (params) {

            params = this.getQueryParams(_.extend({ offset: 0 }, params));
            params.limit = '0,' + this.collection.length;

            return process.call(this, params, this.collection, 'set');
        }
    });

    return CollectionLoader;
});
