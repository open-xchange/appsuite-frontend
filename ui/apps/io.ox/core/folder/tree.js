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
     'less!io.ox/core/folder/style'], function (FolderView, Selection, account) {

    'use strict';

    var FolderTreeView = Backbone.View.extend({

        className: 'folder-tree bottom-toolbar abs',

        initialize: function (options) {
            this.root = options.root;
            this.module = options.module;
            this.selection = new Selection(this);
            this.$el.attr({ role: 'tree', tabindex: '1' });
            this.$el.data('view', this);
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

            this.$el.append(
                // headline
                $('<h2>').text('New folder tree'),
                // standard folders
                new FolderView({ folder: this.root, headless: true, open: true, tree: this, parent: this })
                    .render().$el,
                // example
                $('<section>').css('color', '#aaa').text('You can also place stuff in between folders'),
                // local folders
                new FolderView({
                    folder: 'virtual/folders', // convention! virtual folders are identified by their id starting with "virtual"
                    model_id: 'default0/INBOX',
                    parent: this,
                    title: 'My folders',
                    tree: this
                })
                .render().$el.css('margin-top', '14px'),
                // example
                $('<section>').css('color', '#aaa').text('Or below of course')
            );
            return this;
        }
    });

    return FolderTreeView;
});
