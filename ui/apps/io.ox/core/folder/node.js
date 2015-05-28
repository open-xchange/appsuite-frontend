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

define('io.ox/core/folder/node', [
    'io.ox/backbone/disposable',
    'io.ox/core/folder/api',
    'io.ox/core/extensions',
    'io.ox/core/api/account',
    'gettext!io.ox/core'
], function (DisposableView, api, ext, account, gt) {

    'use strict';

    // angle caret chevron
    var ICON = 'caret';

    var TreeNodeView = DisposableView.extend({

        tagName: 'li',
        className: 'folder selectable',

        // indentation in px per level
        indentation: 30,

        events: {
            'click .folder-options'     : 'onOptions',
            'click .folder-arrow'       : 'onArrowClick',
            'dblclick .folder-label'    : 'onToggle',
            'mousedown .folder-arrow'   : 'onArrowMousedown',
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
                models = this.collection.filter(this.getFilter()),
                exists = {};

            // recycle existing nodes / use detach to keep events
            this.$.subfolders.children().each(function () {
                exists[$(this).attr('data-id')] = $(this).detach().data('view');
            });

            // append nodes
            this.$.subfolders.append(
                models.map(function (model) {
                    return (exists[model.id] || this.getTreeNode(model).render()).$el;
                }, this)
            );

            // see bug 37373
            // This was caused by the filter method of the unified-folders extensionpoint which sets "subfolder = false" for the folder 1 model.
            // Since this folder always has subfolders this is skipped.
            if (this.folder !== '1') this.model.set('subfolders', models.length > 0);
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
            var children = this.$.subfolders.children();
            children.filter('[data-id="' + $.escape(model.id) + '"]').remove();
            if (children.length === 0) this.model.set('subfolders', false);
            this.renderEmpty();
        },

        // respond to changed id
        onChangeId: function (model) {
            var id = String(model.get('id')),
                previous = String(model.previous('id')),
                selection = this.options.tree.selection,
                selected = selection.get();
            // update other ID attributes
            if (this.folder === previous) this.folder = id;
            if (this.options.model_id === previous) this.options.model_id = id;
            if (this.options.contextmenu_id === previous) this.options.contextmenu_id = id;
            // update DOM
            this.renderAttributes();
            // trigger selection change event
            if (previous === selected) this.options.tree.trigger('change', id);
            // close sub-folders
            this.options.open = false;
            // update collection
            if (this.collection) {
                this.collection = api.pool.getCollection(id);
                this.isReset = false;
                this.reset();
            }
            this.onChangeSubFolders();
        },

        // re-render on any attribute change
        onChange: function (model) {

            if (model.changed.id !== undefined) {
                this.onChangeId(model);
            }

            if (model.changed[this.getIndexAttribute()] !== undefined) {
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

        hasArrow: function () {
            // return true if icon is not fixed-width, i.e. empty
            return this.$.arrow.find('i.fa-fw').length === 0;
        },

        onArrowClick: function (e) {
            if (!$(e.target).closest(this.$.arrow).length || !this.hasArrow()) {
                e.preventDefault();
                return;
            }
            this.onToggle(e);
        },

        onArrowMousedown: function (e) {
            // just to avoid changing the focus (see bug 35802)
            // but only if the folder shows the arrow (see bug 36424)
            if (!$(e.target).closest(this.$.arrow).length) return;
            if (!this.hasArrow()) return;
            e.preventDefault();
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
            this.$.arrow
            .toggleClass('invisible', !hasSubFolders)
            .html(
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
            } else if (e.which === 37 && o.open) {
                // cursor left?
                o.open = false;
                this.onChangeSubFolders();
            }
        },

        // get a new TreeNode instance
        getTreeNode: function (model) {
            var o = this.options,
                level = o.headless || o.indent === false ? o.level : o.level + 1,
                options = { folder: model.id, icons: this.options.icons, level: level, tree: o.tree, parent: this };
            return new TreeNodeView(o.tree.getTreeNodeOptions(options, model));
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
                    // don't use data() here
                    var index = $(node).attr('data-index');
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
                icons: false,                   // show folder icons
                indent: true,                   // indent subfolders, i.e. increase level by 1
                level: 0,                       // nesting / left padding
                model_id: this.folder,          // use this id to load model data and subfolders
                contextmenu_id: this.folder,    // use this id for the context menu
                open: false,                    // state
                sortable: false,                // sortable via alt-cursor-up/down
                subfolders: true,               // load/avoid subfolders
                title: '',                      // custom title
                a11yDescription: []             // content for aria-description tag
            }, options);

            // also set: folder, parent, tree

            this.isVirtual = this.options.virtual || /^virtual/.test(this.folder);
            this.model = api.pool.getModel(o.model_id);
            this.collection = api.pool.getCollection(o.model_id, o.tree.all);
            this.isReset = false;
            this.describedbyID = _.uniqueId('description-');
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
                'change:subfolders': this.onChangeSubFolders,
                'destroy': this.destroy.bind(this)
            });

            // draw scaffold
            this.$el
                .attr({
                    id              : this.describedbyID,
                    'aria-label'    : '',
                    'aria-level'    : o.level + 1,
                    'aria-selected' : false,
                    'data-id'       : this.folder,
                    'data-index'    : this.getIndex(),
                    'data-model'    : o.model_id,
                    'data-contextmenu-id': o.contextmenu_id,
                    'role'          : 'treeitem',
                    'tabindex'      : '-1'
                })
                .append(
                    // folder
                    this.$.selectable = $('<div class="folder-node" role="presentation">')
                    .css('padding-left', o.level * this.indentation)
                    .append(
                        this.$.arrow = o.arrow ? $('<div class="folder-arrow invisible"><i class="fa fa-fw"></i></div>') : [],
                        this.$.icon = $('<div class="folder-icon"><i class="fa fa-fw"></i></div>'),
                        this.$.label = $('<div class="folder-label">'),
                        this.$.counter = $('<div class="folder-counter">')
                    ),
                    // tag for screenreader only (aria-description)
                    this.$.a11y = $('<span class="sr-only">').attr({ id: this.describedbyID }),
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
            if ((!this.isVirtual || o.contextmenu) && o.tree.options.contextmenu && o.tree.app && _.device('!smartphone')) {
                this.$el.attr({ 'aria-haspopup': true });
                this.renderContextControl();
            }

            // get data
            if (!this.isVirtual) api.get(o.model_id);

            // fetch subfolders if not open but "empty" is false
            // or if it's a virtual folder and we're not sure if it has subfolders
            if ((o.empty === false && o.open === false) || this.isVirtual) this.reset();

            // run through some custom callbacks
            var data = this.model.toJSON(), baton = ext.Baton({ view: this, data: data });

            // allow extensions
            ext.point('io.ox/core/foldertree/node').invoke('initialize', this.$el, baton);

            // simple tree-based customize callback
            o.tree.options.customize.call(this.$el, baton);

            // simple tree-based disable callback
            if (o.tree.options.disable(data, o)) this.$el.addClass('disabled');

            // register for 'dispose' event (using inline function to make this testable via spyOn)
            this.$el.on('dispose', this.remove.bind(this));
        },

        getCounter: function () {
            return this.options.count !== undefined ? this.options.count : this.model.get('unread') || 0;
        },

        renderCounter: function () {
            var value = this.getCounter();
            this.$.selectable.toggleClass('show-counter', value > 0);
            this.$.counter.text(value);
        },

        getTitle: function () {
            return this.options.title || this.model.get('title') || '';
        },

        renderTitle: function () {
            var title = this.getTitle();
            this.$.label.text(title);
        },

        renderA11yNode: function () {
            //draw even if there is no description or old descriptions cannot be cleared
            this.$.a11y.text(this.options.a11yDescription.join('. '));
        },

        renderTooltip: function () {
            // don't overwrite custom title
            if (this.options.title) return;
            if (!this.model.has('title')) return;
            var data = this.model.toJSON(), summary = [];
            if (_.isNumber(data.total) && data.total >= 0) summary.push(gt('Total: %1$d', data.total));
            if (_.isNumber(data.unread) && data.unread >= 0) summary.push(gt('Unread: %1$d', data.unread));
            summary = summary.join(', ');
            if (summary) summary = ' (' + summary + ')';
            this.$el.attr({
                'title': this.model.get('title') + summary,
                'aria-label': this.model.get('title') + summary
            });
        },

        renderContextControl: function () {
            this.$.selectable.append(
                $('<a>')
                .addClass('folder-options contextmenu-control')
                .attr({
                    'data-contextmenu': this.options.contextmenu || 'default',
                    'aria-label': gt('Folder-specific actions'),
                    href: '#',
                    role: 'button',
                    tabindex: 1
                })
                .append(
                    $('<i class="fa fa-bars" aria-hidden="true">'),
                    $('<span class="sr-only">').text(gt('Folder-specific actions'))
                )
            );
        },

        renderAttributes: function () {
            this.$el.attr({
                'data-id': this.folder,
                'data-index': this.getIndex(),
                'data-model': this.options.model_id,
                'data-contextmenu-id': this.options.contextmenu_id
            });
        },

        getIndexAttribute: function () {
            var parent = this.options.parent;
            if (!parent || !parent.collection) return undefined;
            return 'index/' + parent.collection.id;
        },

        getIndex: function () {
            var attribute = this.getIndexAttribute();
            if (attribute === undefined) return 0;
            return this.model.get(attribute) || 0;
        },

        isEmpty: function () {
            return this.$.subfolders.children().length === 0;
        },

        renderEmpty: function () {
            if (this.options.empty !== false) return;
            // only show if not empty, i.e. has subfolder
            this.$el.toggleClass('empty', this.isEmpty());
        },

        renderIcon: function () {
            var o = this.options, type;
            if (!o.icons || o.tree.module !== 'mail') return;
            type = account.getType(this.folder) || 'default';
            this.$.icon.addClass('visible ' + type);
        },

        render: function () {
            this.renderAttributes();
            this.renderEmpty();
            this.renderTitle();
            this.renderTooltip();
            this.renderCounter();
            this.renderIcon();
            this.onChangeSubFolders();
            ext.point('io.ox/core/foldertree/node').invoke('draw', this.$el, ext.Baton({ view: this, data: this.model.toJSON() }));
            this.renderA11yNode();
            return this;
        },

        destroy: function () {
            // get parent first
            var parent = this.options.parent;
            // remove from DOM now (will trigger this.remove)
            this.$el.remove();
            // check siblings now
            if (parent.renderEmpty) parent.renderEmpty();
        },

        remove: function () {
            this.stopListening();
            this.collection = this.model = this.options = this.$ = null;
        }
    });

    return TreeNodeView;
});
