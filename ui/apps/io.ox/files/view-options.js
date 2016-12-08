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
    // Mark as secondary toolbar
    //

    ext.point('io.ox/files/listviewcontrol/list-view/toolbar/top').extend({
        id: 'secondary',
        index: 100,
        draw: function () {
            this.addClass('secondary-toolbar');
        }
    });

    //
    // View dropdown
    //

    ext.point('io.ox/files/view-options').extend({
        id: 'sort',
        index: 100,
        draw: function () {
            this.data('view')
                .option('sort', 702, gt('Name'), { radio: true })
                .option('sort', 5, gt('Date'), { radio: true })
                .option('sort', 704, gt('Size'), { radio: true });
        }
    });

    ext.point('io.ox/files/view-options').extend({
        id: 'order',
        index: 200,
        draw: function () {
            this.data('view')
                .divider()
                .option('order', 'asc', gt('Ascending'), { radio: true })
                .option('order', 'desc', gt('Descending'), { radio: true });
        }
    });

    ext.point('io.ox/files/listviewcontrol/list-view/toolbar/top').extend({
        id: 'dropdown-container',
        index: 900,
        draw: function (baton) {
            var dropdownContainer = $('<div class="dropdown-container pull-right">');
            ext.point('io.ox/files/listviewcontrol/list-view/toolbar/dropdowns').invoke('draw', dropdownContainer, baton);
            this.append(dropdownContainer);
        }
    });

    ext.point('io.ox/files/listviewcontrol/list-view/toolbar/dropdowns').extend({
        id: 'dropdown',
        index: 100,
        draw: function (baton) {

            var dropdown = new Dropdown({
                //#. Sort options drop-down
                label: gt.pgettext('dropdown', 'Sort by'),
                model: baton.app.props,
                caret: true
            });

            ext.point('io.ox/files/view-options').invoke('draw', dropdown.$el, baton);
            this.append(dropdown.render().$el.addClass('grid-options toolbar-item').on('dblclick', function (e) {
                e.stopPropagation();
            }));
        }
    });

    //
    // Select dropdown
    //

    function changeSelection(e) {

        e.preventDefault();

        var list = e.data.list,
            type = $(this).attr('data-name');

        // need to defer that otherwise the list cannot keep the focus
        _.defer(function () {
            if (type === 'all') {
                list.selection.selectAll();
            } else if (type === 'files') {
                list.selection.selectNone();
                list.selection.selectAll(':not(.file-type-folder)');
            } else if (type === 'none') {
                list.selection.selectNone();
            }
        });
    }

    ext.point('io.ox/files/select/options').extend({
        id: 'default',
        index: 100,
        draw: function (baton) {

            this.data('view')
                .header(gt('Select'))
                .link('all', gt('All'))
                .link('files', gt('All files'))
                .link('none', gt('None'))
                .divider()
                //#. Verb: (to) filter documents by file type
                .header(gt.pgettext('verb', 'Filter'))
                .option('filter', 'pdf', gt('PDFs'), { radio: true })
                .option('filter', 'doc', gt('Documents'), { radio: true })
                .option('filter', 'xls', gt('Spreadsheets'), { radio: true })
                .option('filter', 'ppt', gt('Presentations'), { radio: true })
                .option('filter', 'image', gt('Images'), { radio: true })
                .option('filter', 'audio', gt('Music'), { radio: true })
                .option('filter', 'video', gt('Videos'), { radio: true })
                .option('filter', 'none', gt('None'), { radio: true });

            this.data('view').$ul.on('click', 'a', { list: baton.app.listView }, changeSelection);
        }
    });

    ext.point('io.ox/files/listviewcontrol/list-view/toolbar/dropdowns').extend({
        id: 'select',
        index: 200,
        draw: function (baton) {
            if (_.device('smartphone')) return;

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

    ext.point('io.ox/files/listviewcontrol/list-view/toolbar/top').extend({
        id: 'move-up',
        index: 2100,
        draw: function (baton) {
            if (_.device('!smartphone')) return;

            this.append(
                $('<div class="grid-options toolbar-item pull-left" >').append(
                    $('<a href="#" role="button">').append(
                        $('<span class="folder-up fa-stack">').append(
                            $('<i class="fa fa-folder fa-stack-2x">'),
                            $('<i class="fa fa-level-up fa-stack-1x fa-inverse">')
                        )
                    ).attr({
                        'aria-label': gt('Switch to parent folder')
                    }).on('click', function (e) {
                        e.preventDefault();

                        var app = baton.app,
                            folder = app.folder;

                        folder.getData().done(function (data) {
                            if (data.folder_id === '9') {
                                app.pages.goBack();
                            } else {
                                folder.set(data.folder_id);
                            }
                        });
                    })
                )
            );
        }
    });

    //
    // Breadcrumb
    //

    ext.point('io.ox/files/listviewcontrol/list-view/toolbar/top').extend({
        id: 'breadcrumb',
        index: 300,
        draw: function (baton) {

            if (_.device('smartphone')) return;

            var view = new BreadcrumbView({ app: baton.app, rootAlwaysVisible: true }).render().$el.addClass('toolbar-item'),
                results = $('<div class="toolbar-item">').text(gt('Search results')).hide();

            this.append(view, results);

            baton.app.props.on('change:find-result', function (model, value) {
                view.toggle(!value);
                results.toggle(value);
            });
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

    ext.point('io.ox/files/listviewcontrol/list-view/toolbar/bottom').extend({
        id: 'toggle-folderview',
        index: 200,
        draw: function (baton) {

            this.append(
                $('<a href="#" role="button" class="toolbar-item">').attr('aria-label', gt('Open folder view')).append(
                    $('<i class="fa fa-angle-double-right" aria-hidden="true">').attr('title', gt('Open folder view'))
                ).on('click', { app: baton.app, state: true }, toggleFolderView)
            );

            baton.app.on({
                'folderview:open': onFolderViewOpen.bind(null, baton.app),
                'folderview:close': onFolderViewClose.bind(null, baton.app)
            });

            if (baton.app.folderViewIsVisible()) _.defer(onFolderViewOpen, baton.app);
        }
    });

    ext.point('io.ox/files/sidepanel').extend({
        id: 'toggle-folderview',
        index: 1000,
        draw: function (baton) {
            this.addClass('bottom-toolbar').append(
                $('<div class="generic-toolbar bottom visual-focus">').append(
                    $('<a href="#" role="button" class="toolbar-item" data-action="close-folder-view">').attr('aria-label', gt('Close folder view')).append(
                        $('<i class="fa fa-angle-double-left" aria-hidden="true">').attr('title', gt('Close folder view'))
                    ).on('click', { app: baton.app, state: false }, toggleFolderView)
                )
            );
        }
    });
});
