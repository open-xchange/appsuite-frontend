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

define('io.ox/find/manager/facet-collection', [
    'io.ox/find/manager/facet-model',
    'io.ox/find/date/facet-model',
    'io.ox/core/extensions'
], function (BaseModel, DateModel, ext) {

    'use strict';

    var POINT = ext.point('io.ox/find/manager/facet');

    POINT.extend({
        index: 100,
        customize: function (valuemodels) {
            var def = $.Deferred();
            _.extend(valuemodels || {}, { 'date.custom': DateModel });
            return def;
        }
    });

    // get properties from objects/models
    function flexget(obj, key) {
        return obj.get ? obj.get(key) : obj[key];
    }

    function cid(obj) {
        var id = flexget(obj, 'id');
        // create pseudo valueId (simple facets use value-independent ids)
        if (flexget(obj, 'style') === 'simple') {
            // TODO: ask backend for a unique id
            var dynamic = flexget(obj, 'name') || flexget(obj, 'item').name;
            id = id + ':' + dynamic;
        }
        return id;
    }

    var FacetCollection = Backbone.Collection.extend({

        model: BaseModel,

        type: 'facet-collection',

        // keep order set by backend
        comparator: 'index',

        initialize: function () {
            var self = this;
            // trigger event: 'active:[current number of active]'
            this.on('change:list-of-actives', _.debounce(function () {
                self.trigger('active', this.getActive().length);
            }, 10)
            );
            // custom value models
            this.facetmodels = {};
            POINT.invoke('customize', this, this.facetmodels);
        },

        /**
         * helper function to  determine if only folder facet is active
         */
        isFolderOnly: function () {
            var list = this.getActive(),
                single = list.length === 1;
            if (!single) return;
            return _.where(list, { id: 'folder' }).length;
        },

        isAccountOnly: function () {
            var list = this.getActive(),
                single = list.length === 1;
            if (!single) return;
            return _.where(list, { id: 'account' }).length;
        },

        _createModel: function (data) {
            var Model = this.facetmodels[data.id] || BaseModel;
            return new Model(data);
        },

        add: function (models, options) {
            var self = this;
            var list = _.map([].concat(models), function (data) {
                return self._createModel(data);
            });

            return this.set(list, _.extend({ merge: false }, options, { add: true, remove: false }));
        },

        /**
         * advanced 'add'
         * - keeps active facets
         * - adds new
         * - removes missing
         */
        update: function (list, options) {
            var self = this,
                valid = [],
                invalid = [],
                hash = {},
                opt = _.extend({ keep: [] }, options);
            list = [].concat(list);

            //TODO: global ids do not change
            // add new
            _.each(list, function (obj, index) {
                var id = cid(obj),
                    model = self.get(id);
                if (model) {
                    // do not update special facets (see bug 42395)
                    if (opt.keep.indexOf(id) < 0) {
                        // merge values into existing model
                        model.update(obj);
                    }
                } else if (!model) {
                    // use cid here to keep server side id
                    // after model is created cid is mapped to model id
                    obj.cid = id;
                    obj.index = obj.index || index * 100;
                    valid.push(obj);
                }
                hash[id] = model ? 'update' : 'add';
            });
            self.add(valid);

            // remove invalid
            invalid = this.filter(function (facet) {
                var cid = facet.get('id'),
                    active = !!facet.getActive().length;
                // remove when missing or inactive
                return !(hash[cid] || active);
            });
            self.remove(invalid);
        },

        /**
         * status active/inactive
         */
        activate: function (facetid, valueid, option) {
            //TODO: custom values e.g. folder
            option = (option || {}).option || option;

            var facet = this.get(facetid),
                value = facet.getValue(valueid);
            value.activate(option);
        },

        /**
         * facets with active values
         */
        getActive: function () {
            return this.filter(function (facet) {
                return facet.getActive().length;
            });
        },

        /**
         * reset all
         */
        reset: function () {
            this.filter(function (facet) {
                _.each(facet.getActive(), function (value) {
                    value.deactivate();
                });
            });
        },

        /**
         * server call
         */
        getRequest: function () {
            var list = [];
            this.each(function (facet) {
                var values = facet.get('values');
                values.each(function (value) {
                    var obj = value.getRequest();
                    if (obj) {
                        list.push(obj);
                    }
                });
            });
            return list;
        },

        /**
         * collections loader composite id
         */
        // TODO: We just need a 'cid' attribute in the backend response
        getResponseCid: function () {
            return 'search/' +
                // prevent caching of smart date requests (e.g. 'yesterday')
                moment().format('YYYY-MM-DD') + '/' +
                _(this.getRequest())
                .chain()
                .map(function (obj) {
                    var filter = obj.filter,
                        key = obj.facet + (filter && _.isArray(filter.fields) ? '(' + filter.fields.join(',') + ')' : ''),
                        value = filter && _.isArray(filter.queries) ? filter.queries.join(',') : obj.value;
                    return key + '=' + value;
                })
                .value().sort().join('&');
        }
    });

    return FacetCollection;
});
