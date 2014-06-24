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

define('io.ox/core/folder/contextmenu',
    ['io.ox/core/extensions',
     'io.ox/core/folder/actions/common',
     'io.ox/core/api/folder',
     'io.ox/core/notifications',
     'io.ox/core/capabilities',
     'gettext!io.ox/core'], function (ext, actions, api, notifications, capabilities, gt) {

    'use strict';

    var point = ext.point('io.ox/core/foldertree/contextmenu');

    //
    // drawing utility functions
    //

    function a(action, text) {
        return $('<a href="#" tabindex="1" role="menuitem">').attr('data-action', action).text(text);
    }

    function disable(node) {
        return node.attr('aria-disabled', true).removeAttr('tabindex')
            .addClass('disabled').on('click', $.preventDefault);
    }

    function addLink(node, options) {
        var link = a(options.action, options.text);
        if (options.enabled) link.on('click', options.data, options.handler); else disable(link);
        node.append($('<li>').append(link));
        return link;
    }

    function divider() {
        this.append(
            $('<li class="divider" role="presentation" aria-hidden="true">')
        );
    }

    var extensions = {

        //
        // Mark all mails as read
        //
        markFolderSeen: function (baton) {

            if (baton.options.type !== 'mail') return;

            addLink(this, {
                action: 'markfolderread',
                data: { folder: baton.data.id, app: baton.app },
                enabled: true,
                handler: actions.markFolderSeen,
                text: gt('Mark all mails as read')
            });
        },

        //
        // Clean up / Expunge
        //
        expunge: function (baton) {

            if (baton.options.type !== 'mail') return;

            addLink(this, {
                action: 'expunge',
                data: { folder: baton.data.id },
                enabled: api.can('delete', baton.data),
                handler: actions.expungeFolder,
                text: gt('Clean up')
            });
        },

        //
        // Empty folder
        //
        empty: function (baton) {

            if (baton.options.type !== 'mail') return;

            addLink(this, {
                action: 'clearfolder',
                data: { baton: baton },
                enabled: api.can('delete', baton.data),
                handler: actions.clearFolder,
                text: gt('Empty folder')
            });
        },

        //
        // Add folder
        //
        add: (function () {

            function handler(e) {
                e.preventDefault();
                ox.load(['io.ox/core/folder/add']).done(function (add) {
                    add(e.data.folder, { module: e.data.module });
                });
            }

            return function (baton) {

                // only mail and infostore show hierarchies
                if (/^(contacts|calendar|tasks)$/.test(baton.options.type)) return;
                if (!api.can('create', baton.data)) return;

                addLink(this, {
                    action: 'add-subfolder',
                    data: { app: baton.app, folder: baton.data.id, module: baton.options.type },
                    enabled: true,
                    handler: handler,
                    text: gt('New subfolder')
                });
            };
        }()),

        //
        // Rename folder
        //
        rename: (function () {

            function handler(e) {
                e.preventDefault();
                e.data.app.folderView.rename();
            }

            return function (baton) {

                if (!api.can('rename', baton.data)) return;

                addLink(this, {
                    action: 'rename',
                    data: { app: baton.app },
                    enabled: true,
                    handler: handler,
                    text: gt('Rename')
                });
            };
        }()),

        //
        // Delete folder
        //
        deleteFolder: (function () {

            function handler(e) {
                e.preventDefault();
                e.data.app.folderView.remove();
            }

            return function (baton) {

                if (!api.can('deleteFolder', baton.data)) return;

                addLink(this, {
                    action: 'delete',
                    data: { app: baton.app },
                    enabled: true,
                    handler: handler,
                    text: gt('Delete')
                });
            };
        }()),

        //
        // Move
        //
        move: (function () {

            function handler(e) {
                e.preventDefault();
                var baton = e.data.baton;
                require(['io.ox/core/folder/move'], function (move) {
                    move(baton);
                });
            }

            return function (baton) {

                if (!/^(mail|infostore)$/.test(baton.options.type)) return;
                if (_.device('smartphone')) return;
                if (!api.can('deleteFolder', baton.data)) return;

                addLink(this, {
                    action: 'move',
                    data: { baton: baton },
                    enabled: true,
                    handler: handler,
                    text: gt('Move')
                });
            };
        }()),

        //
        // Export folder
        //
        exportData: (function () {

            function handler(e) {
                e.preventDefault();
                require(['io.ox/core/export/export'], function (exporter) {
                    //module,folderid
                    exporter.show(e.data.baton.data.module, String(e.data.baton.app.folderView.selection.get()));
                });
            }

            return function (baton) {

                if (_.device('ios || android')) return;
                if (!api.can('export', baton.data)) return;

                addLink(this, {
                    action: 'export',
                    data: { baton: baton },
                    enabled: true,
                    handler: handler,
                    text: gt('Export')
                });
            };
        }()),

        //
        // Import data
        //
        importData: (function () {

            function handler(e) {
                e.preventDefault();
                require(['io.ox/core/import/import'], function (importer) {
                    importer.show(e.data.baton.data.module, String(e.data.baton.app.folderView.selection.get()));
                });
            }

            return function (baton) {

                if (_.device('ios || android')) return;
                if (!api.can('import', baton.data)) return;

                addLink(this, {
                    action: 'import',
                    data: { baton: baton },
                    enabled: true,
                    handler: handler,
                    text: gt('Import')
                });
            };
        }()),

        //
        // Permissions
        //
        permissions: (function () {

            function handler(e) {
                e.preventDefault();
                var folder = String(e.data.app.folder.get());
                require(['io.ox/core/permissions/permissions'], function (permissions) {
                    permissions.show(folder);
                });
            }

            return function (baton) {

                if (!capabilities.has('gab')) return;
                if (capabilities.has('alone')) return;
                if (_.device('smartphone')) return;

                addLink(this, {
                    action: 'permissions',
                    data: { app: baton.app },
                    enabled: true,
                    handler: handler,
                    text: gt('Permissions')
                });
            };
        }()),

        //
        // Publish folder
        //
        publish: (function () {

            function handler(e) {
                e.preventDefault();
                require(['io.ox/core/pubsub/publications'], function (publications) {
                    publications.buildPublishDialog(e.data.baton);
                });
            }

            return function (baton) {

                if (!api.can('publish', baton.data) || api.is('trash', baton.data)) return;

                var tempLink, node, self = this;

                node = $('<li>').append(
                    tempLink = a('publications', gt('Share this folder'))
                );

                if (capabilities.has('publication')) {
                    tempLink.on('click', { baton: baton }, handler);
                    this.append(node);
                } else {
                    require(['io.ox/core/upsell'], function (upsell) {
                        if (upsell.enabled(['publication'])) {
                            tempLink.on('click', function () {
                                upsell.trigger({
                                    type: 'inline-action',
                                    id: 'io.ox/core/foldertree/contextmenu/publications',
                                    missing: upsell.missing(['publication'])
                                });
                            });
                            self.append(node);
                        }
                    });
                }
            };
        }()),

        //
        // Subscribe folder
        //
        subscribe: (function () {

            function handler(e) {
                e.preventDefault();
                require(['io.ox/core/pubsub/subscriptions'], function (subscriptions) {
                    subscriptions.buildSubscribeDialog(e.data);
                });
            }

            return function (baton) {

                if (!api.can('subscribe', baton.data || api.is('trash', baton.data))) return;

                var tempLink, node, self = this;

                node = $('<li>').append(
                    tempLink = a('subscriptions', gt('New subscription'))
                );

                if (capabilities.has('subscription')) {
                    tempLink.on('click', { folder: baton.data.folder_id, module: baton.data.module, app: baton.app }, handler);
                    this.append(node);
                } else {
                    require(['io.ox/core/upsell'], function (upsell) {
                        if (upsell.enabled(['subscription'])) {
                            tempLink.on('click', function () {
                                upsell.trigger({
                                    type: 'inline-action',
                                    id: 'io.ox/core/foldertree/contextmenu/subscribe',
                                    missing: upsell.missing(['subscription'])
                                });
                            });
                            self.append(node);
                        }
                    });
                }
            };
        }()),

        //
        // Folder properties
        //

        properties: (function () {

            function handler(e) {
                e.preventDefault();
                var id = e.data.baton.app.folder.get();
                require(['io.ox/core/folder/properties'], function (fn) {
                    fn(id);
                });
            }

            return function (baton) {

                if (_.device('smartphone')) return;

                addLink(this, {
                    action: 'properties',
                    data: { baton: baton },
                    enabled: true,
                    handler: handler,
                    text: gt('Properties')
                });
            };
        }()),

        //
        // Hide/show folder
        //

        toggle: (function () {

            function handler(e) { // move folder to hidden folders section or removes it from there
                e.preventDefault();
                require(['io.ox/core/folder/toggle'], function (fn) {
                    fn(e.data.baton, e.data.state, point);
                });
            }

            return function (baton) {

                if (baton.options.view !== 'FolderList') return;
                if (_.device('smartphone')) return;
                if (!baton.data.id) return; // if data is empty we have nothing to do here

                var settings = baton.app.settings,
                    // apps have their own blacklists for hidden folders
                    hide = !settings.get('folderview/blacklist', {})[baton.data.id];

                // always show unhide function (we don't want to loose folders here) but hide only when it's not a standard folder
                if (baton.data.standard_folder || hide) return;

                addLink(this, {
                    action: 'hide',
                    data: { baton: baton, state: !hide, point: point },
                    enabled: true,
                    handler: handler,
                    text: hide ? gt('Hide'): gt('Show')
                });
            };
        }())
    };

    //
    // Extensions
    //

    point.extend(
        {
            id: 'mark-folder-read',
            index: 100,
            draw: extensions.markFolderSeen
        },
        {
            id: 'expunge',
            index: 200,
            draw: extensions.expunge
        },
        {
            id: 'divider-1',
            index: 300,
            draw: divider
        },
        // -----------------------------------------------
        {
            id: 'add-folder',
            index: 1000,
            draw: extensions.add
        },
        {
            id: 'rename',
            index: 1100,
            draw: extensions.rename
        },
        {
            id: 'move',
            index: 1200,
            draw: extensions.move
        },
        {
            id: 'publications',
            index: 1300,
            draw: extensions.publish
        },
        {
            id: 'subscribe',
            index: 1400,
            draw: extensions.subscribe
        },
        {
            id: 'divider-2',
            index: 1500,
            draw: divider
        },
        // -----------------------------------------------
        {
            id: 'import',
            index: 2100,
            draw: extensions.importData
        },
        {
            id: 'export',
            index: 2200,
            draw: extensions.exportData
        },
        {
            id: 'divider-3',
            index: 2300,
            draw: divider
        },
        // -----------------------------------------------
        {
            id: 'permissions',
            index: 3100,
            draw: extensions.permissions
        },
        {
            id: 'properties',
            index: 3200,
            draw: extensions.properties
        },
        {
            id: 'divider-4',
            index: 3300,
            draw: divider
        },
        // -----------------------------------------------
        {
            id: 'toggle',
            index: 4100,
            draw: extensions.toggle
        },
        {
            id: 'empty',
            index: 4200,
            draw: extensions.empty
        },
        {
            id: 'delete',
            index: 4300,
            draw: extensions.deleteFolder
        }
    );
});
