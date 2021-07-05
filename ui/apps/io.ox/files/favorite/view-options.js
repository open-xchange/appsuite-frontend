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

define('io.ox/files/favorite/view-options', [
    'io.ox/core/extensions',
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/core/folder/breadcrumb',
    'io.ox/core/folder/api',
    'gettext!io.ox/core',
    'less!io.ox/files/favorite/style'
], function (ext, Dropdown, Breadcrumb, FolderAPI, gt) {

    'use strict';

    //
    // Mark as secondary toolbar
    //

    ext.point('io.ox/files/favorite/myfavorites/list-view/toolbar/top').extend({
        id: 'secondary',
        index: 100,
        draw: function () {
            this.addClass('secondary-toolbar');
        }
    });

    ext.point('io.ox/files/favorite/myfavorites/list-view/toolbar/top').extend({
        id: 'dropdown',
        index: 1000,
        draw: function (baton) {

            var dropdown = new Dropdown({
                //#. Sort options drop-down
                label: gt.pgettext('dropdown', 'Sort by'),
                model: baton.app.myFavoriteListView.model,
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

    ext.point('io.ox/files/favorite/myfavorites/list-view/toolbar/top').extend({
        id: 'title',
        index: 300,
        draw: function (baton) {
            var node = this,
                breadcrumb = new Breadcrumb({ folder: 'virtual/favorites/infostore' });

            breadcrumb.handler = function (id) {
                baton.app.folderView.tree.selection.getItems().removeClass('selected');
                baton.app.folderView.tree.trigger('change', id);
            };

            FolderAPI.multiple(['9', 'virtual/favorites/infostore']).then(function success(path) {
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
        $('.myfavorites-list').parent().removeClass('toolbar-bottom-visible');
    }

    function onFolderViewClose() {
        $('.myfavorites-list').parent().addClass('toolbar-bottom-visible');
    }

    ext.point('io.ox/files/favorite/myfavorites/list-view/toolbar/bottom').extend({
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
