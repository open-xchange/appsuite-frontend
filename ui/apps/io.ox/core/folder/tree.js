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
     'io.ox/core/capabilities',
     'io.ox/core/api/user',
     'gettext!io.ox/core',
     'io.ox/core/folder/favorites',
     'less!io.ox/core/folder/style'], function (TreeNodeView, Selection, api, account, ext, capabilities, userAPI, gt) {

    'use strict';

    var TreeView = Backbone.View.extend({

        className: 'folder-tree',

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
            this.selection = new Selection(this);
            this.$el.attr({ role: 'tree', tabindex: '1' }).data('view', this);
            this.$contextmenu = $();

            // add contextmenu?
            if (this.options.contextmenu) _.defer(this.renderContextMenu.bind(this));
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
            this.onAppear(id, function () {
                // defer selection; might be too fast otherwise
                _.defer(function () {
                    this.selection.set(id);
                }.bind(this));
            });
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

        getOpenFolders: function () {
            return _(this.$el.find('.folder.open'))
                .map(function (node) { return $(node).attr('data-id'); })
                .sort();
        },

        getTreeNodeOptions: function (options, model) {
            if (model.get('id') === 'default0/INBOX') {
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
                var baton = new ext.Baton({ app: app, data: data, view: view, options: { type: module } });
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
            ext.point('io.ox/core/foldertree/' + this.module).invoke('draw', this.$el, this);
            return this;
        }
    });

    //
    // Top-level extensions
    // ------------------------------------------------------------------------------------------------------------
    //

    var INDEX = 100;

    //
    // Mail
    //

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
                    new TreeNodeView({ folder: tree.root, headless: true, open: true, tree: tree, parent: tree })
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
                    $('<section>')
                        .css('color', '#aaa')
                        .css('margin-bottom', '14px')
                        .text('You can also place stuff between folders')
                );
            }
        },
        {
            id: 'local-folders',
            index: INDEX += 100,
            draw: function (tree) {
                // local folders
                this.append(
                    new TreeNodeView({
                        count: 0,
                        folder: 'virtual/default0', // convention! virtual folders are identified by their id starting with "virtual"
                        model_id: 'default0/INBOX',
                        parent: tree,
                        title: 'My folders',
                        tree: tree
                    })
                    .render().$el
                );
            }
        },
        {
            id: 'remote-accounts',
            index: INDEX += 100,
            draw: function (tree) {

                var placeholder = $('<div>');
                this.append(placeholder);

                account.all().done(function (accounts) {
                    accounts.shift();
                    placeholder.replaceWith(
                        _(accounts).map(function (account) {
                            // remote account
                            return new TreeNodeView({
                                count: 0,
                                folder: 'virtual/default' + account.id,
                                model_id: 'default' + account.id,
                                parent: tree,
                                tree: tree
                            })
                            .render().$el;
                        })
                    );
                });
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

    //
    // Files / Drive
    //

    ext.point('io.ox/core/foldertree/infostore').extend(
        {
            id: 'standard-folders',
            index: 100,
            draw: function (tree) {
                this.append(
                    // standard folders
                    new TreeNodeView({ folder: tree.root, headless: true, open: true, tree: tree, parent: tree })
                    .render().$el
                );
            }
        }
    );

    function addFolder(e) {
        ox.load(['io.ox/core/folder/actions/add']).done(function (add) {
            add(e.data.folder, { module: e.data.module });
        });
    }



    _('contacts calendar tasks'.split(' ')).each(function (module) {

        //
        // Flat trees
        //

        ext.point('io.ox/core/foldertree/' + module).extend({
            id: 'standard-folders',
            index: 100,
            draw: function (tree) {

                var links = $('<div class="links">'),
                    baton = ext.Baton({ module: module, view: tree }),
                    folder = 'virtual/flat/' + module,
                    model_id = 'flat/' + module,
                    defaults = { count: 0, empty: false, indent: false, open: false, tree: tree, parent: tree };

                ext.point('io.ox/core/foldertree/' + module + '/links').invoke('draw', links, baton);

                this.append(
                    // private folders
                    new TreeNodeView(_.extend({}, defaults, { empty: true, folder: folder + '/private', model_id: model_id + '/private', title: gt('Private'), virtual: true }))
                    .render().$el.addClass('section'),
                    // links
                    links,
                    // public folders
                    new TreeNodeView(_.extend({}, defaults, { folder: folder + '/public', model_id: model_id + '/public', title: gt('Public') }))
                    .render().$el.addClass('section'),
                    // shared folders
                    new TreeNodeView(_.extend({}, defaults, { folder: folder + '/shared', model_id: model_id + '/shared', title: gt('Shared') }))
                    .render().$el.addClass('section'),
                    // hidden folders
                    new TreeNodeView(_.extend({}, defaults, { folder: folder + '/hidden', model_id: model_id + '/hidden', title: gt('Hidden') }))
                    .render().$el.addClass('section')
                );
            }
        });

        //
        // Links
        //

        ext.point('io.ox/core/foldertree/' + module + '/links').extend(
            {
                index: 200,
                id: 'private',
                draw: function (baton) {

                    var module = baton.module, folder = api.getDefaultFolder(module);

                    this.append($('<div>').append(
                        $('<a href="#" tabindex="1" data-action="add-subfolder" role="menuitem">')
                        .text(
                            module === 'calendar' ? gt('New private calendar') : gt('New private folder')
                        )
                        .on('click', { folder: folder, module: module }, addFolder)
                    ));
                }
            },
            {
                index: 300,
                id: 'public',
                draw: function (baton) {

                    // yep, show this below private section.
                    // cause there might be no public folders, and in this case
                    // the section would be hidden
                    if (!capabilities.has('edit_public_folders')) return;

                    var node = $('<div>'), module = baton.module;
                    this.append(node);

                    api.get('2').done(function (public_folder) {
                        if (!api.can('create', public_folder)) return;
                        node.append(
                            $('<a href="#" tabindex="1" data-action="add-subfolder" role="menuitem">')
                            .text(
                                module === 'calendar' ? gt('New public calendar') : gt('New public folder')
                            )
                            .on('click', { folder: '2', module: module }, addFolder)
                        );
                    });
                }
            }
        );

        //
        // Shared folders
        //

        ext.point('io.ox/core/foldertree/node').extend({
            id: 'scaffold-shared',
            index: 100,
            scaffold: function (baton) {

                var model = baton.view.model, data = model.toJSON();
                if (!api.is('shared', data)) return;

                this.addClass('shared').find('.selectable').append(
                    $('<div class="owner">').append(
                        userAPI.getLink(data.created_by, data['com.openexchange.folderstorage.displayName']).attr({ tabindex: -1 })
                    )
                );
            }
        });
    });

    return TreeView;
});
