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

define('io.ox/core/folder/contextmenu', [
    'io.ox/core/extensions',
    'io.ox/core/folder/actions/common',
    'io.ox/core/folder/api',
    'io.ox/core/capabilities',
    'gettext!io.ox/core'
], function (ext, actions, api, capabilities, gt) {

    'use strict';

    //
    // drawing utility functions
    //

    function a(action, text) {
        return $('<a href="#" tabindex="1" role="menuitem">')
            .attr('data-action', action).text(text)
            // always prevent default
            .on('click', $.preventDefault);
    }

    function disable(node) {
        return node.attr('aria-disabled', true).removeAttr('tabindex').addClass('disabled');
    }

    function addLink(node, options) {
        var link = a(options.action, options.text);
        if (options.enabled) link.on('click', options.data, options.handler); else disable(link);
        node.append($('<li role="presentation">').append(link));
        return link;
    }

    function divider() {
        this.append(
            $('<li class="divider" role="presentation" aria-hidden="true">')
        );
    }

    var ColorSelectionView = Backbone.View.extend({
        tagName: 'div',
        className: 'custom-colors',
        events: {
            'click .color-label': 'select',
            'remove': 'onRemove'
        },
        initialize: function () {
            this.listenTo(this.model, 'change:meta', this.update);
        },
        update: function () {
            //toggle active class
            $('.active', this.$el).removeClass('active').attr('aria-checked', false);
            $('.color-label-' + this.model.get('meta').color_label, this.$el).addClass('active').attr('aria-checked', true);
        },
        select: function (e) {
            var meta = _.extend({},
                this.model.get('meta'),
                { color_label: $(e.target).data('index') }
            );

            api.update(this.model.get('id'), { meta: meta }).fail(function (error) {
                require(['io.ox/core/notifications'], function (notifications) {
                    notifications.yell(error);
                });
            });

            //prevent dialog from closing
            e.stopPropagation();
            e.preventDefault();
        },
        render: function (util) {
            var folderColor = util.getFolderColor({ meta: this.model.get('meta') }),
                self = this;

            _(_.range(1, 11)).each(function (colorNumber) {
                self.$el.append(
                    $('<div class="color-label pull-left" tabindex="1" role="checkbox">')
                    .addClass('color-label-' + colorNumber)
                    .addClass(folderColor == colorNumber ? 'active' : '')
                    .attr({
                        'data-index': colorNumber,
                        'aria-checked': folderColor == colorNumber,
                        'aria-label': util.getColorLabel(colorNumber)
                    })
                    .append('<i class="fa fa-check">')
                );
            });

            return this;
        },
        onRemove: function () {
            this.stopListening();
        }
    });

    var extensions = {

        //
        // Mark all mails as read
        //
        markFolderSeen: function (baton) {

            if (baton.module !== 'mail') return;

            addLink(this, {
                action: 'markfolderread',
                data: { folder: baton.data.id, app: baton.app },
                enabled: true,
                handler: actions.markFolderSeen,
                text: gt('Mark all messages as read')
            });
        },

        //
        // Move all messages to a target folder ...
        //
        moveAllMessages: function (baton) {
            // disabled until API ready
            if (true || baton.module !== 'mail') return;

            addLink(this, {
                action: 'move-all-messages',
                data: { folder: baton.data.id, app: baton.app },
                enabled: true,
                handler: function () {
                    alert('Available once we get the proper API action');
                },
                text: gt('Move all messages')
            });
        },

        //
        // Clean up / Expunge
        //
        expunge: function (baton) {

            if (baton.module !== 'mail') return;

            addLink(this, {
                action: 'expunge',
                data: { folder: baton.data.id },
                enabled: api.can('delete', baton.data),
                handler: actions.expungeFolder,
                text: gt('Clean up')
            });
        },

        //
        // Archive messages
        //
        archive: (function () {

            function handler(e) {
                ox.load(['io.ox/core/folder/actions/archive']).done(function (archive) {
                    archive(e.data.id);
                });
            }

            return function (baton) {

                if (baton.module !== 'mail') return;

                addLink(this, {
                    action: 'archive',
                    data: { id: baton.data.id },
                    enabled: api.can('delete', baton.data),
                    handler: handler,
                    //#. Verb: (to) archive messages
                    text: gt.pgettext('verb', 'Archive')
                });
            };

        }()),

        //
        // Empty folder
        //
        empty: function (baton) {

            if (baton.module !== 'mail' && baton.module !== 'infostore') return;

            addLink(this, {
                action: 'clearfolder',
                data: { id: baton.data.id, module: baton.module },
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
                ox.load(['io.ox/core/folder/actions/add']).done(function (add) {
                    add(e.data.folder, { module: e.data.module });
                });
            }

            return function (baton) {

                // only mail and infostore show hierarchies
                if (/^(contacts|calendar|tasks)$/.test(baton.module)) return;

                // special case: default0 with altnamespace
                var canCreate = baton.data.id === 'default0' && api.altnamespace;
                if (!canCreate && !api.can('create:folder', baton.data)) return;

                addLink(this, {
                    action: 'add-subfolder',
                    data: { app: baton.app, folder: baton.data.id, module: baton.module },
                    enabled: true,
                    handler: handler,
                    text: gt('Add new folder')
                });
            };
        }()),

        //
        // Rename folder
        //
        rename: (function () {

            function handler(e) {
                ox.load(['io.ox/core/folder/actions/rename']).done(function (rename) {
                    rename(e.data.id);
                });
            }

            return function (baton) {

                if (!api.can('rename', baton.data)) return;

                addLink(this, {
                    action: 'rename',
                    data: { id: baton.data.id },
                    enabled: true,
                    handler: handler,
                    text: gt('Rename')
                });
            };
        }()),

        //
        // Remove folder
        //
        removeFolder: (function () {

            function handler(e) {
                ox.load(['io.ox/core/folder/actions/remove']).done(function (remove) {
                    remove(e.data.id);
                });
            }

            return function (baton) {

                if (!api.can('remove:folder', baton.data)) return;

                addLink(this, {
                    action: 'delete',
                    data: { id: baton.data.id },
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
                require(['io.ox/core/folder/actions/move'], function (move) {
                    move.folder(e.data.id);
                });
            }

            return function (baton) {

                if (!/^(mail|infostore)$/.test(baton.module)) return;
                if (_.device('smartphone')) return;
                if (!api.can('remove:folder', baton.data)) return;

                addLink(this, {
                    action: 'move',
                    data: { id: baton.data.id },
                    enabled: true,
                    handler: handler,
                    text: gt('Move')
                });
            };
        }()),

        //
        // Zip folder
        //
        zip: (function () {

            function handler(e) {
                require(['io.ox/files/api'], function (api) {
                    api.zip(e.data.id);
                });
            }

            return function (baton) {

                if (_.device('smartphone')) return;
                if (baton.module !== 'infostore') return;

                addLink(this, {
                    action: 'zip',
                    data: { id: baton.data.id },
                    enabled: true,
                    handler: handler,
                    text: gt('Download entire folder')
                });
            };
        }()),

        //
        // Export folder
        //
        exportData: (function () {

            function handler(e) {
                require(['io.ox/core/export/export'], function (exporter) {
                    //module,folderid
                    exporter.show(e.data.baton.data.module, e.data.baton.data.id);
                });
            }

            return function (baton) {

                if (_.device('ios || android')) return;
                if (!api.can('export', baton.data)) return;
                if (baton.data.total === 0) return;
                if (!_.isNumber(baton.data.total) && baton.data.total !== null) return;

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
                    importer.show(e.data.baton.data.module, e.data.baton.data.id);
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
        // Subscribe folder
        //
        subscribe: (function () {

            function handler(e) {
                e.preventDefault();
                require(['io.ox/core/sub/subscriptions'], function (subscriptions) {
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
                                    id: 'io.ox/core/foldertree/contextmenu/default/subscribe',
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
                require(['io.ox/core/folder/actions/properties'], function (fn) {
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

            function handler(e) {
                e.preventDefault();
                // hide/show
                api.toggle(e.data.id, e.data.state);
                // dropdown menu needs a redraw
                e.data.view.renderContextMenuItems();
            }

            return function (baton) {

                // if data is empty we have nothing to do here
                if (!baton.data.id) return;
                if (!/^(contacts|calendar|tasks)$/.test(baton.module)) return;
                if (_.device('smartphone')) return;
                if (baton.data.standard_folder) return;

                var hidden = api.is('hidden', baton.data);

                addLink(this, {
                    action: 'hide',
                    data: { id: baton.data.id, state: hidden, view: baton.view },
                    enabled: true,
                    handler: handler,
                    text: hidden ? gt('Show') : gt('Hide')
                });
            };
        }()),

        customColor: (function () {

            return function (baton) {

                if (!/^calendar$/.test(baton.module)) return;
                if (!api.is('private', baton.data)) return;

                if (baton.app && baton.app.props && baton.app.props.get('colorScheme') === 'custom') {
                    var listItem;

                    this.append(
                        listItem = $('<li role="presentation">')
                    );

                    require(['io.ox/calendar/util'], function (calendarUtil) {
                        listItem.append(
                            new ColorSelectionView({
                                model: api.pool.getModel(baton.data.id)
                            }).render(calendarUtil).$el
                        );
                    });
                }
            };
        })()
    };

    //
    // Default extensions
    //

    ext.point('io.ox/core/foldertree/contextmenu/default').extend(
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
            index: 1450,
            draw: divider
        },
        {
            id: 'customColor',
            index: 1500,
            draw: extensions.customColor
        },
        {
            id: 'divider-1',
            index: 1600,
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
            id: 'zip',
            index: 2300,
            draw: extensions.zip
        },
        {
            id: 'divider-2',
            index: 2400,
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
            id: 'divider-3',
            index: 3300,
            draw: divider
        },
        // -----------------------------------------------
        {
            id: 'mark-folder-read',
            index: 4100,
            draw: extensions.markFolderSeen
        },
        {
            id: 'move-all-messages',
            index: 4200,
            draw: extensions.moveAllMessages
        },
        {
            id: 'expunge',
            index: 4300,
            draw: extensions.expunge
        },
        {
            id: 'archive',
            index: 4400,
            draw: extensions.archive
        },
        {
            id: 'empty',
            index: 4500,
            draw: extensions.empty
        },
        {
            id: 'divider-4',
            index: 4600,
            draw: divider
        },
        // -----------------------------------------------
        {
            id: 'toggle',
            index: 5100,
            draw: extensions.toggle
        },
        {
            id: 'delete',
            index: 5200,
            draw: extensions.removeFolder
        }
    );

    //
    // Special extensions
    //
    ext.point('io.ox/core/foldertree/contextmenu/myfolders').extend(
        {
            id: 'add-folder',
            index: 1000,
            draw: extensions.add
        }
    );

    return {
        extensions: extensions,
        addLink: addLink,
        disable: disable,
        divider: divider
    };
});
