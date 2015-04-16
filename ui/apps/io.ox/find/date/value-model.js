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

define('io.ox/find/date/value-model', [
    'io.ox/find/manager/value-model',
    'gettext!io.ox/find',
    'io.ox/core/extensions',
    'io.ox/find/date/extensions'
], function (ValueModel, gt, ext) {

    'use strict';

    var DateValueModel = ValueModel.extend({

        _base: function (name, args) {
            return DateValueModel.__super__[name].apply(this, args);
        },

        // update visibility
        _onChangeDateMatch: function (model, value) {
            if (value) this.get('facet').show();
        },

        // overwrite
        initialize: function (/*obj*/) {
            // super
            this._base('initialize', arguments);
            // custom values
            this.set({
                'date-input': this.get('data').value
            });
            // event listeners
            this.register();
            // clean input
            var value = this.get('date-input').toLowerCase().trim();
            this.set('date-value', value);
            // update
            this.process();
        },

        register: function () {
            this.on('change:date-match', this._onChangeDateMatch);
        },

        process: function () {
            var value = this.get('date-value'),
                format = moment.parseFormat(value),
                baton = ext.Baton.ensure({ data: { matched: [], value: value, format: format }, options: { limit: 1 } });

            // possible matchers add data to baton
            ext.point('io.ox/find/date/matchers').invoke('match', this, baton);

            var item = baton.data.matched[0];

            // hide facet
            if (!item) return this.get('facet').hide();

            this.set({
                'name': item.label || this.get('name'),
                'detail': item.detail || this.get('detail'),
                'date-match': item
            });
            return item;
        },

        asDates: function () {
            return _.extend({}, this.get('date-match'));
        },

        asString: function () {
            var data = _.extend({
                    start: moment(0),
                    end: moment()
                }, this.asDates() || {}),
                unixStart = data.start.startOf('day').valueOf(),
                unixEnd = data.end.endOf('day').valueOf();

            return '[' + unixStart + ' TO ' + unixEnd + ']';
        },

        // overwrite
        getRequest: function () {
            if (!this.isActive()) return;
            return {
                facet: 'date',
                value: this.asString(),
                filter: null
            };
        }
    });

    return DateValueModel;
});
