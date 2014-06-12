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

define('io.ox/core/folder/view', ['io.ox/core/folder/api'], function (api) {

    'use strict';

    var ICON = 'caret'; // angle caret chevron

    var FolderView = Backbone.View.extend({

        tagName: 'li',
        className: 'folder',

        events: {
            'click .folder-arrow': 'onToggle',
            'keydown': 'onKeydown'
        },

        onReset: function () {
            this.$subfolders
                .empty()
                .append(
                    this.collection
                    .chain()
                    .filter(this.tree.filter, this.tree)
                    .map(this.getFolderView, this)
                    .value()
                )
                .show();
        },

        onAdd: function (model) {
            this.$subfolders.append(this.getFolderView(model));
        },

        onRemove: function (model) {

            var nodes = this.$subfolders.children(),
                node = nodes.filter('[data-id="' + $.escape(model.id) + '"]');

            node.remove();
        },

        // re-render on any attribute change
        onChange: function () {
            this.render();
        },

        // open/close folder
        onToggle: function (e) {
            if (e.isDefaultPrevented()) return;
            e.preventDefault();
            this.open = !this.open;
            this.onChangeSubFolders();
        },

        // respond to new sub-folders
        onChangeSubFolders: function () {
            // has subfolders?
            var hasSubFolders = this.model.get('subfolders') === true, isOpen = this.open;
            // update arrow
            this.$arrow.html(
                hasSubFolders ?
                    (isOpen ? '<i class="fa fa-' + ICON + '-down">' : '<i class="fa fa-' + ICON + '-right">') :
                    '<i class="fa fa-fw">'
            );
            // toggle subfolder node
            this.$subfolders.toggle(isOpen);
            // fetch sub-folders
            if (hasSubFolders && isOpen) api.list(this.folder);
        },

        // respond to cursor left/right
        onKeydown: function (e) {
            // already processed?
            if (e.isDefaultPrevented()) return; else e.preventDefault();
            // skip unless folder has subfolders
            if (!this.model.get('subfolders')) return;
            // cursor right?
            if (e.which === 39 && !this.open) {
                this.open = true;
                this.onChangeSubFolders();
            }
            // cursor left?
            else if (e.which === 37 && this.open) {
                this.open = false;
                this.onChangeSubFolders();
            }
        },

        // get a new FolderView instance
        getFolderView: function (model) {
            var level = this.headless ? this.level : this.level + 1;
            return new FolderView({ folder: model.id, level: level, tree: this.tree }).render().$el;
        },

        initialize: function (options) {

            this.folder = options.folder;
            this.level = options.level || 0;
            this.open = !!options.open;
            this.tree = options.tree;
            this.model = api.pool.getFolderModel(this.folder);
            this.collection = api.pool.getSubFolderCollection(this.folder);
            this.headless = !!options.headless;

            // collection changes
            this.listenTo(this.collection, {
                'reset'  : this.onReset,
                'add'    : this.onAdd,
                'remove' : this.onRemove
            });

            // model changes
            this.listenTo(this.model, {
                'change': this.onChange,
                'change:subfolders': this.onChangeSubFolders
            });

            // nodes
            this.$label = $();
            this.$arrow = $();

            // draw scaffold
            this.$el
                .attr({ role: 'treeitem' })
                .append(
                    // folder
                    $('<div class="selectable" tabindex="-1">')
                    .attr('data-id', this.folder)
                    .css('padding-left', this.level * 30)
                    .append(
                        this.$arrow = $('<div class="folder-arrow" role="presentation"><i class="fa fa-fw"></i></div>'),
                        this.$label = $('<div class="folder-label">')
                    ),
                    // subfolders
                    this.$subfolders = $('<ul class="subfolders" role="group" style="display: none;">')
                );

            // headless?
            if (this.headless) {
                this.$el.find('.selectable').removeClass('selectable').removeAttr('tabindex').hide();
            }

            // get data
            api.get(this.folder);

            // register for 'dispose' event (using inline function to make this testable via spyOn)
            this.$el.on('dispose', this.remove.bind(this));
        },

        render: function () {
            this.$label.text(this.model.get('title'));
            this.onChangeSubFolders();
            return this;
        },

        remove: function () {
            this.stopListening();
            this.collection = this.$subfolders = this.$label = this.$arrow = null;
        }
    });

    return FolderView;
});
