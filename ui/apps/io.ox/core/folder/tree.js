/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/folder/tree',
    ['io.ox/core/folder/view',
     'io.ox/core/folder/selection',
     'io.ox/core/api/account',
     'io.ox/core/extensions',
     'less!io.ox/core/folder/style'], function (FolderView, Selection, account, ext) {

    'use strict';

    var FolderTreeView = Backbone.View.extend({

        className: 'folder-tree bottom-toolbar abs',

        initialize: function (options) {

            options = _.extend({ contextmenu: false }, options);

            this.app = options.app;
            this.root = options.root;
            this.module = options.module;
            this.contextmenu = options.contextmenu;
            this.selection = new Selection(this);
            this.$el.attr({ role: 'tree', tabindex: '1' }).data('view', this);
        },

        filter: function (folder, model) {
            // only standard folder on top level
            if (folder === '1') {
                return account.isStandardFolder(model.id);
            }
            // other folders
            var module = model.get('module');
            return module === this.module || (module === 'mail' && (/^default\d+(\W|$)/i).test(model.id));
        },

        getFolderViewOptions: function (options, model) {
            if (model.get('id') === 'default0/INBOX') {
                options.subfolders = false;
            }
            return options;
        },

        render: function () {
            ext.point('io.ox/core/foldertree/' + this.module).invoke('draw', this.$el, this);
            return this;
        }
    });

    //
    // Top-level extensions
    // ------------------------------------------------------------------------------------------------------------
    //

    var INDEX = 100;

    ext.point('io.ox/core/foldertree/mail').extend(
        {
            id: 'headline',
            index: INDEX += 100,
            draw: function () {
                this.append(
                    // headline
                    $('<h2>').text('New folder tree')
                );
            }
        },
        {
            id: 'standard-folders',
            index: INDEX += 100,
            draw: function (tree) {
                this.append(
                    // standard folders
                    new FolderView({ folder: tree.root, headless: true, open: true, tree: tree, parent: tree })
                    .render().$el
                );
            }
        },
        {
            id: 'between',
            index: INDEX += 100,
            draw: function () {
                this.append(
                    // example
                    $('<section>').css('color', '#aaa').text('You can also place stuff between folders')
                );
            }
        },
        {
            id: 'local-folders',
            index: INDEX += 100,
            draw: function (tree) {
                this.append(
                    // local folders
                    new FolderView({
                        count: 0,
                        folder: 'virtual/folders', // convention! virtual folders are identified by their id starting with "virtual"
                        model_id: 'default0/INBOX',
                        parent: tree,
                        title: 'My folders',
                        tree: tree
                    })
                    .render().$el.css('margin-top', '14px')
                );
            }
        },
        {
            id: 'below',
            index: INDEX += 100,
            draw: function () {
                this.append(
                    // example
                    $('<section>').css('color', '#aaa').text('Or below of course')
                );
            }
        }
    );

    return FolderTreeView;
});
