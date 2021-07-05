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

define('io.ox/find/date/value-model', [
    'io.ox/find/manager/value-model'
], function (ValueModel) {

    'use strict';

    var DateValueModel = ValueModel.extend({

        type: 'valueDate',

        _base: function (name, args) {
            return DateValueModel.__super__[name].apply(this, args);
        },

        // update visibility
        _onChangeDateMatch: function (model, value) {
            if (value) this.get('facet').show();
        },

        // overwrite
        initialize: function (obj) {
            // super
            this._base('initialize', arguments);

            var data = obj.data;
            // custom values
            this.set({
                'date-match': data.match
            });
            // event listeners
            this.register();
        },

        register: function () {
            this.on('change:date-match', this._onChangeDateMatch);
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
