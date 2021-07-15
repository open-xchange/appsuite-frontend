/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define('io.ox/find/date/facet-model', [
    'io.ox/find/manager/facet-model',
    'io.ox/core/extensions',
    'io.ox/find/date/patterns'
], function (FacetModel, ext, patterns) {

    'use strict';

    var DateFacetModel = FacetModel.extend({

        type: 'facetDate',

        _base: function (name, args) {
            return DateFacetModel.__super__[name].apply(this, args);
        },

        // overwrite
        initialize: function (data) {
            this.prepare(data);
            // super
            this._base('initialize', arguments);
        },

        // overwrite
        prepare: function (data) {
            var values = data.values || data,
                base = values[0],
                value = base.value.toLowerCase().trim(),
                matches = patterns.getMatches(value);
            // empty
            data.values = [];
            // add for each match a snew value
            _.each(matches, function (item) {
                var target = $.extend(true, {}, base);
                target.value = item.label;
                target.id = item.id;
                target.match = item;
                target.item.name = item.label || target.item.name;
                target.item.detail = item.detail || target.item.detail;
                data.values.push(target);
            });
        },

        update: function (data) {
            this.prepare(data);
            if (data.values.length) this.show(); else this.hide();
            return this._base('update', [data]);
        }

    });

    return DateFacetModel;
});
