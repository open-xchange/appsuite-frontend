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

    var methods = { 'load': 'reset', 'paginate': 'add', 'reload': 'set' };

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

        this.pool = Pool.create(this.module);
        this.ignore = toHash(String(this.ignore).split(' '));
        this.collection = null;
        this.loading = false;

        function apply(collection, type, params, loader, data) {

            // determine current page size
            var PAGE_SIZE = type === 'load' ? loader.PRIMARY_PAGE_SIZE : loader.SECONDARY_PAGE_SIZE;

            // don't use loader.collection to avoid cross-collection issues (see bug 38286)

            if (type === 'paginate' && collection.length > 0) {
                // check if first fetched item matches last existing item
                // use case: reload on new messages; race-conditions with external clients
                var first = _(data).first(), last = collection.last().toJSON();
                // use "head" item to compare threads
                if (last.head) last = last.head;
                // compare
                if (_.cid(first) !== _.cid(last)) {
                    // check d0901724d8050552b5b82c0fdd5be1ccfef50d99 for details
                    params.thread = params.action === 'threadedAll';
                    loader.reload(params, PAGE_SIZE);
                    return;
                }
            }

            Pool.preserve(function () {
                var method = methods[type];
                collection[method](data, { parse: true });
            });

            // track completeness
            collection.complete = (type === 'load' && data.length < PAGE_SIZE) || (type === 'paginate' && data.length <= 1);
            if (collection.complete) collection.trigger('complete');
            collection.trigger(type);
        }

        function fail(collection, type, e) {
            collection.trigger(type + ':fail', e);
        }

        function process(params, type) {
            // get offset
            var offset = type === 'paginate' ? this.collection.length - 1 : 0;
            // trigger proper event
            this.collection.trigger('before:' + type);
            // create callbacks
            var cb_apply = _.lfo(apply, this.collection, type, params, this),
                cb_fail = _.lfo(fail, this.collection, type),
                self = this;
            // fetch data
            return this.fetch(params)
                .done(function (data) {
                    self.addIndex(offset, params, data);
                    self.done();
                    cb_apply(data);
                })
                .fail(function (e) {
                    self.done();
                    cb_fail(e);
                });
        }

        this.load = function (params) {

            var collection;

            params = this.getQueryParams(params || {});
            params.limit = '0,' + this.PRIMARY_PAGE_SIZE;
            collection = this.collection = this.getCollection(params);
            this.loading = false;

            if (collection.length > 0 && !collection.expired && collection.sorted) {
                // reduce too large collections
                collection.reset(collection.first(this.PRIMARY_PAGE_SIZE), { silent: true });
                _.defer(function () {
                    collection.trigger(collection.complete ? 'reset load cache complete' : 'reset load cache');
                });
                return collection;
            }

            this.loading = true;
            collection.expired = false;
            _.defer(process.bind(this), params, 'load');
            return collection;
        };

        this.paginate = function (params) {

            var collection = this.collection;
            if (this.loading) return collection;

            // offset is collection length minus one to allow comparing last item and first fetched item (see above)
            var offset = Math.max(0, collection.length - 1);
            params = this.getQueryParams(_.extend({ offset: offset }, params));
            params.limit = offset + ',' + (offset + this.SECONDARY_PAGE_SIZE + 1);
            this.loading = true;

            collection.expired = false;
            _.defer(process.bind(this), params, 'paginate');
            return collection;
        };

        this.reload = function (params, tail) {

            var collection = this.collection;
            if (this.loading) return collection;

            params = this.getQueryParams(_.extend({ offset: 0 }, params));
            params.limit = '0,' + Math.max(collection.length + (tail || 0), this.PRIMARY_PAGE_SIZE);
            this.loading = true;

            collection.expired = false;
            _.defer(process.bind(this), params, 'reload');
            return collection;
        };
    }

    function ignore(key) {
        return !this.ignore[key];
    }

    function map(key) {
        return key + '=' + this[key];
    }

    _.extend(CollectionLoader.prototype, {

        // highly emotional and debatable default
        PRIMARY_PAGE_SIZE: 50,
        SECONDARY_PAGE_SIZE: 200,

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

        virtual: function () {
            return false;
        },

        fetch: function (params) {

            var module = this.module,
                key = module + '/' + _.param(_.extend({ session: ox.session }, params)),
                rampup = ox.rampup[key],
                virtual = this.virtual(params),
                self = this;

            if (rampup) {
                delete ox.rampup[key];
                return $.when(rampup);
            }

            if (virtual) {
                return $.when(virtual);
            }

            return http.wait().then(function () {
                return self.httpGet(module, params).then(function (data) {
                    // useSlice helps if server request doesn't support "limit"
                    return self.useSlice ? Array.prototype.slice.apply(data, params.limit.split(',')) : data;
                });
            });
        },

        httpGet: function (module, params) {
            if (this.useSlice) params = _(params).omit('limit');
            return http.GET({ module: module, params: params });
        },

        getQueryParams: function () {
            return {};
        },

        done: function () {
            this.loading = false;
        }
    });

    return CollectionLoader;
});
