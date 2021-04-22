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
                .append($.icon('fa-angle-double-right', gt('Open folder view')))
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
