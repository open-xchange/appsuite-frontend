/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */

define('io.ox/calendar/list/view-options', [
    'io.ox/core/extensions',
    'io.ox/core/folder/api',
    'gettext!io.ox/calendar'
], function (ext, folderAPI, gt) {

    'use strict';

    ext.point('io.ox/chronos/list-view/toolbar/top').extend({
        id: 'folder',
        index: 200,
        draw: function (baton) {
            if (_.device('smartphone')) return;

            var app = baton.app,
                view = baton.view,
                folderName,
                folderCount;

            function updateFolder() {
                var collection = view.listView.collection,
                    find = collection.cid ? collection.cid.indexOf('view=list') < 0 : false;
                folderAPI.get(app.folder.get()).then(function (folder) {
                    folderName.text(find ? gt('Results') : folder.title);
                });
                folderCount.text('(' + collection.length + ')');
            }

            this.append(
                $('<div class="folder-info">').append(
                    folderName = $('<span class="folder-name">'),
                    $.txt(' '),
                    folderCount = $('<span class="folder-count">')
                )
            );

            updateFolder();
            app.on('folder:change', updateFolder);
            view.listenTo(view.listView, 'reset add remove', _.debounce(updateFolder));
        }
    });

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
