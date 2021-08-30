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

define('io.ox/calendar/listview', [
    'io.ox/core/extensions',
    'io.ox/core/util',
    'gettext!io.ox/calendar',
    'less!io.ox/calendar/style'
], function (ext, coreUtil, gt) {

    'use strict';

    // used for "old" mobile search result only

    function getTitle(baton, options) {
        options = options || {};
        var data = baton.data.event || baton.data,
            result = _.isUndefined(data.summary) ? gt('Private') : (data.summary || '\u00A0');

        if (options.parse) {
            result = coreUtil.urlify(result);
        }

        return result;
    }

    ext.point('io.ox/calendar/listview/item').extend({
        id: 'default',
        draw: function (baton) {
            var isSmall = false;
            ext.point('io.ox/calendar/listview/item/' + (isSmall ? 'small' : 'default')).invoke('draw', this, baton);
        }
    });

    /* default */

    ext.point('io.ox/calendar/listview/item/default').extend({
        id: 'row1',
        index: 100,
        draw: function (baton) {
            var row = $('<div class="list-item-row">');
            ext.point('io.ox/calendar/listview/item/default/row1').invoke('draw', row, baton);
            this.append(row);
        }
    });

    ext.point('io.ox/calendar/listview/item/default').extend({
        id: 'row2',
        index: 200,
        draw: function (baton) {
            var row = $('<div class="list-item-row">');
            ext.point('io.ox/calendar/listview/item/default/row2').invoke('draw', row, baton);
            this.append(row);
        }
    });

    ext.point('io.ox/calendar/listview/item/default/row1').extend({
        id: 'interval',
        index: 100,
        draw: function (baton) {
            var tmp = $('<div>');
            ext.point('io.ox/calendar/detail/date').invoke('draw', tmp, baton);
            this.append(
                $('<span class="interval">').append(tmp.find('.interval').html())
            );
        }
    });

    ext.point('io.ox/calendar/listview/item/default/row1').extend({
        id: 'title',
        index: 200,
        draw: function (baton) {
            this.append($('<div class="title">').text(getTitle(baton)));
        }
    });

    ext.point('io.ox/calendar/listview/item/default/row2').extend({
        id: 'location',
        index: 100,
        draw: function (baton) {
            this.append(
                $('<span class="location">').text(baton.data.location)
            );
        }
    });

    ext.point('io.ox/calendar/listview/item/default/row2').extend({
        id: 'day',
        index: 200,
        draw: function (baton) {
            var tmp = $('<div>');
            ext.point('io.ox/calendar/detail/date').invoke('draw', tmp, baton);
            this.append(
                $('<span class="day">').append(tmp.find('.day').html())
            );
        }
    });
});
