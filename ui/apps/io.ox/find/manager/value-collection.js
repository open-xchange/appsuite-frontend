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

define('io.ox/find/manager/value-collection', [
    'io.ox/find/manager/value-model',
    'io.ox/find/date/value-model',
    'io.ox/core/extensions'
], function (BaseModel, DateModel, ext) {

    'use strict';

    var POINT = ext.point('io.ox/find/manager/value');

    POINT.extend({
        index: 100,
        customize: function (valuemodels) {
            var def = $.Deferred();
            _.extend(valuemodels || {}, { 'date.custom': DateModel });
            return def;
        }
    });

    var ValueCollection = Backbone.Collection.extend({

        model: BaseModel,

        type: 'value-collection',

        initialize: function (models, options, extra) {
            var self = this;

            this.facet = extra.facet;

            // custom event mapping
            this.listenTo(this, 'change:active change:option', function (model) {
                // use 'active' when simultaneously
                var attr = Object.keys(model.changed)[0],
                    mapping = {
                        'active': model.changed.active ? 'activate' : 'deactivate',
                        'option': 'change'
                    };

                // trigger custom event
                // hint: use 'option' as fallback cause change:option may was triggered manually
                self.trigger('change:list-of-actives', mapping[attr || 'option'], model.id);
                self.facet.trigger('change:list-of-actives', mapping[attr || 'option'], model.id, model);
            });

            // custom value models
            this.valuemodels = {};
            POINT.invoke('customize', this, this.valuemodels);
        },

        _createModel: function (item, facet) {
            var Model = this.valuemodels[facet.get('id')] || BaseModel;
            return new Model({ data: item, facet: facet });
        },

        customAdd: function (list, facet) {
            var self = this;
            // ensure array
            list = [].concat(list);
            // add parent facet model
            _.each(list, function (item) {
                // do not add duplicates
                //TODO: check if model
                if (self.get(item.id)) return;

                // model = this._createModel(item, facet);

                // var Model = item.id === 'custom' ? self.getValueModel(facet.get('id')) : undefined;
                // var model = Model ? new Model({ data: item, facet: facet }) : new ValueModel({ data: item, facet: facet });
                self.add(
                    self._createModel(item, facet)
                );
                //self.add({ data: item, facet: facet });
            });
        },
        getActive: function () {
            return this.filter(function (value) {
                return value.get('active');
            });
        },

        getInactive: function () {
            return this.filter(function (value) {
                return !value.get('active');
            });
        }
    });

    return ValueCollection;
});
