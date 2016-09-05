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

define('io.ox/notes/mediator', [
    'io.ox/core/extensions',
    'io.ox/files/api',
    'io.ox/core/notifications',
    'io.ox/core/folder/node',
    'io.ox/core/folder/tree',
    'io.ox/core/folder/view',
    'io.ox/core/tk/list',
    'io.ox/core/api/collection-loader',
    'settings!io.ox/notes'
], function (ext, api, notifications, TreeNodeView, TreeView, FolderView, ListView, CollectionLoader) {

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
                                icons: false,
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
                var root = app.settings.get('folder');
                app.treeView = new TreeView({ app: app, module: 'notes', contextmenu: true, root: root });
                FolderView.initialize({ app: app, tree: app.treeView });
                app.folderView.resize.enable();
            },

            'sidepanel': function (app) {

                ext.point('io.ox/notes/sidepanel').extend({
                    id: 'tree',
                    index: 100,
                    draw: function (baton) {
                        // add border & render tree and add to DOM
                        this.addClass('border-right').append(baton.app.treeView.$el);
                    }
                });

                var node = app.getWindow().nodes.sidepanel;
                ext.point('io.ox/notes/sidepanel').invoke('draw', node, ext.Baton({ app: app }));
            },

            'list-view': function (app) {

                var NotesListView = ListView.extend({
                    ref: 'io.ox/notes/listview'
                });

                ext.point('io.ox/notes/listview/item').extend({
                    id: 'default',
                    index: 100,
                    draw: function (baton) {
                        console.log('list item', baton.data);
                        this.append(
                            $('<div class="title">').text(baton.data.title)
                        );
                    }
                });

                app.listView = new NotesListView({ app: app, draggable: false, ignoreFocus: true });
                app.listView.model.set({ folder: app.folder.get() });
                app.listView.toggleCheckboxes(false);
                window.list = app.listView;

                app.left.append(app.listView.$el);
            },

            'connect-loader': function (app) {

                var collectionLoader = new CollectionLoader({
                    module: 'files',
                    getQueryParams: function (params) {
                        return {
                            action: 'all',
                            folder: params.folder,
                            columns: '1,2,3,5,20,23,108,700,702,703,704,705,707',
                            sort: params.sort || '702',
                            order: params.order || 'asc',
                            timezone: 'utc'
                        };
                    },
                    PRIMARY_PAGE_SIZE: 100,
                    SECONDARY_PAGE_SIZE: 200
                });

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

                app.showDetailView = function (cid) {

                    var obj = _.cid(cid);

                    var $el = $('<div class="abs note">').append(
                        $('<div class="abs note-title">').append($('<input type="text">')),
                        $('<div class="abs note-content scrollable" tabindex="0" contenteditable="true">')
                    );

                    $.when(
                        api.get(obj).fail(notifications.yell),
                        $.ajax({ type: 'GET', url: api.getUrl(obj, 'view') + '&' + _.now(), dataType: 'text' })
                    )
                    .done(function (data, text) {
                        $el.find('.note-title input').val(
                            String(data.title).replace(/\.txt$/i, '')
                        );
                        var lines = _.escape(text[0]).split(/\n/), openList;
                        lines = lines.map(function (line) {
                            var match = line.match(/^(\*|\-\s?\[(?:\s|x)\])\s?(.+)$/);
                            if (!match) {
                                if (openList) {
                                    openList = false;
                                    return '</ul>' + (line.length ? line + '\n' : '');
                                }
                                return line + '\n';
                            }
                            if (openList) return '<li>' + match[2] + '</li>';
                            openList = true;
                            return (/^\*/.test(line) ? '<ul>' : '<ul class="todo">') + '<li>' + match[2] + '</li>';
                        });
                        $el.find('.note-content').html(
                            lines.join('')
                                .replace(/\*(\S+)\*/g, '<b>$1</b>')
                                .replace(/(http\:\/\/\S+)/ig, '<a href="$1" target="_blank" rel="noopener">$1</a>')
                                .replace(/\n/g, '<br>')
                        );
                    });

                    this.right.empty().append($el);
                };

                app.showEmptyDetailView = function () {
                    this.right.empty();
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

                $(document).on('click', '.note-content li', function (e) {
                    if (e.offsetX < 0) $(this).toggleClass('checked');
                });
            }
        });

        app.mediate();
    };
});
