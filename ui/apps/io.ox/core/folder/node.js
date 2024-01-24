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

define('io.ox/core/folder/node', [
    'io.ox/backbone/views/disposable',
    'io.ox/core/folder/api',
    'io.ox/core/extensions',
    'io.ox/core/api/account',
    'settings!io.ox/core',
    'gettext!io.ox/core'
], function (DisposableView, api, ext, account, settings, gt) {

    'use strict';

    var TreeNodeView = DisposableView.extend({

        tagName: 'li',
        className: 'folder selectable',

        // indentation in px per level
        indentation: _.device('smartphone') ? 15 : 30,

        events: {
            'click .folder-options':   'onOptions',
            'click .folder-arrow':     'onArrowClick',
            'dblclick .folder-label':  'onToggle',
            'mousedown .folder-arrow': 'onArrowMousedown',
            'keydown':                 'onKeydown'
        },

        addA11yDescription: function (str) {
            this.options.a11yDescription.push(str);
            this.options.a11yDescription = _.uniq(this.options.a11yDescription);
            this.renderTooltip();
        },

        getA11yDescription: function () {
            if (_.isEmpty(this.options.a11yDescription)) return '';
            return '. ' + this.options.a11yDescription.join('.');
        },

        list: function () {
            var o = this.options;
            return api.list(o.model_id, { all: o.tree.all });
        },

        reset: function () {
            if (this.isReset) return this.trigger('reset');
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
                isFavoriteRootFolder = this.model.get('id').indexOf('virtual/favorites') === 0,
                exists = {};

            // recycle existing nodes / use detach to keep events
            this.$.subfolders.children().each(function () {
                exists[$(this).attr('data-id')] = $(this).detach().data('view');
            });

            // append nodes
            this.$.subfolders.append(
                models.filter(function (model) {
                    // favorites are kinda special. They may contain unsubscribed folders (we don't remove them from favorites, so they show up as favorites again when they are resubscribed)
                    if (isFavoriteRootFolder) {
                        return !!model.get('subscribed');
                    }
                    return true;
                }).map(function (model) {
                    return (exists[model.id] || this.getTreeNode(model).render()).$el;
                }, this)
            );

            // see bug 37373
            // This was caused by the filter method of the unified-folders extensionpoint which sets "subfolder = false" for the folder 1 model.
            // Since this folder always has subfolders this is skipped.
            if (this.folder !== '1' && this.folder !== 'default0') this.modelSetSubfolders(models.length > 0);
            this.renderEmpty();

            // trigger events
            this.$.subfolders.children().each(function () {
                var view = $(this).data('view');
                if (!view || exists[view.folder]) return;
                o.tree.appear(view);
            });

            this.isReset = true;
            this.trigger('reset');
        },

        onAdd: function (model) {
            // filter first
            if (!this.getFilter()(model)) {
                this.renderEmpty();
                return;
            }
            // add
            var node = this.getTreeNode(model);
            this.$.subfolders.append(node.render().$el);
            this.options.tree.appear(node);
            this.modelSetSubfolders(true);
            this.renderEmpty();
        },

        onRemove: function (model) {
            this.$.subfolders.children('[data-id="' + $.escape(model.attributes && model.attributes.id ? model.attributes.id : model.id) + '"]').remove();
            // we do not update models if the DOM is empty! (see bug 43754)
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
                // remove old listeners
                this.stopListening(this.collection);
                this.stopListening(api, 'create:' + String(previous).replace(/\s/g, '_'));

                // change collection
                this.collection = api.pool.getCollection(id);

                // add new listeners
                this.listenTo(this.collection, {
                    'add':     this.onAdd,
                    'remove':  this.onRemove,
                    'change:subscribed': this.onReset,
                    'reset':   this.onReset,
                    'sort':    this.onSort
                });
                this.listenTo(api, 'create:' + String(id).replace(/\s/g, '_'), function () {
                    this.open = true;
                    this.onChangeSubFolders();
                });

                this.isReset = false;
                this.reset();
            }
            this.onChangeSubFolders();
        },

        // re-render on any attribute change
        onChange: function (model) {

            if (model.changed.title !== undefined) this.renderFolderLabel();

            if (model.changed.id !== undefined) {
                this.onChangeId(model);
            }

            if (model.changed.subfolders) {
                // close if no more subfolders
                if (!model.changed.subfolders) this.open = false;
                this.onChangeSubFolders();
            }

            this.repaint();
        },

        toggle: function (state, autoOpen) {
            // for whatever reason, this.options might be nulled (see bug 37483)
            if (this.options === null) return;
            var isChange = (this.options.open !== state);
            this.options.open = state;
            this.onChangeSubFolders();
            this.renderCounter();
            if (!isChange) return;
            this.options.tree.trigger(state ? 'open' : 'close', this.folder, autoOpen);
        },

        // open/close folder
        onToggle: function (e) {
            if (e.isDefaultPrevented()) return;
            e.preventDefault();
            this.toggle(!this.options.open);
        },

        isOpen: function () {
            return this.options.open && this.hasSubFolders();
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
            // mobile fix (OXUIB-1046): prevents opening folder instead of only toggling
            e.stopPropagation();
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
            return this.options.subfolders && (isFlat || this.modelGetSubfolders() === true);
        },

        modelGetSubfolders: function () {
            return this.model.get(this.options.tree.all ? 'subfolders' : 'subscr_subflds');
        },

        modelSetSubfolders: function (value) {
            return this.model.set(this.options.tree.all ? 'subfolders' : 'subscr_subflds', value);
        },

        // respond to new sub-folders
        onChangeSubFolders: function () {
            // has subfolders?
            var hasSubFolders = this.hasSubFolders(), isOpen = this.isOpen(), icon = 'fa-fw';
            if (hasSubFolders) icon = isOpen ? 'fa-caret-down' : 'fa-caret-right';
            // update arrow
            this.$.arrow
            .toggleClass('invisible', !hasSubFolders)
            .html($('<i class="fa" aria-hidden="true">').addClass(icon));
            // a11y
            if (hasSubFolders && !this.options.headless) this.$el.attr('aria-expanded', isOpen); else this.$el.removeAttr('aria-expanded');
            // toggle subfolder node
            this.$el.toggleClass('open', isOpen);
            // empty?
            this.renderEmpty();
            // fetch sub-folders
            if (isOpen) this.reset();
        },

        // respond to cursor left/right
        onKeydown: function (e) {
            // already processed or not cursor right/left, enter or space
            if (e.isDefaultPrevented() || !/^(13|32|37|39)$/.test(e.which)) return;

            e.preventDefault();
            // skip cursor right, space and enter unless folder has subfolders
            if (!this.hasSubFolders() && /^(13|32|39)$/.test(e.which)) return;
            var o = this.options;

            // enter and space on virtual folders
            if (/^(13|32)$/.test(e.which) && this.isVirtual) this.toggle(!o.open);

            // cursor right
            else if (e.which === 39) {
                if (!o.open && e.which === 39) this.toggle(true); // open subfolders if subfolders are closed
                else this.$el.find('ul.subfolders:first > li:first-child').trigger('click'); // select first subfolder if folder has subfolder and subfolders are open

            // cursor left
            } else if (e.which === 37) {
                if (o.open) this.toggle(false); // close folder with subfolders
                else if (o.indent && o.level >= 0) o.parent.$el.trigger('click'); // move up one folder (parent)
            }
        },

        // get a new TreeNode instance
        getTreeNode: function (model) {
            var modelId = model.id || model.attributes.id;
            var o = this.options,
                level = o.headless || o.indent === false ? o.level : o.level + 1,
                namespace = o.namespace || o.folder.indexOf('virtual/favorites') === 0 ? 'favorite' : '',
                options = { folder: modelId, icons: this.options.icons, iconClass: this.options.iconClass, level: level, tree: o.tree, parent: this, namespace: namespace };
            return new TreeNodeView(o.tree.getTreeNodeOptions(options, model));
        },

        functions: function () {

            // functions that use debounce or throttle must be defined
            // per instance, not on prototype level. otherwise all instances
            // share the inner timers (side-effects and evil debugging)

            this.onSort = _.debounce(function () {
                if (this.disposed) return;

                // check
                if (!this.$) return;

                var hash = {};

                // recycle existing nodes
                this.$.subfolders.children().each(function () {
                    hash[$(this).attr('data-id')] = $(this);
                });

                // reinsert nodes according to order in collection
                this.$.subfolders.append(
                    this.collection.map(function (model) {
                        return hash[model.id];
                    })
                );
            }, 10);

            this.repaint = _.throttle(function () {
                if (this.disposed) return;
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
                iconClass: undefined,           // use custom icon class
                indent: true,                   // indent subfolders, i.e. increase level by 1
                level: 0,                       // nesting / left padding
                model_id: this.folder,          // use this id to load model data and subfolders
                namespace: '',                  // used for unique ids for open/close state of favorites
                contextmenu_id: this.folder,    // use this id for the context menu
                open: false,                    // state
                sortable: false,                // sortable via alt-cursor-up/down
                subfolders: true,               // load/avoid subfolders
                title: '',                      // custom title
                a11yDescription: []             // content for aria-description tag
            }, options);

            // also set: folder, parent, tree
            this.model = api.pool.getModel(o.model_id);
            this.noSelect = !this.model.can('read');
            this.isVirtual = this.options.virtual || /^virtual/.test(this.folder) || this.folder === 'cal://0/allPublic';

            this.collection = api.pool.getCollection(o.model_id, o.tree.all);
            this.isReset = false;
            this.realNames = options.tree.realNames;
            this.id = _.uniqueId(o.tree.id + '-node-');
            this.$ = {};

            // make accessible via DOM
            this.$el.data('view', this);

            // inherit "open"
            if (_(o.tree.open).contains((o.namespace ? o.namespace + ':' : '') + this.folder)) o.open = true;

            // collection changes
            if (o.subfolders) {
                this.listenTo(this.collection, {
                    'add':     this.onAdd,
                    'remove':  this.onRemove,
                    'change:subscribed': this.onReset,
                    'reset':   this.onReset,
                    'sort':    this.onSort
                });
                // respond to newly created folders
                this.listenTo(api, 'create:' + String(o.model_id).replace(/\s/g, '_'), function () {
                    this.open = true;
                    this.onChangeSubFolders();
                });
            }

            // model changes
            this.listenTo(this.model, {
                'change': this.onChange,
                'change:subfolders': this.onChangeSubFolders,
                'destroy': this.destroy.bind(this)
            });

            var offset = 0;
            if (o.tree.options.highlightclass === 'visible-selection-smartphone') {
                // cannot be done in css because dynamic padding-left is applied
                // using a margin would result in unclickable area and no selection background-color on the left side
                offset = 22;
            }

            // draw scaffold
            this.$el
                .attr({
                    'id': this.id,
                    'data-id': this.folder,
                    'data-model': o.model_id,
                    'data-contextmenu-id': o.contextmenu_id,
                    'data-namespace': o.namespace,
                    'aria-label': this.getTitle()
                })
                .append(
                    this.$.selectable = $('<div class="folder-node" aria-hidden="true">').css('padding-left', (o.level * this.indentation) + offset).append(
                        this.$.arrow = o.arrow ? $('<div class="folder-arrow invisible"><i class="fa fa-fw" aria-hidden="true"></i></div>') : [],
                        this.$.icon = $('<div class="folder-icon"><i class="fa fa-fw" aria-hidden="true"></i></div>'),
                        $('<div class="folder-label">').append(this.$.label = $('<div role="presentation">').text(this.getTitle())),
                        this.$.counter = $('<div class="folder-counter">'),
                        this.$.buttons = $('<div class="folder-buttons">')
                    ),

                    // subfolders
                    this.$.subfolders = $('<ul class="subfolders" role="group">')
                );

            // headless?
            if (o.headless) {
                this.$el.removeClass('selectable');
                this.$.selectable.remove();
                this.$.subfolders.attr('role', 'presentation');
            } else {
                this.$el.attr({
                    'aria-selected': false,
                    'role': 'treeitem',
                    'tabindex': '-1'
                });
            }

            // sortable
            if (o.sortable) this.$el.attr('data-sortable', true);

            if (this.noSelect && o.level > 0) this.$el.addClass('no-select');
            if (this.isVirtual) this.$el.addClass('virtual');

            // add contextmenu (only if 'app' is defined; should not appear in modal dialogs, for example)
            if ((!this.isVirtual || o.contextmenu) && o.tree.options.contextmenu && o.tree.app) {
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
            // needed to avoid zombie listeners
            o.tree.once('dispose', this.remove.bind(this));
        },

        getCounter: function () {
            var subtotal = 0;
            //show number of unread subfolder items only when folder is closed
            if (!this.options.open && this.options.subfolders && this.model.get('subtotal')) {
                subtotal = this.model.get('subtotal');
            }
            return this.options.count !== undefined ? this.options.count : (this.model.get('unread') || 0) + subtotal;
        },

        showStatusIcon: function (message, event, data, overwrite) {

            var self = this;

            // some events are more important, so they should be able to overwrite previous ones (Oauth account error vs associated mail account error, for example)
            if (overwrite) this.hideStatusIcon();

            if (this.$.accountLink) {
                if (message) this.$.accountLink.attr('title', message);
                return;
            }

            this.$.selectable.append(this.$.accountLink = $('<a href="#" class="account-link">')
                .attr('data-id', this.options.model_id)
                .append('<i class="fa fa-exclamation-triangle">'));

            this.$.accountLink.on('click', function (e) {
                e.preventDefault();
                self.options.tree.trigger(event, data);
            });
            if (message) {
                this.$.accountLink.attr('title', message);
            }
        },

        hideStatusIcon: function () {
            if (this.$.accountLink) {
                this.$.accountLink.remove();
                this.$.accountLink = null;
            }

        },

        renderCounter: function () {
            var value = this.getCounter();
            this.$.selectable.toggleClass('show-counter', value > 0);
            if (value > 999) value = '999+';
            this.$.counter.text(value === 0 ? '' : value);
        },

        getTitle: function () {
            var title = this.model.get('display_title') || this.options.title || this.model.get('title') || '';

            // domain suffix for federated sharing
            var indicateFederatedShare = this.model.is('drive') && (this.model.get('folder_id') === '10' || this.model.get('folder_id') === '15') && this.model.is('federated-sharing');
            if (indicateFederatedShare) {
                var suffix = this.model.getAccountDisplayName();
                title = suffix ? title + ' (' + suffix + ')' : title;
            }

            return (this.realNames === true ? this.model.get('folder_name') || title : title);
        },

        renderTooltip: function () {
            // don't overwrite custom title
            if (this.options.title) return;
            if (!this.model.has('title')) return;
            var summary = [], a11ysummary = [];

            if (this.model.supports('count_total')) {
                var data = this.model.toJSON();
                // wrong counts for unifiedroot folder
                if (account.isUnifiedRoot(this.model.get('id'))) data = _.pick(data, 'title');
                if (_.isNumber(data.total) && data.total >= 0) {

                    //#. Used for the total count of objects or mails in a folder
                    summary.push(gt('Total: %1$d', data.total));
                    if (data.total > 0) a11ysummary.push(gt('%1$d total', data.total));
                }
                if (_.isNumber(data.unread) && data.unread >= 0) {
                    //#. Used for the count of unread mails in a folder
                    summary.push(gt('Unread: %1$d', data.unread));
                    if (data.unread > 0) a11ysummary.push(gt('%1$d unread', data.unread));
                }
                summary = summary.join(', ');
                a11ysummary = a11ysummary.reverse().join(', ');
                if (summary) summary = ' (' + summary + ')';
                if (a11ysummary) a11ysummary = ', ' + a11ysummary + '. ' + gt('Right click for more options.');
            }
            this.$el.attr('aria-label', this.getTitle() + a11ysummary + this.getA11yDescription());
            this.$.selectable.attr('title', this.getTitle() + summary);
        },

        renderContextControl: function () {
            // store contextmenu type in main node
            if (_.device('smartphone')) return this.$el.attr('data-contextmenu', this.options.contextmenu || 'default');
            var title = this.getTitle();
            this.$el.attr('aria-haspopup', true);
            this.$.selectable.append(
                $('<a tabindex="-1" href="#" role="button" class="folder-options contextmenu-control" data-toggle="dropdown">').attr({
                    'data-contextmenu': this.options.contextmenu || 'default',
                    'title': !title ? gt('Folder-specific actions') :
                        //#. %1$s is the name of the folder
                        gt('Actions for %1$s', title)
                })
                .append($('<i class="fa fa-bars" aria-hidden="true">'))
            );
        },

        renderFolderLabel: function () {
            this.$.label.text(this.getTitle());
        },

        renderAttributes: function () {
            this.$el.attr({
                'data-id': this.folder,
                'data-model': this.options.model_id,
                'data-contextmenu-id': this.options.contextmenu_id,
                'data-favorite': this.options.inFavorites
            });
        },

        isEmpty: function () {
            return this.$.subfolders.children().length === 0;
        },

        renderEmpty: function () {
            if (this.options.empty !== false) return;
            // only show if not empty, i.e. has subfolder
            this.$el.toggleClass('empty', this.isEmpty());

            // show favorites tree node if only files exists in favorites
            if (this.model.get('id') === 'virtual/favorites/infostore') {
                this.$el.toggleClass('show-anyway', !!this.collection.length);
            }
        },

        renderIcon: function () {

            var o = this.options, type, iconClass = o.iconClass,
                infostoreDefaultFolder, attachmentView, allAttachmentsFolder;

            if ((o.tree.module !== 'infostore' && !o.icons) || !/^(mail|infostore|notes)$/.test(o.tree.module)) return;

            if (o.tree.module === 'mail') {
                type = account.getType(this.folder) || 'default';
                this.$.icon.addClass('visible ' + type);
                return;
            }

            if (!iconClass) {
                infostoreDefaultFolder = String(api.getDefaultFolder('infostore'));
                attachmentView = settings.get('folder/mailattachments', {});
                allAttachmentsFolder = String(attachmentView.all);

                switch (this.folder) {
                    case 'virtual/myshares':
                        iconClass = 'visible myshares';
                        break;
                    case 'virtual/favorites/infostore':
                        iconClass = 'visible myfavorites';
                        break;
                    case allAttachmentsFolder:
                        iconClass = 'visible attachments';
                        break;
                    case infostoreDefaultFolder:
                        iconClass = 'visible myfiles';
                        break;
                    // no default
                }
                if (!iconClass && api.is('trash', this.model.attributes) && this.model.get('standard_folder')) {
                    iconClass = 'visible trash';
                }
            } else {
                iconClass = 'visible ' + iconClass;
            }

            this.$.icon.addClass(iconClass);
        },

        render: function () {
            this.renderAttributes();
            this.renderEmpty();
            this.renderTooltip();
            this.renderCounter();
            this.renderIcon();
            this.onChangeSubFolders();
            if (this.model) {
                ext.point('io.ox/core/foldertree/node').invoke('draw', this.$el, ext.Baton({ view: this, data: this.model.toJSON() }));
                return this;
            }
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
