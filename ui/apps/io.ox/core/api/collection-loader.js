/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
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
                if (last && last.head) last = last.head;
                if (first && first.head) first = first.head;
                // compare
                if (_.cid(first) !== _.cid(last)) {
                    if (ox.debug) console.warn('paginate compare fail', _.cid(first), _.cid(last), data);
                    // check d0901724d8050552b5b82c0fdd5be1ccfef50d99 for details
                    params.thread = params.action === 'threadedAll';
                    loader.reload(params, PAGE_SIZE);
                    return;
                }
            }

            Pool.preserve(function () {
                var method = methods[type];
                if (collection.preserve && type === 'reload') {
                    // avoid "remove" and "sort" events
                    // used by all-unseen, for example
                    collection[method](data, { parse: true, add: true, remove: false, sort: false });
                } else {
                    // normal case
                    collection[method](data, { parse: true });
                }
            });

            // track completeness
            // load: always complete if we get less than requested
            // paginate: the first data element is the last currently visible element in the list, therefore <=1 is already complete
            // reload: keep the previous state. no need to trigger complete
            if (type === 'load') collection.setComplete(data.length < PAGE_SIZE);
            else if (type === 'paginate') collection.setComplete(data.length <= 1);

            collection.trigger(type);
        }

        function fail(collection, type, e) {
            collection.trigger(type + ':fail', e);
        }

        function process(params, type) {
            // get offset
            var offset = type === 'paginate' ? Math.max(this.collection.length - 1, 0) : 0;
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
                    self.fail(e);
                });
        }

        this.load = function (params) {

            var collection;

            params = this.getQueryParams(params || {});
            // params are false for virtual folders
            if (params === false) return;
            params.limit = '0,' + this.PRIMARY_PAGE_SIZE;
            collection = this.collection = this.getCollection(params);
            this.loading = false;

            if (this.isBad(params.folder) || ((collection.length > 0 || collection.complete) && !collection.expired && collection.sorted && !collection.preserve)) {
                // reduce too large collections
                var pageSize = collection.CUSTOM_PAGE_SIZE || this.PRIMARY_PAGE_SIZE;
                if (collection.length > pageSize) {
                    collection.reset(collection.first(pageSize), { silent: true });
                    collection.complete = false;
                }
                _.defer(function () {
                    collection.trigger(collection.complete ? 'reset load cache complete' : 'reset load cache');
                });
                return collection;
            }

            this.loading = true;
            _.defer(process.bind(this), params, 'load');
            return collection;
        };

        this.paginate = function (params) {

            var collection = this.collection;
            if (this.loading) return collection;

            // offset is collection length minus one to allow comparing last item and first fetched item (see above)
            var offset = Math.max(0, collection.length - 1);
            params = this.getQueryParams(_.extend({ offset: offset }, params));
            if (this.isBad(params.folder)) return collection;
            params.limit = offset + ',' + (collection.length + this.SECONDARY_PAGE_SIZE);
            this.loading = true;

            _.defer(process.bind(this), params, 'paginate');
            return collection;
        };

        this.reload = function (params, tail) {
            var collection = this.collection;
            if (this.loading) return collection;

            params = this.getQueryParams(_.extend({ offset: 0 }, params));
            if (this.isBad(params.folder)) return collection;
            // see Bug #59875
            // calculate maxLimit correctly (times paginate was done * secondary_page_size + initial page size)
            var maxLimit = Math.ceil((collection.length - this.PRIMARY_PAGE_SIZE) / this.SECONDARY_PAGE_SIZE) * this.SECONDARY_PAGE_SIZE + this.PRIMARY_PAGE_SIZE;
            // in case we have an empty folder (drive), rightHand will be 0. See Bug #60086
            var rightHand = Math.max(collection.length + (tail || 0), maxLimit);
            params.limit = '0,' + (rightHand === 0 ? this.PRIMARY_PAGE_SIZE : rightHand);

            this.loading = true;

            _.defer(process.bind(this), params, 'reload');
            return collection;
        };
    }

    function ignore(key) {
        return !this.ignore[key];
    }

    function map(key) {
        var value = this[key];
        return key + '=' + (_.isString(value) ? value : JSON.stringify(value));
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

        noSelect: function () {
            return false;
        },

        virtual: function () {
            return false;
        },

        isBad: function (value) {
            return !value && value !== 0;
        },

        fetch: function (params) {
            var module = this.module,
                key = module + '/' + _.cacheKey(_.extend({ session: ox.session }, params)),
                rampup = ox.rampup[key],
                noSelect = this.noSelect(params),
                virtual = this.virtual(params),
                self = this;

            if (rampup) {
                delete ox.rampup[key];
                return $.when(rampup);
            }

            if (noSelect) return $.when([]);
            if (virtual) return $.when(virtual);

            return http.wait().then(function () {
                return self.httpGet(module, params).then(function (data) {
                    // apply filter
                    if (self.filter) data = _(data).filter(self.filter);
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
        },
        fail: function (/* error */) {
        }
    });

    return CollectionLoader;
});
