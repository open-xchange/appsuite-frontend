/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
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
