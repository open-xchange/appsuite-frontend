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

define('io.ox/tasks/listview', [
    'io.ox/core/extensions',
    'io.ox/mail/util',
    'gettext!io.ox/tasks',
    'less!io.ox/tasks/style'
], function (ext, mailUtil, gt) {

    'use strict';

    // used for "old" mobile search result only

    ext.point('io.ox/tasks/listview/item').extend({
        id: 'default',
        draw: function (baton) {
            ext.point('io.ox/tasks/listview/item/default').invoke('draw', this, baton);
        }
    });

    ext.point('io.ox/tasks/listview/item/default').extend({
        id: 'row1',
        index: 100,
        draw: function (baton) {
            var row = $('<div class="list-item-row">');
            ext.point('io.ox/tasks/listview/item/default/row1').invoke('draw', row, baton);
            this.append(row);
        }
    });

    ext.point('io.ox/tasks/listview/item/default').extend({
        id: 'row2',
        index: 200,
        draw: function (baton) {
            var row = $('<div class="list-item-row">');
            ext.point('io.ox/tasks/listview/item/default/row2').invoke('draw', row, baton);
            this.append(row);
        }
    });

    ext.point('io.ox/tasks/listview/item/default/row1').extend({
        id: 'date',
        index: 100,
        draw: function (baton) {
            var data = baton.data, t = data.end_time || data.start_time || data.last_modified;
            if (!_.isNumber(t)) return;
            this.append(
                $('<time class="date">')
                .attr('datetime', moment(t).toISOString())
                .text(mailUtil.getDateTime(t, { fulldate: false, smart: false }))
            );
        }
    });

    ext.point('io.ox/tasks/listview/item/default/row1').extend({
        id: 'title',
        index: 200,
        draw: function (baton) {
            this.append(
                $('<div class="title">').text(
                    baton.data.title
                )
            );
        }
    });

    ext.point('io.ox/tasks/listview/item/default/row2').extend({
        id: 'progress',
        index: 100,
        draw: function (baton) {
            this.append(
                $('<div class="prog">').append(
                    gt('Progress') + ': ' + (baton.data.percent_completed || 0) + '%'
                )
            );
        }
    });
});
