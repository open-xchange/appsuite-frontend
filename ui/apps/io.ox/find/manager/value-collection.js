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
            this.facet = extra.facet;

            // custom event mapping
            this.on('change:active change:option', function (model) {
                // use 'active' when simultaneously
                var attr = Object.keys(model.changed)[0],
                    mapping = {
                        'active': model.changed.active ? 'activate' : 'deactivate',
                        'option': 'change'
                    };

                // trigger custom event
                // hint: use 'option' as fallback cause change:option may was triggered manually
                this.trigger('change:list-of-actives', mapping[attr || 'option'], model.id);
                this.facet.trigger('change:list-of-actives', mapping[attr || 'option'], model.id, model);
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
