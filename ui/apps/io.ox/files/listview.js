/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/files/listview', [
    'io.ox/core/tk/list',
    'io.ox/core/extensions',
    'io.ox/files/common-extensions',
    'io.ox/files/view-options',
    'less!io.ox/files/style'
], function (ListView, ext, extensions) {

    'use strict';

    var LISTVIEW = 'io.ox/files/listview', ITEM = LISTVIEW + '/item';

    //
    // Extend ListView
    //

    var FileListView = ListView.extend({
        ref: LISTVIEW,
        initialize: function () {
            ListView.prototype.initialize.apply(this, arguments);
            this.$el.addClass('file-list-view');
        }
    });

    //
    // Extensions
    //

    ext.point(ITEM).extend(
        {
            id: 'default',
            index: 100,
            draw: function (baton) {
                var layout = (baton.app && baton.app.props.get('layout')) || 'list';
                this.closest('.list-item').toggleClass('column-layout', layout === 'list');
                ext.point(ITEM + '/' + layout).invoke('draw', this, baton);
            }
        }
    );

    // list layout

    ext.point(ITEM + '/list').extend(
        {
            id: 'col1',
            index: 100,
            draw: function (baton) {
                var column = $('<div class="list-item-column column-1">');
                extensions.filename.call(column, baton);
                this.append(column);
            }
        },
        {
            id: 'col2',
            index: 200,
            draw: function (baton) {
                var column = $('<div class="list-item-column column-2 gray">');
                extensions.smartdate.call(column, baton);
                this.append(column);
            }
        },
        {
            id: 'col3',
            index: 300,
            draw: function (baton) {
                var column = $('<div class="list-item-column column-3 gray">');
                extensions.size.call(column, baton);
                this.append(column);
            }
        }
    );

    // icon layout

    ext.point(ITEM + '/icon').extend(
        {
            id: 'default',
            index: 100,
            draw: function () {
                this.append('<b>Hallo</b> Welt (icon)');
            }
        }
    );

    // tile layout

    ext.point(ITEM + '/tile').extend(
        {
            id: 'default',
            index: 100,
            draw: function () {
                this.append('<b>Hallo</b> Welt (tile)');
            }
        }
    );

    return FileListView;
});
