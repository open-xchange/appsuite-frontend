/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 *  2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/files/view-options', [
    'io.ox/core/extensions',
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/core/folder/breadcrumb',
    'gettext!io.ox/files'
], function (ext, Dropdown, BreadcrumbView, gt) {

    'use strict';

    //
    // View dropdown
    //

    ext.point('io.ox/files/view-options').extend({
        id: 'sort',
        index: 100,
        draw: function () {
            this.data('view')
                .option('sort', 702, gt('Name'))
                .option('sort',   5, gt('Date'))
                .option('sort', 704, gt('Size'));
        }
    });

    ext.point('io.ox/files/view-options').extend({
        id: 'order',
        index: 200,
        draw: function () {
            this.data('view')
                .divider()
                .option('order', 'asc', gt('Ascending'))
                .option('order', 'desc', gt('Descending'));
        }
    });

    ext.point('io.ox/files/list-view/toolbar/top').extend({
        id: 'dropdown',
        index: 1000,
        draw: function (baton) {

            var dropdown = new Dropdown({
                //#. Sort options drop-down
                label: gt.pgettext('dropdown', 'Sort by'),
                model: baton.app.props,
                caret: true
            });

            ext.point('io.ox/files/view-options').invoke('draw', dropdown.$el, baton);
            this.append(dropdown.render().$el.addClass('grid-options toolbar-item pull-right').on('dblclick', function (e) {
                e.stopPropagation();
            }));
        }
    });

    //
    // Select dropdown
    //

    function changeSelection(e) {

        e.preventDefault();

        var selection = e.data.selection,
            type = $(this).attr('data-name');

        // need to defer that otherwise the list cannot keep the focus
        _.defer(function () {
            if (type === 'all') {
                selection.selectAll();
            } else {
                // clear selection first
                selection.selectNone();
                // select by type
                if (type !== 'none') selection.selectAll('.file-type-' + type);
            }
        });
    }

    ext.point('io.ox/files/select/options').extend({
        id: 'default',
        index: 100,
        draw: function (baton) {

            this.data('view')
                .link('all', gt('All'))
                .link('none', gt('None'))
                .divider()
                .link('pdf', gt('PDFs'))
                .link('doc', gt('Documents'))
                .link('xls', gt('Spreadsheets'))
                .link('ppt', gt('Presentations'))
                .divider()
                .link('image', gt('Images'))
                .link('audio', gt('Music'))
                .link('video', gt('Videos'));

            this.data('view').$ul.on('click', 'a', { selection: baton.app.listView.selection }, changeSelection);
        }
    });

    ext.point('io.ox/files/list-view/toolbar/top').extend({
        id: 'select',
        index: 2000,
        draw: function (baton) {

            var dropdown = new Dropdown({
                //#. Sort options drop-down
                label: gt.pgettext('dropdown', 'Select'),
                model: baton.app.props,
                caret: true
            });

            ext.point('io.ox/files/select/options').invoke('draw', dropdown.$el, baton);

            this.append(
                dropdown.render().$el.addClass('grid-options toolbar-item pull-right')
            );
        }
    });

    //
    // Breadcrumb
    //

    ext.point('io.ox/files/list-view/toolbar/top').extend({
        id: 'breadcrumb',
        index: 300,
        draw: function (baton) {
            this.append(
                new BreadcrumbView({ app: baton.app }).render().$el.addClass('toolbar-item')
            );
        }
    });

    //
    // Folder view toggle
    //

    function toggleFolderView(e) {
        e.preventDefault();
        e.data.app.folderView.toggle(e.data.state);
    }

    function onFolderViewOpen(app) {
        app.getWindow().nodes.main.find('.list-view-control')
            .removeClass('toolbar-bottom-visible');
    }

    function onFolderViewClose(app) {
        app.getWindow().nodes.main.find('.list-view-control')
            .addClass('toolbar-bottom-visible');
    }

    ext.point('io.ox/files/list-view/toolbar/bottom').extend({
        id: 'toggle-folderview',
        index: 100,
        draw: function (baton) {

            this.append(
                $('<a href="#" class="toolbar-item" tabindex="1">')
                .attr('title', gt('Open folder view'))
                .append($('<i class="fa fa-angle-double-right">'))
                .on('click', { app: baton.app, state: true }, toggleFolderView)
            );

            var side = baton.app.getWindow().nodes.sidepanel;

            side.addClass('bottom-toolbar');
            side.append(
                $('<div class="generic-toolbar bottom visual-focus">').append(
                    $('<a href="#" class="toolbar-item" role="button" tabindex="1">')
                    .append(
                        $('<i class="fa fa-angle-double-left" aria-hidden="true">'),
                        $('<span class="sr-only">').text(gt('Close folder view'))
                    )
                    .on('click', { app: baton.app, state: false }, toggleFolderView)
                )
            );

            baton.app.on({
                'folderview:open': onFolderViewOpen.bind(null, baton.app),
                'folderview:close': onFolderViewClose.bind(null, baton.app)
            });

            if (baton.app.folderViewIsVisible()) _.defer(onFolderViewOpen, baton.app);
        }
    });
});
