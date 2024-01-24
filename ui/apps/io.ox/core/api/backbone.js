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

define('io.ox/core/api/backbone', [], function () {

    'use strict';

    // basic model with custom cid
    var Model = Backbone.Model.extend({
        idAttribute: 'cid',
        initialize: function () {
            this.cid = this.attributes.cid = _.cid(this.attributes);
            this.on('change:id', this.updateCID.bind(this));
        },
        updateCID: function () {
            this.set('cid', this.cid = _.cid(this.attributes));
        },
        toString: function () {
            // just helps debugging
            return 'Model(' + this.cid + ')';
        }
    });

    // collection using custom models
    var Collection = Backbone.Collection.extend({
        comparator: 'index',
        model: Model,
        parse: function (array) {
            if (!_.isArray(array)) array = [array];
            var Model = this.model;
            return _(array).map(function (item) {
                return item instanceof Model ? item : new Model(item);
            });
        }
    });

    return {
        Model: Model,
        Collection: Collection
    };
});
