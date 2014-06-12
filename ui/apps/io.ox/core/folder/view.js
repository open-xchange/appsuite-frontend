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

    var FolderView = Backbone.View.extend({

        className: 'folder',

        events: {
            'click .folder-arrow': 'onToggle'
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
            console.log('on add', model.id);
            this.$subfolders.append(this.getFolderView.bind(this));
        },

        onRemove: function (model) {

            var id = model.id,
                nodes = this.$subfolders.children(),
                node = nodes.filter('[data-id="' + $.escape(model.id) + '"]');

            console.log('FolderView > onRemove', id, node, api);
            node.remove();
        },

        // re-render on any attribute change
        onChange: function () {
            this.render();
        },

        // open/close folder
        onToggle: function () {
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
                    (isOpen ? '<i class="fa fa-chevron-down">' : '<i class="fa fa-chevron-right">') :
                    '<i class="fa fa-fw">'
            );
            // toggle subfolder node
            this.$subfolders.toggle(isOpen);
            // fetch sub-folders
            if (hasSubFolders && isOpen) api.list(this.id);
        },

        // get a new FolderView instance
        getFolderView: function (model) {
            var level = this.headless ? this.level : this.level + 1;
            return new FolderView({ id: model.id, level: level, tree: this.tree }).render().$el;
        },

        initialize: function (options) {

            this.id = options.id;
            this.level = options.level || 0;
            this.open = !!options.open;
            this.tree = options.tree;
            this.model = api.pool.getFolderModel(this.id);
            this.collection = api.pool.getSubFolderCollection(this.id);
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
                .attr({ tabindex: '1', role: 'treeitem' })
                .append(
                    // folder
                    this.headless ?
                        $() :
                        $('<div class="selectable">')
                        .css('padding-left', this.level * 30)
                        .append(
                            this.$arrow = $('<div class="folder-arrow" role="presentation">')
                                .append('<i class="fa fa-fw">'),
                            this.$label = $('<div class="folder-label">')
                        ),
                    // subfolders
                    this.$subfolders = $('<div class="subfolders" role="group" style="display: none;">')
                );

            // get data
            api.get(this.id);

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
