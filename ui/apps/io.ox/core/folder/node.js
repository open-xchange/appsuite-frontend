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

define('io.ox/core/folder/node', ['io.ox/core/folder/api', 'io.ox/core/extensions', 'gettext!io.ox/core'], function (api, ext, gt) {

    'use strict';

    var ICON = 'caret'; // angle caret chevron

    var TreeNodeView = Backbone.View.extend({

        tagName: 'li',
        className: 'folder selectable',

        events: {
            'click .folder-options'     : 'onOptions',
            'click .folder-arrow'       : 'onToggle',
            'dblclick .folder-label'    : 'onToggle',
            'keydown'                   : 'onKeydown'
        },

        list: function () {
            var o = this.options;
            return api.list(o.model_id, { all: o.tree.all });
        },

        reset: function () {
            if (this.isReset) return;
            if (this.collection.fetched) this.onReset(); else this.list();
        },

        getFilter: function () {
            var o = this.options,
                context = o.filter ? this : o.tree,
                fn = o.filter || o.tree.filter;
            return fn.bind(context, o.model_id);
        },

        onReset: function () {

            var o = this.options,
                models = _(this.collection.filter(this.getFilter())),
                exists = {};

            // recycle existing nodes
            this.$.subfolders.children().each(function () {
                exists[$(this).attr('data-id')] = $(this).data('view');
            });

            // empty & append nodes
            this.$.subfolders.empty().append(
                models.map(function (model) {
                    return (exists[model.id] || this.getTreeNode(model).render()).$el;
                }, this)
            );

            this.renderEmpty();

            // trigger events
            this.$.subfolders.children().each(function () {
                var view = $(this).data('view');
                if (!view || exists[view.folder]) return;
                o.tree.appear(view);
            });

            this.isReset = true;
        },

        onAdd: function (model) {
            // filter first
            if (!this.getFilter()(model)) return;
            // add
            var node = this.getTreeNode(model);
            this.$.subfolders.append(node.render().$el);
            this.options.tree.appear(node);
            this.model.set('subfolders', true);
            this.renderEmpty();
        },

        onRemove: function (model) {
            var node = this.$.subfolders.children('[data-id="' + $.escape(model.id) + '"]');
            node.remove();
            if (this.$.subfolders.children().length === 0) this.model.set('subfolders', false);
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

            if (model.changed.subfolders) {
                this.options.open = !!model.changed.subfolders;
                this.onChangeSubFolders();
            }

            this.repaint();
        },

        toggle: function (state) {
            this.options.open = state;
            this.onChangeSubFolders();
            this.options.tree.trigger(state ? 'open' : 'close', this.folder);
        },

        // open/close folder
        onToggle: function (e) {
            if (e.isDefaultPrevented()) return;
            e.preventDefault();
            this.toggle(!this.options.open);
        },

        onOptions: function (e) {
            e.preventDefault();
        },

        // utility functions
        hasSubFolders: function () {
            var isFlat = /^virtual\/flat/.test(this.folder);
            return this.options.subfolders && (isFlat || this.model.get('subfolders') === true);
        },

        // respond to new sub-folders
        onChangeSubFolders: function () {
            // has subfolders?
            var o = this.options,
                hasSubFolders = this.hasSubFolders(),
                isOpen = o.open && hasSubFolders;
            // update arrow
            this.$.arrow.html(
                hasSubFolders ?
                    (isOpen ? '<i class="fa fa-' + ICON + '-down">' : '<i class="fa fa-' + ICON + '-right">') :
                    '<i class="fa fa-fw">'
            );
            // a11y
            if (hasSubFolders) this.$el.attr('aria-expanded', isOpen); else this.$el.removeAttr('aria-expanded');
            // toggle subfolder node
            this.$el.toggleClass('open', isOpen);
            // empty?
            this.renderEmpty();
            // fetch sub-folders
            if (isOpen) this.reset();
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
            if (!this.hasSubFolders()) return;
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
                level = o.headless || o.indent === false ? o.level : o.level + 1,
                options = o.tree.getTreeNodeOptions({ folder: model.id, level: level, tree: o.tree, parent: this }, model);
            return new TreeNodeView(options);
        },

        functions: function () {

            // functions that use debounce or throttle must be defined
            // per instance, not on prototype level. otherwise all instances
            // share the inner timers (side-effects and evil debugging)

            this.onSort = _.debounce(function () {
                // check
                if (!this.$) return;
                // re-append to apply sorting
                var nodes = _(this.$.subfolders.children()).sortBy(function (node) {
                    var index = $(node).attr('data-index'); // don't use data() here
                    return parseInt(index, 10);
                });
                this.$.subfolders.append(nodes);
            }, 10);

            this.repaint = _.throttle(function () {
                if (this.model !== null) this.render();
            }, 10);
        },

        initialize: function (options) {

            this.functions();

            // make sure we work with strings
            this.folder = String(options.folder);

            var o = this.options = _.extend({
                arrow: true,                    // show folder arrow
                count: undefined,               // use custom counter
                empty: true,                    // show if empty, i.e. no subfolders?
                headless: false,                // show folder row? root folder usually hidden
                indent: true,                   // indent subfolders, i.e. increase level by 1
                level: 0,                       // nesting / left padding
                model_id: this.folder,          // use this id to load model data and subfolders
                open: false,                    // state
                sortable: false,                // sortable via alt-cursor-up/down
                subfolders: true,               // load/avoid subfolders
                title: ''                       // custom title
            }, options);

            // also set: folder, parent, tree

            this.isVirtual = this.options.virtual || /^virtual/.test(this.folder);
            this.model = api.pool.getModel(o.model_id);
            this.collection = api.pool.getCollection(o.model_id, o.tree.all);
            this.isReset = false;
            this.$ = {};

            // make accessible via DOM
            this.$el.data('view', this);

            // inherit "open"
            if (_(o.tree.open).contains(this.folder)) o.open = true;

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
                .attr({
                    'aria-label'    : '',
                    'aria-level'    : o.level + 1,
                    'aria-selected' : false,
                    'data-id'       : this.folder,
                    'data-index'    : this.model.get('index'),
                    'data-model'    : o.model_id,
                    'role'          : 'treeitem',
                    'tabindex'      : '-1'
                })
                .append(
                    // folder
                    this.$.selectable = $('<div class="folder-node" role="presentation">')
                    .css('padding-left', o.level * 30)
                    .append(
                        this.$.arrow = o.arrow ? $('<div class="folder-arrow"><i class="fa fa-fw"></i></div>') : $(),
                        this.$.label = $('<div class="folder-label">'),
                        this.$.counter = $('<div class="folder-counter">')
                    ),
                    // subfolders
                    this.$.subfolders = $('<ul class="subfolders" role="group">')
                );

            // headless?
            if (o.headless) {
                this.$el.removeClass('selectable').removeAttr('tabindex');
                this.$.selectable.hide();
            }

            // sortable
            if (o.sortable) this.$el.attr('data-sortable', true);

            // virtual?
            if (this.isVirtual) this.$el.addClass('virtual');

            // add contextmenu (only if 'app' is defined; should not appear in modal dialogs, for example)
            if ((!this.isVirtual || o.contextmenu !== 'default') && o.tree.options.contextmenu && o.tree.app && _.device('!smartphone')) this.renderContextControl();

            // get data
            if (!this.isVirtual) api.get(o.model_id);

            // fetch subfolders if not open but "empty" is false
            if (o.empty === false && o.open === false) this.reset();

            // allow extensions
            ext.point('io.ox/core/foldertree/node').invoke('scaffold', this.$el, ext.Baton({ view: this, data: this.model.toJSON() }));

            // simple tree-based customize callback
            if (_.isFunction(o.tree.options.customize)) o.tree.options.customize.call(this.$el, ext.Baton({ view: this, data: this.model.toJSON() }));

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
            return this.options.title || this.model.get('title') || '';
        },

        renderTitle: function () {
            var title = this.getTitle();
            this.$.label.text(title);
            this.$el.attr('aria-label', title);
        },

        renderTooltip: function () {
            if (this.options.title) return; // don't overwrite custom title
            if (!this.model.has('title')) return;
            var data = this.model.toJSON(), summary = [];
            if (_.isNumber(data.total)) summary.push(gt('Total: %1$d', data.total));
            if (_.isNumber(data.unread)) summary.push(gt('Unread: %1$d', data.unread));
            summary = summary.join(', ');
            if (summary) summary = ' (' + summary + ')';
            this.$el.attr('title', this.model.get('title') + summary);
        },

        renderContextControl: function () {
            this.$.selectable.append(
                $('<a href="#" role="button" class="folder-options contextmenu-control" tabindex="1">')
                .attr({
                    'data-contextmenu': this.options.contextmenu || 'default',
                    'title': gt('Folder-specific actions')
                })
                .append($('<i class="fa fa-bars">'))
            );
        },

        renderAttributes: function () {
            this.$el.attr({
                'data-id': this.folder,
                'data-index': this.model.get('index')
            });
        },

        isEmpty: function () {
            return this.$.subfolders.children().length === 0;
        },

        renderEmpty: function () {
            if (this.options.empty !== false) return;
            // only show if not empty, i.e. has subfolders
            this.$el.toggleClass('empty', this.isEmpty());
        },

        render: function () {
            this.renderAttributes();
            this.renderEmpty();
            this.renderTitle();
            this.renderTooltip();
            this.renderCounter();
            this.onChangeSubFolders();
            ext.point('io.ox/core/foldertree/node').invoke('render', this.$el, ext.Baton({ view: this }));
            return this;
        },

        remove: function () {
            this.stopListening();
            this.collection = this.model = this.options = this.$ = null;
        }
    });

    return TreeNodeView;
});
