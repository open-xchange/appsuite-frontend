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
    'io.ox/find/date/extensions'
], function (FacetModel, ext) {

    'use strict';

    var DateFacetModel = FacetModel.extend({

        _base: function (name, args) {
            return DateFacetModel.__super__[name].apply(this, args);
        },

        // overwrite
        initialize: function (/*obj*/) {
            // super
            this._base('initialize', arguments);
        },

        // overwrite
        update: function (data) {
            var base = data.values[0],
                value = base.value.toLowerCase().trim(),
                matchers = this.getMatches(value);
            // empty
            data.values = [];
            // add for each match a snew value
            _.each(matchers, function (item) {
                var target = $.extend(true, {}, base);
                target.value = item.label;
                target.id = item.id;
                target.match = item;
                target.item.name =  item.label || target.item.name;
                target.item.detail =  item.detail || target.item.detail;
                data.values.push(target);
            });
            // show/hide
            if (matchers.length) this.show(); else this.hide();
            // call super update
            return this._base('update', [ data ]);
        },

        getMatches: function (value) {
            var format = moment.parseFormat(value),
                baton = ext.Baton.ensure({ data: { matched: [], value: value, format: format }, options: { limit: 3 } });

            // possible matchers add data to baton
            ext.point('io.ox/find/date/matchers').invoke('match', this, baton);

            return baton.data.matched;
        }

    });

    return DateFacetModel;
});
