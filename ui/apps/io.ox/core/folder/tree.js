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
    ['io.ox/core/folder/node',
     'io.ox/core/folder/selection',
     'io.ox/core/folder/api',
     'io.ox/core/api/account',
     'io.ox/core/extensions',
     'io.ox/core/folder/favorites',
     'io.ox/core/folder/extensions',
     'less!io.ox/core/folder/style'], function (TreeNodeView, Selection, api, account, ext) {

    'use strict';

    var TreeView = Backbone.View.extend({

        className: 'folder-tree abs',

        events: {
            'click .contextmenu-control': 'onToggleContextMenu',
            'keydown .contextmenu-control': 'onKeydown',
        },

        initialize: function (options) {

            options = _.extend({ contextmenu: false }, options);

            this.app = options.app;
            this.root = options.root || '1';
            this.module = options.module;
            this.open = options.open;
            this.flat = !!options.flat;
            this.context = options.context || 'app';
            this.all = !!options.all;
            this.selection = new Selection(this);
            this.$el.attr({ role: 'tree', tabindex: '1' }).data('view', this);
            this.$contextmenu = $();
            this.options = options;

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
                _.defer(function () {
                    this.selection.set(id);
                }.bind(this));
            });
        },

        filter: function (folder, model) {
            // only standard folder on top level
            if (this.module === 'mail' && folder === '1') {
                return account.isStandardFolder(model.id);
            }
            // other folders
            var module = model.get('module');
            return module === this.module || (module === 'mail' && (/^default\d+(\W|$)/i).test(model.id));
        },

        getOpenFolders: function () {
            return _(this.$el.find('.folder.open'))
                .map(function (node) { return $(node).attr('data-id'); })
                .sort();
        },

        getTreeNodeOptions: function (options, model) {
            if (this.context === 'app' && model.get('id') === 'default0/INBOX') {
                options.subfolders = false;
            }
            if (this.flat && options.parent !== this) {
                options.subfolders = false;
            }
            return options;
        },

        onToggleContextMenu: (function () {

            function renderItems(dropdown, continuation) {
                dropdown.find('.dropdown-menu').idle();
                continuation();
            }

            return function (e) {

                var dropdown = this.$contextmenu,
                    isOpen = dropdown.hasClass('open'),
                    target = $(e.currentTarget);

                // return early on close
                if (isOpen) return;

                _.defer(function () {

                    // calculate proper position
                    var offset = target.offset(),
                        top = offset.top - 7,
                        left = offset.left + target.outerWidth() + 7;

                    dropdown.find('.dropdown-menu').css({ top: top, left: left, bottom: 'auto' }).busy();
                    dropdown.addClass('open').data('previous-focus', target); // helps to restore focus (see renderContextMenu)

                    // load relevant code on demand
                    require(['io.ox/core/folder/contextmenu'], _.lfo(renderItems, dropdown, this.renderContextMenuItems.bind(this)));

                }.bind(this));
            };
        }()),

        onKeydown: function (e) {

            var dropdown = this.$contextmenu;
            if (!dropdown.hasClass('open')) return; // done if not open
            if (e.shiftKey && e.which === 9) return; // shift-tab

            switch (e.which) {
            case 9:  // tab
            case 40: // cursor down
                e.preventDefault();
                return dropdown.find('.dropdown-menu > li:first > a').focus();
            case 38: // cursor up
                e.preventDefault();
                return dropdown.find('.dropdown-menu > li:last > a').focus();
            case 27: // escape
                return dropdown.find('.dropdown-toggle').dropdown('toggle');
            }
        },

        renderContextMenuItems: function () {
            var id = this.selection.get(),
                app = this.app,
                module = this.module,
                ul = this.$contextmenu.find('.dropdown-menu').empty(),
                point = 'io.ox/core/foldertree/contextmenu',
                view = this;
            // get folder data and redraw
            api.get(id).done(function (data) {
                var baton = new ext.Baton({ app: app, data: data, view: view, module: module });
                ext.point(point).invoke('draw', ul, baton);
                // check if menu exceeds viewport
                if (ul.offset().top + ul.outerHeight() > $(window).height() - 20) {
                    ul.css({ top: 'auto', bottom: '20px' });
                }
            });
        },

        renderContextMenu: function () {
            this.$el.after(
                this.$contextmenu = $('<div class="context-dropdown dropdown" data-action="context-menu">').append(
                    $('<div class="abs context-dropdown-overlay">'),
                    $('<a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true">'),
                    $('<ul class="dropdown-menu" role="menu">')
                )
                .on('hidden.bs.dropdown', function () {
                    // restore focus
                    var node = $(this).data('previous-focus');
                    if (node) node.parent().focus();
                })
            );
        },

        render: function () {
            ext.point('io.ox/core/foldertree/' + this.module + '/' + this.context).invoke('draw', this.$el, this);
            return this;
        }
    });

    return TreeView;
});
