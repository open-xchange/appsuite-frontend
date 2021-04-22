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
 * @author David Bauer <david.bauer@open-xchange.com>
 */

define('io.ox/files/share/view-options', [
    'io.ox/core/extensions',
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/core/folder/breadcrumb',
    'io.ox/core/folder/api',
    'gettext!io.ox/files',
    'less!io.ox/files/share/style'
], function (ext, Dropdown, Breadcrumb, FolderAPI, gt) {

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

    ext.point('io.ox/files/share/myshares/list-view/toolbar/top').extend({
        id: 'dropdown',
        index: 1000,
        draw: function (baton) {

            var dropdown = new Dropdown({
                //#. Sort options drop-down
                label: gt.pgettext('dropdown', 'Sort by'),
                model: baton.app.mysharesListView.model,
                caret: true
            })
            .option('sort', 702, gt('Name'))
            .option('sort', 5, gt('Date'))
            .divider()
            .option('order', 'asc', gt('Ascending'))
            .option('order', 'desc', gt('Descending'));

            this.append(dropdown.render().$el.addClass('grid-options toolbar-item pull-right'));
        }
    });

    ext.point('io.ox/files/share/myshares/list-view/toolbar/top').extend({
        id: 'title',
        index: 300,
        draw: function (baton) {
            var node = this,
                breadcrumb = new Breadcrumb({ folder: 'virtual/myshares' });

            breadcrumb.handler = function (id) {
                baton.app.folderView.tree.selection.getItems().removeClass('selected');
                baton.app.folderView.tree.trigger('change', id);
            };

            FolderAPI.multiple(['9', 'virtual/myshares']).then(function success(path) {
                breadcrumb.$el.text('\xa0');
                breadcrumb.renderPath(path);
                node.append(breadcrumb.$el.addClass('toolbar-item'));
            });
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
                $('<a href="#" role="button" class="toolbar-item" data-action="open-folder-view">')
                .attr('title', gt('Open folder view'))
                .append($.icon('fa-angle-double-right', gt('Open folder view')))
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
