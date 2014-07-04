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

define('io.ox/core/folder/node', ['io.ox/core/folder/api', 'gettext!io.ox/core'], function (api, gt) {

    'use strict';

    var ICON = 'caret'; // angle caret chevron

    var TreeNodeView = Backbone.View.extend({

        tagName: 'li',
        className: 'folder',

        events: {
            'click .folder-arrow': 'onToggle',
            'click .folder-options': 'onOptions',
            'keydown': 'onKeydown'
        },

        onReset: function () {

            var o = this.options,
                models = _(this.collection.filter(o.tree.filter.bind(o.tree, o.model_id)));

            this.$.subfolders
                .empty()
                .append(models.map(this.getTreeNode, this))
                .show();

            // trigger events
            models.each(function (model) {
                o.tree.trigger('appear:' + model.id, model);
            });
        },

        onSort: _.debounce(function () {
            // check
            if (!this.$) return;
            // re-append to apply sorting
            var nodes = _(this.$.subfolders.children()).sortBy(function (node) {
                var index = $(node).attr('data-index'); // don't use data() here
                return parseInt(index, 10);
            });
            this.$.subfolders.append(nodes);
        }, 10),

        onAdd: function (model) {
            this.$.subfolders.append(this.getTreeNode(model));
            this.options.tree.trigger('appear:' + model.id, model);
        },

        onRemove: function (model) {
            var node = this.$.subfolders.children('[data-id="' + $.escape(model.id) + '"]');
            node.remove();
        },

        // respond to changed id
        onChangeId: function (model) {
            var id = model.get('id'),
                previous = model.previous('id'),
                selection = this.options.tree.selection,
                selected = selection.get();
            // update DOM
            this.folder = this.model_id = String(id);
            this.renderAttributes();
            // trigger selection change event
            if (previous === selected) this.options.tree.trigger('change', id);
            // close sub-folders
            this.options.open = false;
            this.onChangeSubFolders();
        },

        // re-render on any attribute change
        onChange: function (model) {

            if (model.changed.id !== undefined) {
                this.onChangeId(model);
            }

            if (model.changed.index !== undefined) {
                this.renderAttributes();
                if (this.options.parent.onSort) this.options.parent.onSort();
            }

            this.repaint();
        },

        // open/close folder
        onToggle: function (e) {
            if (e.isDefaultPrevented()) return;
            e.preventDefault();
            this.options.open = !this.options.open;
            this.onChangeSubFolders();
        },

        onOptions: function (e) {
            e.preventDefault();
        },

        // respond to new sub-folders
        onChangeSubFolders: function () {
            // has subfolders?
            var o = this.options,
                hasSubFolders = o.subfolders && this.model.get('subfolders') === true,
                isOpen = o.open;
            // update arrow
            this.$.arrow.html(
                hasSubFolders ?
                    (isOpen ? '<i class="fa fa-' + ICON + '-down">' : '<i class="fa fa-' + ICON + '-right">') :
                    '<i class="fa fa-fw">'
            );
            // toggle subfolder node
            this.$.subfolders.toggle(hasSubFolders && isOpen);
            // fetch sub-folders
            if (hasSubFolders && isOpen) { this.onReset(); api.list(o.model_id); }
        },

        // respond to cursor left/right
        onKeydown: function (e) {
            // already processed?
            if (e.isDefaultPrevented()) return;
            // not cursor right/left?
            if (e.which !== 37 && e.which !== 39) return;
            // avoid further processing
            e.preventDefault();
            // skip unless folder has subfolders
            if (!this.model.get('subfolders')) return;
            // cursor right?
            var o = this.options;
            if (e.which === 39 && !o.open) {
                o.open = true;
                this.onChangeSubFolders();
            }
            // cursor left?
            else if (e.which === 37 && o.open) {
                o.open = false;
                this.onChangeSubFolders();
            }
        },

        // get a new TreeNode instance
        getTreeNode: function (model) {
            var o = this.options,
                level = o.headless ? o.level : o.level + 1,
                options = o.tree.getTreeNodeOptions({ folder: model.id, level: level, tree: o.tree, parent: this }, model);
            return new TreeNodeView(options).render().$el;
        },

        initialize: function (options) {

            // make sure we work with strings
            this.folder = String(options.folder);

            var o = this.options = _.extend({
                arrow: true,                    // show folder arrow
                count: undefined,               // use custom counter
                headless: false,                // show folder row? root folder usually hidden
                level: 0,                       // nesting / left padding
                model_id: this.folder,          // use this id to load model data and subfolders
                open: false,                    // state
                subfolders: true,               // load/avoid subfolders
                title: ''                       // custom title
            }, options);

            // also set: folder, parent, tree

            this.isVirtual = /^virtual/.test(this.folder);
            this.model = api.pool.getModel(o.model_id);
            this.collection = api.pool.getCollection(o.model_id);
            this.$ = {};

            // collection changes
            if (o.subfolders) {
                this.listenTo(this.collection, {
                    'add'    : this.onAdd,
                    'remove' : this.onRemove,
                    'reset'  : this.onReset,
                    'sort'   : this.onSort
                });
            }

            // model changes
            this.listenTo(this.model, {
                'change': this.onChange,
                'change:subfolders': this.onChangeSubFolders
            });

            // draw scaffold
            this.$el
                .attr('role', 'treeitem')
                .append(
                    // folder
                    this.$.selectable = $('<div class="selectable" tabindex="-1">')
                    .attr('data-id', this.folder)
                    .css('padding-left', o.level * 30)
                    .append(
                        this.$.arrow = o.arrow ? $('<div class="folder-arrow" role="presentation"><i class="fa fa-fw"></i></div>') : $(),
                        this.$.label = $('<div class="folder-label">'),
                        this.$.counter = $('<div class="folder-counter">')
                    ),
                    // subfolders
                    this.$.subfolders = $('<ul class="subfolders" role="group" style="display: none;">')
                );

            // headless?
            if (o.headless) {
                this.$.selectable.removeClass('selectable').removeAttr('tabindex').hide();
            }

            // virtual?
            if (this.isVirtual) this.$.selectable.addClass('virtual');

            // add contextmenu (only if 'app' is defined; should not appear in modal dialogs, for example)
            if (o.tree.options.contextmenu && this.options.tree.app && !this.isVirtual) this.renderContextControl();

            // get data
            api.get(o.model_id);

            // register for 'dispose' event (using inline function to make this testable via spyOn)
            this.$el.on('dispose', this.remove.bind(this));
        },

        getCounter: function () {
            return this.options.count !== undefined ? this.options.count : this.model.get('unread') || 0;
        },

        renderCounter: function () {
            var value = this.getCounter();
            if (!value) this.$.counter.empty(); else this.$.counter.text(value);
        },

        getTitle: function () {
            return this.options.title || this.model.get('title') || '';
        },

        renderTitle: function () {
            this.$.label.text(this.getTitle());
        },

        renderContextControl: function () {
            this.$.selectable.append(
                $('<a href="#" role="button" class="folder-options contextmenu-control" tabindex="1">')
                .attr('title', gt('Folder-specific actions'))
                .append($('<i class="fa fa-cog">'))
            );
        },

        renderAttributes: function () {
            this.$el.attr({
                'data-id': this.folder,
                'data-index': this.model.get('index')
            });
            // and again for selectable
            this.$.selectable.attr('data-id', this.folder);
        },

        repaint: _.throttle(function () { if (this.model !== null) this.render(); }, 10),

        render: function () {
            this.renderAttributes();
            this.renderTitle();
            this.renderCounter();
            this.onChangeSubFolders();
            return this;
        },

        remove: function () {
            this.stopListening();
            this.collection = this.model = this.options = this.$ = null;
        }
    });

    return TreeNodeView;
});
