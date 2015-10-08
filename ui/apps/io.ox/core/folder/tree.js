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

define('io.ox/core/folder/tree', [
    'io.ox/backbone/disposable',
    'io.ox/core/folder/selection',
    'io.ox/core/folder/api',
    'io.ox/core/extensions',
    'settings!io.ox/core',
    'gettext!io.ox/core',
    'io.ox/core/folder/favorites',
    'io.ox/core/folder/extensions'
], function (DisposableView, Selection, api, ext, settings, gt) {

    'use strict';

    var TreeView = DisposableView.extend({

        className: 'folder-tree',

        events: {
            'click .contextmenu-control':                    'onToggleContextMenu',
            'keydown .contextmenu-control':                  'onKeydown',
            'contextmenu .folder.selectable[aria-haspopup="true"], .contextmenu-control': 'onContextMenu'
        },

        initialize: function (options) {

            options = _.extend({
                context: 'app',
                contextmenu: false,
                customize: $.noop,
                disable: $.noop,
                abs: true,
                icons: settings.get('features/folderIcons', false),
                root: 'default0/INBOX',
                highlight: _.device('!smartphone'),
                highlightclass: 'visible-selection',
                hideTrashfolder: false
            }, options);

            this.all = !!options.all;
            this.app = options.app;
            this.context = options.context;
            this.flat = !!options.flat;
            this.module = options.module;
            this.open = options.open;
            this.root = options.root;

            this.$el.data('view', this);
            this.$container = $('<ul class="tree-container f6-target" role="tree">');
            this.$dropdown = $();
            this.$dropdownMenu = $();
            this.options = options;

            this.$el.toggleClass(options.highlightclass, !!options.highlight);
            this.$el.append(this.$container);

            this.$el.attr({
                'role': 'navigation'
            });

            this.selection = new Selection(this);

            if (options.abs) this.$el.addClass('abs');

            // add contextmenu?
            if (options.contextmenu) _.defer(this.renderContextMenu.bind(this));
        },

        // convenience function
        // to avoid evil trap: path might contains spaces
        appear: function (node) {
            var id = node.folder.replace(/\s/g, '_');
            this.trigger('appear:' + id, node);
        },

        // counter-part
        onAppear: function (id, handler) {
            id = String(id).replace(/\s/g, '_');
            this.once('appear:' + id, handler);
        },

        preselect: function (id) {
            // wait for node to appear
            if (id === undefined) return;
            this.onAppear(id, function () {
                // defer selection; might be too fast otherwise
                _.defer(this.selection.set.bind(this.selection, id));
            });
        },

        filter: function (folder, model) {
            // custom filter?
            var filter = this.options.filter,
                result = _.isFunction(filter) ? filter.apply(this, arguments) : undefined;
            if (result !== undefined) return result;
            // other folders
            var module = model.get('module');
            return module === this.module || (this.module === 'mail' && (/^default\d+(\W|$)/i).test(model.id));
        },

        getOpenFolders: function () {
            return _(this.$el.find('.folder.open')).chain()
                .map(function (node) { return $(node).attr('data-id'); })
                .uniq().value().sort();
        },

        getTreeNodeOptions: function (options, model) {
            if (model.get('id') === 'default0/INBOX' && options.parent.folder === 'virtual/standard') {
                // usually no subfolders; exception is altnamespace
                options.subfolders = !!api.altnamespace;
            }
            if (this.flat && options.parent !== this) {
                options.subfolders = false;
            }
            if (options.parent.folder === 'virtual/standard') {
                options.icons = true;
            }
            return options;
        },

        toggleContextMenu: function (target, top, left) {

            // return early on close
            var isOpen = this.$dropdown.hasClass('open');
            if (isOpen || _.device('smartphone')) return;

            // copy contextmenu id
            var contextmenu = target.is('.contextmenu-control') ?
                target.attr('data-contextmenu') :
                target.find('.contextmenu-control').first().attr('data-contextmenu');
            this.$dropdown.attr('data-contextmenu', contextmenu);

            _.defer(function () {

                // skip virtual folders
                var id = this.selection.get('data-contextmenu-id');
                if (api.isVirtual(id)) return;

                this.$dropdownMenu.css({ top: top, left: left, bottom: 'auto' }).empty().busy();
                this.$dropdown
                    // helps to restore focus (see renderContextMenu)
                    .data('previous-focus', target)
                    // use official method
                    .find('.dropdown-toggle').dropdown('toggle');

            }.bind(this));
        },

        onToggleContextMenu: function (e) {

            var target = $(e.currentTarget),
                // calculate proper position
                offset = target.offset(),
                top = offset.top - 7,
                left = offset.left + target.outerWidth() + 7;

            this.toggleContextMenu(target, top, left);
        },

        onContextMenu: function (e) {
            // clicks bubbles. right-click not
            e.stopPropagation();
            e.preventDefault();
            var target = $(e.currentTarget), top = e.pageY - 20, left = e.pageX + 30;
            if (target.is('.contextmenu-control')) {
                top = target.offset().top;
                left = target.offset().left + 40;
            }
            this.toggleContextMenu(target, top, left);
        },

        onCloseContextMenu: function (e) {
            e.preventDefault();
            if (!this.$dropdown.hasClass('open')) return;
            this.$dropdown.find('.dropdown-toggle').dropdown('toggle');
        },

        onKeydown: function (e) {

            var dropdown = this.$dropdown;
            // done if not open
            // if (!dropdown.hasClass('open')) return;
            // shift-tab
            // if (e.shiftKey && e.which === 9) return;
            switch (e.which) {
            case 32:
                // cursor down
                e.preventDefault();
                $(e.currentTarget).click();
                return dropdown.find('.dropdown-menu > li:first > a').focus();
            }
        },

        getContextMenuId: function (id) {
            return 'io.ox/core/foldertree/contextmenu/' + (id || 'default');
        },

        renderContextMenuItems: function (contextmenu) {
            var id = this.selection.get('data-contextmenu-id'),
                app = this.app,
                module = this.module,
                ul = this.$dropdownMenu.empty(),
                point = this.getContextMenuId(contextmenu),
                view = this;
            // get folder data and redraw
            api.get(id).done(function (data) {
                var baton = new ext.Baton({ app: app, data: data, view: view, module: module });
                ext.point(point).invoke('draw', ul, baton);
                if (_.device('smartphone')) {
                    ul.append(
                        $('<li>').append(
                            $('<a href="#" class="io-ox-action-link" data-action="close-menu">').text(gt('Close'))
                        )
                    );
                }
                if (_.device('smartphone')) ul.find('.divider').remove();
                // remove unwanted dividers
                ul.find('.divider').each(function () {
                    var node = $(this), next = node.next();
                    // remove leading, subsequent, and tailing dividers
                    if (node.prev().length === 0 || next.hasClass('divider') || next.length === 0) node.remove();
                });
                // check if menu exceeds viewport
                if (!_.device('smartphone') && ul.offset().top + ul.outerHeight() > $(window).height() - 20) {
                    ul.css({ top: 'auto', bottom: '20px' });
                }
            });
        },

        renderContextMenu: (function () {

            function renderItems(contextmenu) {
                this.$dropdownMenu.idle();
                this.renderContextMenuItems(contextmenu);
            }

            function show(e) {
                // load relevant code on demand
                var contextmenu = $(e.target).attr('data-contextmenu');
                require(['io.ox/core/folder/contextmenu'], _.lfo(renderItems.bind(this, contextmenu)));
            }

            function hide() {
                // restore focus
                var node = $(this).data('previous-focus');
                if (node) node.parent().focus();
            }

            return function () {

                this.$el.after(
                    this.$dropdown = $('<div class="context-dropdown dropdown" data-action="context-menu" data-contextmenu="default">').append(
                        $('<div class="abs context-dropdown-overlay">').on('contextmenu', this.onCloseContextMenu.bind(this)),
                        this.$dropdownToggle = $('<a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true">'),
                        this.$dropdownMenu = $('<ul class="dropdown-menu" role="menu">')
                    )
                    .on('show.bs.dropdown', show.bind(this))
                    .on('hidden.bs.dropdown', hide)
                );
                this.$dropdownToggle.dropdown();
            };
        }()),

        render: function () {
            ext.point('io.ox/core/foldertree/' + this.module + '/' + this.context).invoke('draw', this.$container, this);
            return this;
        }
    });

    return TreeView;
});
