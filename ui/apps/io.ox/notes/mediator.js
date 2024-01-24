/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/notes/mediator', [
    'io.ox/core/extensions',
    'io.ox/files/api',
    'io.ox/core/notifications',
    'io.ox/core/folder/node',
    'io.ox/core/folder/tree',
    'io.ox/core/folder/view',
    'io.ox/core/tk/list',
    'io.ox/core/api/collection-loader',
    'io.ox/notes/detail-view',
    'gettext!io.ox/notes',
    'settings!io.ox/notes',
    'io.ox/notes/toolbar'
], function (ext, api, notifications, TreeNodeView, TreeView, FolderView, ListView, CollectionLoader, DetailView, gt) {

    'use strict';

    return function (app) {

        app.mediator({

            'window': function (app) {

                app.getWindow().nodes.main.append(
                    app.left = $('<div class="leftside border-right">'),
                    app.right = $('<div class="rightside">')
                );
            },

            'folder-structure': function () {

                ext.point('io.ox/core/foldertree/notes/app').extend({
                    id: 'topics',
                    index: 100,
                    draw: function (tree) {
                        this.append(
                            new TreeNodeView({
                                filter: function () { return true; },
                                folder: tree.options.root,
                                headless: true,
                                open: true,
                                icons: true,
                                iconClass: 'sticky-note',
                                tree: tree,
                                parent: tree
                            })
                            .render().$el
                        );
                    }
                });
            },

            'folder-view': function (app) {
                // tree view
                var root = app.settings.get('folder/root');
                app.treeView = new TreeView({ app: app, icons: true, module: 'notes', contextmenu: true, root: root });
                FolderView.initialize({ app: app, tree: app.treeView });
                app.folderView.resize.enable();
            },

            'sidepanel': function (app) {

                ext.point('io.ox/notes/sidepanel').extend({
                    id: 'tree',
                    index: 100,
                    draw: function (baton) {
                        // add border & render tree and add to DOM
                        this.addClass('border-right').append(
                            $('<div class="section-header">').text(gt('Topics')),
                            baton.app.treeView.$el
                        );
                    }
                });

                var node = app.getWindow().nodes.sidepanel;
                ext.point('io.ox/notes/sidepanel').invoke('draw', node, ext.Baton({ app: app }));
            },

            'list-view': function (app) {

                var NotesListView = ListView.extend({
                    ref: 'io.ox/notes/listview'
                });

                ext.point('io.ox/notes/listview/item').extend(
                    {
                        id: 'last_modified',
                        index: 100,
                        draw: function (baton) {

                            var last_modified = moment(baton.data.last_modified),
                                isToday = last_modified.isSame(moment(), 'day'),
                                str = last_modified.format(isToday ? 'LT' : 'l');

                            this.append(
                                $('<span class="last_modified gray">').text(str)
                            );
                        }
                    },
                    {
                        id: 'title',
                        index: 200,
                        draw: function (baton) {
                            var title = String(baton.data.title).replace(/\.txt$/, '');
                            this.append(
                                $('<div class="title drag-title">').text(title)
                            );
                        }
                    },
                    {
                        id: 'note_preview',
                        index: 300,
                        draw: function (baton) {
                            var note_preview = baton.data.meta.note_preview || gt('Preview not available');
                            this.append(
                                $('<div class="preview gray">').text(note_preview)
                            );
                        }
                    }
                );

                app.listView = new NotesListView({ app: app, draggable: false, ignoreFocus: true });
                app.listView.model.set({ folder: app.folder.get() });
                app.listView.toggleCheckboxes(false);
                window.list = app.listView;

                app.left.append(app.listView.$el);
            },

            'auto-select': function (app) {

                app.listView.on('first-content', function () {
                    app.listView.selection.select(0);
                });
            },

            'connect-loader': function (app) {

                var collectionLoader = new CollectionLoader({
                    module: 'files',
                    getQueryParams: function (params) {
                        return {
                            action: 'all',
                            folder: params.folder,
                            columns: '1,2,3,5,20,23,108,700,702,703,704,705,707',
                            sort: params.sort || '5',
                            order: params.order || 'desc',
                            timezone: 'utc'
                        };
                    },
                    PRIMARY_PAGE_SIZE: 100,
                    SECONDARY_PAGE_SIZE: 200
                });

                collectionLoader.each = function (data) {
                    api.pool.add('detail', data);
                };

                app.listView.connect(collectionLoader);
            },

            'folder:change': function (app) {

                app.on('folder:change', function (id) {
                    // marker so the change:sort listener does not change other attributes (which would be wrong in that case)
                    app.changingFolders = true;
                    app.listView.model.set('folder', id);
                    app.folder.getData();
                    app.changingFolders = false;
                });
            },

            'selection': function (app) {

                var current_cid = null;

                app.showDetailView = function (cid) {
                    if (current_cid === cid) return;
                    this.right.empty().append(new DetailView({ cid: cid }).$el);
                    current_cid = cid;
                };

                app.showEmptyDetailView = function () {
                    this.right.empty();
                    current_cid = null;
                };

                var react = _.debounce(function (type, list) {
                    if (type === 'one' || type === 'action') {
                        app.showDetailView(list[0]);
                    } else {
                        app.showEmptyDetailView();
                    }
                }, 10);

                app.listView.on({
                    'selection:empty': function () {
                        react('empty');
                    },
                    'selection:one': function (list) {
                        react('one', list);
                    },
                    'selection:multiple': function (list) {
                        react('multiple', list);
                    },
                    'selection:action': function (list) {
                        if (list.length === 1) react('action', list);
                    }
                });
            },

            'refresh': function (app) {
                ox.on('refresh^', function () {
                    _.defer(function () { app.listView.reload(); });
                });
            }
        });

        app.mediate();
    };
});
