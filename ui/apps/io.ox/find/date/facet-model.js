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
                target.item.name =  item.label || target.item.name;
                target.item.detail =  item.detail || target.item.detail;
                data.values.push(target);
            });
        },

        update: function (data) {
            this.prepare(data);
            if (data.values.length) this.show(); else this.hide();
            return this._base('update', [ data ]);
        }

    });

    return DateFacetModel;
});
