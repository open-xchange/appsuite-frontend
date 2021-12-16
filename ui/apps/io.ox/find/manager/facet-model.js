/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
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

define('io.ox/find/manager/facet-model', [
    'io.ox/find/manager/value-collection'
], function (ValueCollection) {

    'use strict';

    // array of strings to hash
    function toHash(list) {
        var tmp = {};
        list.forEach(function (id) {
            tmp[id] = true;
        });
        return tmp;
    }

    var FacetModel = Backbone.Model.extend({

        type: 'facetBase',

        initialize: function (data) {
            var values = new ValueCollection([], {}, { facet: this });

            this.set({
                id: data.cid,
                style: data.style,
                data: _.copy(data, true),
                values: values,
                type: 'facet'
            });

            // use flags hash
            this.flags = toHash(this.get('data').flags);

            // add value models to collection
            // TODO: may wrap add function of ValueCollection
            values.customAdd(data.values || data, this);
        },

        is: function (flag) {
            return this.flags[flag];
        },

        getType: function () {
            return this.get('style');
        },

        isType: function (value) {
            var list = [].concat(value),
                type = this.get('style');
            return !!(_.filter(list, function (current) {
                return type === current;
            }).length);
        },

        hide: function () {
            this.flags.hidden = true;
        },

        show: function () {
            delete this.flags.hidden;
        },

        isId: function (value) {
            var list = [].concat(value),
                type = this.get('id');
            return !!(_.filter(list, function (current) {
                return type === current;
            }).length);
        },

        getConflicting: function () {
            // hint: f.e. 'folder-type' for 'folder'
            var list = [];
            _.each(this.get('data').flags, function (flag) {
                if (flag.indexOf('conflicts:') === 0) {
                    list.push(flag.split(':')[1]);
                }
            });
            return list;
        },

        hasPersons: function () {
            return this.isId(['contacts', 'contact', 'participant', 'task_participants']);
        },

        getOriginalId: function () {
            return this.get('data').id;
        },

        getName: function () {
            return this.get('name');
        },

        // merges values
        update: function (data) {
            var inactive = this.getInactive(),
                values = this.get('values');
            values.remove(inactive);
            // server filters already active values so we simply add
            values.customAdd(data.values || data, this);
        },

        getValue: function (id) {
            var values = this.get('values');
            // retrun first value when no id is specified
            if (!id) return values.at(0);

            return values.get(id);
        },

        // get active values
        getActive: function () {
            return this.get('values').filter(function (value) {
                return value.isActive();
            });
        },

        getInactive: function () {
            return this.get('values').filter(function (value) {
                return !value.isActive();
            });
        }

    });

    return FacetModel;
});
