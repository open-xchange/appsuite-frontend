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

define('io.ox/calendar/list/view-options', [
    'io.ox/core/extensions',
    'io.ox/core/folder/api',
    'gettext!io.ox/calendar'
], function (ext, folderAPI, gt) {

    'use strict';

    function onFolderViewOpen(app) {
        app.getWindow().nodes.sidepanel.show();
        app.listControl.$el.removeClass('toolbar-bottom-visible');
        // for perspectives other than list
        app.getWindow().nodes.body.removeClass('bottom-toolbar-visible');
    }

    function onFolderViewClose(app) {
        // hide sidepanel so invisible objects are not tabbable
        app.getWindow().nodes.sidepanel.hide();
        app.listControl.$el.addClass('toolbar-bottom-visible');
        // for perspectives other than list
        app.getWindow().nodes.body.addClass('bottom-toolbar-visible');
    }

    // create extension point for second toolbar
    ext.point('io.ox/chronos/list-view/toolbar/bottom').extend({
        id: 'toggle-folderview',
        index: 100,
        draw: function (baton) {
            if (_.device('smartphone')) return;

            var app = baton.app;
            this.addClass('visual-focus').append(
                $('<a href="#" class="toolbar-item" data-action="open-folder-view">')
                .attr('aria-label', gt('Open folder view'))
                .append($('<i class="fa fa-angle-double-right" aria-hidden="true">').attr('title', gt('Open folder view')))
                .on('click', { state: true }, app.toggleFolderView)
            );

            app.on({
                'folderview:open': onFolderViewOpen.bind(null, app),
                'folderview:close': onFolderViewClose.bind(null, app)
            });

            onFolderViewClose(app);
            if (app.folderViewIsVisible()) _.defer(onFolderViewOpen, app);
        }
    });

});
