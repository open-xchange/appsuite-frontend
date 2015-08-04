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
 * @author David Bauer <david.bauer@open-xchange.com>
 */

 define('io.ox/files/share/view-options', [
    'io.ox/core/extensions',
    'io.ox/backbone/mini-views/dropdown',
    'gettext!io.ox/files',
    'less!io.ox/files/share/style'
], function (ext, Dropdown, gt) {

    'use strict';

    //
    // Mark as secondary toolbar
    //

    ext.point('io.ox/files/share/myshares/list-view/toolbar/top').extend({
        id: 'secondary',
        index: 100,
        draw: function () {
            this.addClass('secondary-toolbar');
        }
    });

    //
    // View dropdown
    //

    ext.point('io.ox/files/share/myshares/view-options').extend({
        id: 'sort',
        index: 100,
        draw: function () {
            this.data('view')
                .option('sort', 702, gt('Name'))
                .option('sort',   5, gt('Date'))
                .option('sort', 704, gt('Size'));
        }
    });

    ext.point('io.ox/files/share/myshares/view-options').extend({
        id: 'order',
        index: 200,
        draw: function () {
            this.data('view')
                .divider()
                .option('order', 'asc', gt('Ascending'))
                .option('order', 'desc', gt('Descending'));
        }
    });

    ext.point('io.ox/files/share/myshares/list-view/toolbar/top').extend({
        id: 'dropdown',
        index: 1000,
        draw: function (baton) {

            var dropdown = new Dropdown({
                //#. Sort options drop-down
                label: gt.pgettext('dropdown', 'Sort by'),
                model: baton.model,
                caret: true
            });

            ext.point('io.ox/files/share/myshares/view-options').invoke('draw', dropdown.$el, baton);
            this.append(dropdown.render().$el.addClass('grid-options toolbar-item pull-right').on('dblclick', function (e) {
                e.stopPropagation();
            }));
        }
    });

    ext.point('io.ox/files/share/myshares/list-view/toolbar/top').extend({
        id: 'title',
        index: 300,
        draw: function () {
            var item = $('<div class="toolbar-item breadcrumb-tail">').text(gt('My shares'));
            this.append(item);
        }
    });

    function toggleFolderView(e) {
        e.preventDefault();
        e.data.app.folderView.toggle(e.data.state);
    }

    function onFolderViewOpen() {
        $('.myshares-list').parent().removeClass('toolbar-bottom-visible');
    }

    function onFolderViewClose() {
        $('.myshares-list').parent().addClass('toolbar-bottom-visible');
    }

    ext.point('io.ox/files/share/myshares/list-view/toolbar/bottom').extend({
        id: 'toggle-folderview',
        index: 200,
        draw: function (baton) {
            this.append(
                $('<a href="#" class="toolbar-item" tabindex="1">')
                .attr('title', gt('Open folder view'))
                .append($('<i class="fa fa-angle-double-right">'))
                .on('click', { app: baton.app, state: true }, toggleFolderView)
            );

            baton.app.on({
                'folderview:open': onFolderViewOpen.bind(null, baton.app),
                'folderview:close': onFolderViewClose.bind(null, baton.app)
            });

            if (baton.app.folderViewIsVisible()) _.defer(onFolderViewOpen, baton.app);
        }
    });

});
