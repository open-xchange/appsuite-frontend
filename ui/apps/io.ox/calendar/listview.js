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
