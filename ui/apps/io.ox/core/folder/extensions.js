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

define('io.ox/core/folder/extensions',
    ['io.ox/core/folder/node',
     'io.ox/core/folder/api',
     'io.ox/core/api/account',
     'io.ox/core/extensions',
     'io.ox/core/capabilities',
     'io.ox/core/api/user',
     'gettext!io.ox/core',
     'io.ox/core/folder/favorites',
     'less!io.ox/core/folder/style'], function (TreeNodeView, api, account, ext, capabilities, userAPI, gt) {

    'use strict';

    var extensions = {

        standardFolders: function (tree) {
            this.append(
                // standard folders
                new TreeNodeView({ folder: tree.root, headless: true, open: true, tree: tree, parent: tree })
                .render().$el.addClass('standard-folders')
            );
        },

        localFolders: function (tree) {
            this.append(
                // local folders
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
        },

        remoteAccounts: function (tree) {
            this.append(
                new TreeNodeView({
                    //empty: false,
                    filter: function (id, model) {
                        return account.isExternal(model.get('id'));
                    },
                    folder: '1',
                    headless: true,
                    open: true,
                    tree: tree,
                    parent: tree
                })
                .render().$el.addClass('remote-accounts')
            );
        },

        publicFolders: function (tree) {
            this.append(
                new TreeNodeView({
                    //empty: false,
                    filter: function (id, model) {
                        return /^default0\/(Public|Shared)$/.test(model.get('id'));
                    },
                    folder: '1',
                    headless: true,
                    open: true,
                    tree: tree,
                    parent: tree
                })
                .render().$el
            );
        }
    };

    var INDEX = 100;

    //
    // Mail
    //

    ext.point('io.ox/core/foldertree/mail/app').extend(
        {
            id: 'standard-folders',
            index: INDEX += 100,
            draw: extensions.standardFolders
        },
        {
            id: 'local-folders',
            index: INDEX += 100,
            draw: extensions.localFolders
        },
        {
            id: 'remote-accounts',
            index: INDEX += 100,
            draw: extensions.remoteAccounts
        },
        {
            id: 'public',
            index: INDEX += 100,
            draw: extensions.publicFolders
        }
    );

    ext.point('io.ox/core/foldertree/mail/popup').extend(
        {
            id: 'standard-folders',
            draw: extensions.standardFolders
        },
        {
            id: 'remote-accounts',
            draw: extensions.remoteAccounts
        }
    );

    // looks identical to popup but has no favorites
    ext.point('io.ox/core/foldertree/mail/subscribe').extend(
        {
            id: 'standard-folders',
            draw: extensions.standardFolders
        },
        {
            id: 'remote-accounts',
            draw: extensions.remoteAccounts
        }
    );

    ext.point('io.ox/core/foldertree/mail/account').extend(
        {
            id: 'standard-folders',
            draw: extensions.standardFolders
        }
    );

    //
    // Files / Drive
    //

    ext.point('io.ox/core/foldertree/infostore/app').extend({
        id: 'standard-folders',
        index: 100,
        draw: extensions.standardFolders
    });

    ext.point('io.ox/core/foldertree/infostore/popup').extend({
        id: 'standard-folders',
        index: 100,
        draw: extensions.standardFolders
    });

    // helper

    function addFolder(e) {
        ox.load(['io.ox/core/folder/actions/add']).done(function (add) {
            add(e.data.folder, { module: e.data.module });
        });
    }

    _('contacts calendar tasks'.split(' ')).each(function (module) {

        //
        // Flat trees
        //

        var defaultExtension = {
            id: 'standard-folders',
            index: 100,
            draw: function (tree) {

                var links = $('<div class="links">'),
                    baton = ext.Baton({ module: module, view: tree, context: tree.context }),
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
        };

        ext.point('io.ox/core/foldertree/' + module + '/app').extend(_.extend({}, defaultExtension));
        ext.point('io.ox/core/foldertree/' + module + '/popup').extend(_.extend({}, defaultExtension));

        //
        // Links
        //

        ext.point('io.ox/core/foldertree/' + module + '/links').extend(
            {
                index: 200,
                id: 'private',
                draw: function (baton) {

                    if (baton.context !== 'app') return;

                    var module = baton.module, folder = api.getDefaultFolder(module);

                    this.append(
                        $('<div>').append(
                            $('<a href="#" tabindex="1" data-action="add-subfolder" role="menuitem">')
                            .text(
                                module === 'calendar' ? gt('New private calendar') : gt('New private folder')
                            )
                            .on('click', { folder: folder, module: module }, addFolder)
                        )
                    );
                }
            },
            {
                index: 300,
                id: 'public',
                draw: function (baton) {

                    if (baton.context !== 'app') return;
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

    return extensions;
});
