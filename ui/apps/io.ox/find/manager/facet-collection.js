/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
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
        update: function (list) {
            var self = this,
                valid = [],
                invalid = [],
                hash = {};
            list = [].concat(list);

            //TODO: global ids do not change
            // add new
            _.each(list, function (obj, index) {
                var id = cid(obj),
                    model = self.get(id);
                if (model) {
                    // merge values into existing model
                    model.update(obj);
                } else if (!model) {
                    // use cid here to keep server side id
                    // after model is created cid is mapped to model id
                    obj.cid = id;
                    obj.index = index;
                    valid.push(obj);
                }
                hash[id] = model ? 'update' : 'add';
            });
            self.add(valid);

            // remove invalid
            invalid = this.filter(function (facet) {
                var cid = facet.get('id'),
                    active = !!facet.getActive().length;
                // remove when missing and inactive
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
