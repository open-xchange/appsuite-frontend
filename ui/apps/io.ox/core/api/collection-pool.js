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

define('io.ox/core/api/collection-pool', ['io.ox/core/api/backbone'], function (backbone) {

    'use strict';

    var pools = {},
        collections = {},
        // to avoid unnecessary/endless recursion
        skip = false,
        skipRemove = false;

    function propagateRemove(module, model) {
        if (skip || skipRemove) return;
        _(collections[module]).each(function (entry) {
            var target = entry.collection.get(model.cid);
            if (target) {
                skip = true;
                entry.collection.remove(target);
            }
        });
        skip = false;
    }

    function propagateChange(module, model) {
        if (skip) return;
        _(collections[module]).each(function (entry) {
            var target = entry.collection.get(model.cid), data;
            if (target) {
                skip = true;
                data = model.toJSON();
                delete data.index;
                target.set(data);
            }
        });
        skip = false;
    }

    function gc(hash) {

        // Garbage Collection
        // ------------------
        // concept:
        // - on first refreah, all collections are marked as expired
        // - collections that are still used in UI will be updated and therefore "expired" will be set to false
        // - models that are in active collections are collected
        // - all remaining models will be removed

        // hash to track referenced models
        var models = {};

        // look for expired collection
        _(hash).each(function (entry, id) {
            // ignore detail collection
            if (id === 'detail') return;
            if (entry.collection.expired) {
                // remove collections if marked as expired
                entry.collection.reset();
                delete hash[id];
            } else {
                // track all referenced models
                entry.collection.each(function (model) {
                    models[model.cid] = true;
                    _(this.getDependentModels(model.cid)).each(function (model) {
                        models[model.cid] = true;
                    });
                }, this);
            }
        }, this);

        // loop over detail collection to find expired models
        var expired = this.get('detail').filter(function (model) {
            return !models[model.cid];
        });

        // remove expired modesl from detail collection
        this.get('detail').remove(expired, { silent: true });

        // clean up
        expired = models = null;

        // mark all collections as expired
        _(hash).each(function (entry, id) {
            // ignore detail collection
            if (id === 'detail') return;
            // mark as expired
            entry.collection.expired = true;
        });
    }

    function Pool(module) {

        var hash = collections[module] || (collections[module] = {});

        this.getCollections = function () {
            return hash;
        };

        this.get = function (cid) {

            var entry = hash[cid];

            if (entry) {
                entry.access = _.now();
                return entry.collection;
            }

            // register new collection
            hash[cid] = { access: _.now(), collection: new backbone.Collection() };

            // add "expired" attribute
            hash[cid].collection.expired = false;

            // to simplify debugging
            hash[cid].collection.cid = cid;

            // propagate changes in all collections
            return hash[cid].collection.on({
                'remove': propagateRemove.bind(this, module),
                'change': propagateChange.bind(this, module)
            });
        };

        this.getModule = function () {
            return module;
        };

        // clear pool on global refresh
        ox.on('refresh^', _.throttle(gc.bind(this, hash), 5000));
    }

    // create new pool / singleton per module
    // avoids having different instances per module
    Pool.create = function (module) {
        return pools[module] || (pools[module] = new Pool(module));
    };

    // inspect
    Pool.inspect = function () {
        _(pools).each(function (pool, module) {
            var count = 0, collections = pool.getCollections();
            _(collections).each(function (entry) {
                count += _(entry.collection).size();
            });
            console.debug('Pool:', module, 'Model count:', count, 'Collections:', collections);
        });
    };

    // don't propagate remove events; usually during a collection.set
    Pool.preserve = function(fn) {
        skipRemove = true;
        if (fn) fn();
        skipRemove = false;
    };

    _.extend(Pool.prototype, {

        getDefault: function () {
            return new backbone.Collection();
        },

        propagate: function (type, data) {
            if (type === 'change') {
                propagateChange.call(this, this.getModule(), new backbone.Model(data));
            }
        },

        add: function (cid, data) {
            var collection = this.get(cid);
            collection.add(data, { merge: true });
        },

        resolve: function (list) {
            var collection = this.get('detail');
            return _([].concat(list)).map(function (item) {
                var cid = _.cid(item);
                return collection.get(cid) || {};
            });
        },

        getDetailModel: function (data) {

            var cid = _.cid(data), collection = this.get('detail'), model;

            if ((model = collection.get(cid))) return model;

            model = new backbone.Model(data);

            // add to pool unless it looks like a nested object
            if (data.folder_id !== undefined && data.parent === undefined) collection.add(model);

            return model;
        },

        grep: function (str) {
            return _(this.getCollections())
                .chain()
                .filter(function (entry, id) {
                    return id.indexOf(str) > -1;
                })
                .pluck('collection')
                .value();
        },

        getByFolder: function (id) {
            return this.grep('folder=' + id);
        },

        // used by garbage collector to resolve threads
        getDependentModels: function (/* cid */) {
            return [];
        }
    });

    return Pool;
});
