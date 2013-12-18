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

    var collections = {};

    function propagateRemove(module, model) {
        _(collections[module]).each(function (entry) {
            var target = entry.collection.get(model.cid);
            if (target) {
                entry.collection.remove(target, { silent: true });
            }
        });
    }

    function propagateChange(module, model) {
        _(collections[module]).each(function (entry) {
            var target = entry.collection.get(model.cid), data;
            if (target) {
                data = model.toJSON();
                delete data.index;
                target.set(data, { silent: true });
            }
        });
    }

    function Pool(module) {

        collections[module] = {};

        this.getCollections = function () {
            return collections[module];
        };

        this.get = function (cid) {

            var entry = collections[module][cid];

            if (entry) {
                entry.access = _.now();
                return entry.collection;
            }

            // register new collection
            entry = collections[module][cid] = { access: _.now(), collection: new backbone.Collection() };

            // propagate changes in all collections
            return entry.collection.on({
                'remove': propagateRemove.bind(this, module),
                'change': propagateChange.bind(this, module)
            });
        };
    }

    _.extend(Pool.prototype, {

        getDefault: function () {
            return new backbone.Collection();
        }
    });

    return Pool;
});
