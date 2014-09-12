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

define('io.ox/files/listview', [
    'io.ox/files/common-extensions',
    'io.ox/core/extensions',
    'less!io.ox/files/style'
], function (extensions, ext) {

    'use strict';

    ext.point('io.ox/files/listview/item').extend({
        id: 'default',
        draw: function (baton) {
            var isSmall = false;
            ext.point('io.ox/files/listview/item/' + (isSmall ? 'small' : 'default')).invoke('draw', this, baton);
        }
    });

    /* default */

    ext.point('io.ox/files/listview/item/default').extend({
        id: 'row1',
        index: 100,
        draw: function (baton) {
            var row = $('<div class="list-item-row">');
            ext.point('io.ox/files/listview/item/default/row1').invoke('draw', row, baton);
            this.append(row);
        }
    });

    ext.point('io.ox/files/listview/item/default/row1').extend({
        id: 'locked',
        index: 100,
        draw: extensions.locked
    });

    ext.point('io.ox/files/listview/item/default/row1').extend({
        id: 'filename',
        index: 200,
        draw: extensions.filename
    });

    //ROW2

    ext.point('io.ox/files/listview/item/default').extend({
        id: 'row2',
        index: 200,
        draw: function (baton) {
            var row = $('<div class="list-item-row">');
            ext.point('io.ox/files/listview/item/default/row2').invoke('draw', row, baton);
            this.append(row);
        }
    });

    ext.point('io.ox/files/listview/item/default/row2').extend({
        id: 'date',
        index: 100,
        draw: extensions.compactdate
    });

    ext.point('io.ox/files/listview/item/default/row2').extend({
        id: 'size',
        index: 200,
        draw: extensions.size
    });

});
