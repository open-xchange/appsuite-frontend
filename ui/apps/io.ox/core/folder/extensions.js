/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
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

define('io.ox/core/folder/extensions', [
    'io.ox/core/folder/node',
    'io.ox/core/folder/api',
    'io.ox/core/api/account',
    'io.ox/core/extensions',
    'io.ox/core/capabilities',
    'io.ox/core/upsell',
    'io.ox/contacts/util',
    'io.ox/core/api/user',
    'io.ox/mail/api',
    'gettext!io.ox/core',
    'io.ox/backbone/mini-views/upsell',
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/core/folder/blacklist',
    'settings!io.ox/core',
    'settings!io.ox/mail',
    'io.ox/core/http',
    'io.ox/core/folder/favorites',
    'io.ox/files/favorites'
], function (TreeNodeView, api, account, ext, capabilities, upsell, contactUtil, userAPI, mailAPI, gt, UpsellView, DropdownView, blacklist, settings, mailSettings, http) {

    'use strict';

    var INBOX = 'default0' + mailAPI.separator + 'INBOX';

    if (capabilities.has('webmail')) {
        // define virtual/standard
        api.virtual.add('virtual/standard', function () {
            var defaultFolders = mailSettings.get('defaultFolder') || {},
                list = [],
                // hash to avoid duplicates (see bug 59060)
                hash = {};
            http.pause();
            // collect get requests
            list.push(api.get(INBOX));
            hash[INBOX] = true;
            // append all-unssen below INBOX
            if (mailSettings.get('features/unseenFolder', false)) list.push(api.get('virtual/all-unseen'));
            // ensure fixed order; rely on defaultFolders (see bug 56563)
            ['drafts', 'sent', 'spam', 'trash', 'archive'].forEach(function (type) {
                var folder = defaultFolders[type];
                if (!folder || hash[folder]) return;
                if (type === 'archive' && !capabilities.has('archive_emails')) return;
                list.push(api.get(folder));
                hash[folder] = true;
            });
            http.resume();
            return this.concat.apply(this, list);
        });

        // myfolders
        api.virtual.add('virtual/myfolders', function () {
            var id = api.altnamespace ? 'default0' : INBOX;
            return api.list(id).then(function (list) {
                return _(list).filter(function (data) {
                    if (account.isHidden({ id: data.account_id })) return false;
                    if (data.id.indexOf('default0/External accounts') === 0) return false;
                    if (account.isStandardFolder(data.id)) return false;
                    if (api.is('public|shared', data)) return false;
                    return true;
                });
            });
        });

        api.on('after:rename', function (id, data) {
            if (data.folder_id !== INBOX) return;
            api.virtual.reload('virtual/myfolders');
        });

        // remote folders
        api.virtual.add('virtual/remote', function () {
            // standard environment
            return api.list('1').then(function (list) {
                return _(list).filter(function (data) {
                    return account.isExternal(data.id);
                });
            });

        });
    }

    // TODO: right capability
    if (capabilities.has('filestore')) {
        api.virtual.add('virtual/filestorage', function () {
            return api.list('1').then(function (list) {
                return _(list).filter(function (data) {
                    return api.isExternalFileStorage(data);
                });
            });
        });
    }

    function getMyFilesFolder() {
        var id = settings.get('folder/infostore');
        return id ? api.get(id) : null;
    }

    function getMySharesFolder() {

        if (capabilities.has('guest')) return;
        if (!capabilities.has('gab || share_links')) return;

        return $.when({
            id: 'virtual/myshares',
            folder_id: '9',
            module: 'infostore',
            own_rights: 403710016, // all rights but admin
            permissions: [{ bits: 403710016, entity: ox.user_id, group: false }],
            standard_folder: true,
            supported_capabilities: [],
            title: gt('My shares')
        });
    }

    var attachmentView = settings.get('folder/mailattachments', {});

    if (attachmentView.all) blacklist.add(attachmentView.all);

    function getAllAttachmentsFolder() {
        var id = attachmentView.all;
        return id ? api.get(id) : null;
    }

    function openAttachmentView(e) {
        e.preventDefault();
        ox.launch('io.ox/files/main', { folder: attachmentView.all }).done(function () {
            this.folder.set(attachmentView.all);
        });
    }

    function getTrashFolder() {
        return api.list('9').then(function (list) {
            return _(list).filter(function (data) {
                return api.is('trash', data);
            });
        });
    }

    function openMailAutoconfigDialog(e) {
        e.preventDefault();
        require(['io.ox/mail/accounts/settings'], function (m) { m.mailAutoconfigDialog(e); });
    }

    function openUserSettingsDialog(e) {
        e.preventDefault();
        require(['io.ox/core/settings/user'], function (m) { m.openModalDialog(); });
    }

    if (capabilities.has('infostore')) {
        api.virtual.add('virtual/drive/private', function () {
            return this.concat(getMyFilesFolder(), getMySharesFolder(), getAllAttachmentsFolder(), getTrashFolder());
        });
        api.virtual.add('virtual/drive/private-without-myshares', function () {
            return this.concat(getMyFilesFolder(), getAllAttachmentsFolder(), getTrashFolder());
        });
        api.virtual.add('virtual/drive/public', function () {
            return api.list('9').then(function (list) {
                return _(list).filter(function (data) {
                    if (String(data.id) === String(settings.get('folder/infostore'))) return false;
                    if (api.is('trash', data)) return false;
                    if (api.isExternalFileStorage(data)) return false;
                    return true;
                });
            });
        });
    }

    function getAvailableServices() {
        var services = ['google', 'dropbox', 'boxcom', 'graph'];

        ext.point('io.ox/core/folder/storage-accounts/list').invoke('customize', services);

        return require(['io.ox/core/api/filestorage']).then(function (filestorageApi) {
            var availableFilestorageServices = filestorageApi.rampup().then(function () {
                return _(filestorageApi.isStorageAvailable()).map(function (service) { return service.match(/\w*?$/)[0]; });
            });

            return $.when(require(['io.ox/keychain/api']), availableFilestorageServices);
        }).then(function (keychainApi, availableFilestorageServices) {
            return _(keychainApi.submodules).filter(function (submodule) {
                if (services.indexOf(submodule.id) < 0) return false;
                // we need support for both accounts, Oauth accounts and filestorage accounts.
                return (!submodule.canAdd || submodule.canAdd.apply(this)) && availableFilestorageServices.indexOf(submodule.id) >= 0;
            });
        });
    }

    function openAddStorageAccount(e) {
        e.preventDefault();
        require(['io.ox/files/actions/add-storage-account'], function (addStorageAccount) {
            addStorageAccount(e.data.cap);
        });
    }

    function openSubscriptionDialog(e) {
        e.preventDefault();
        if (capabilities.has('subscription')) {
            if (e.data.baton.module === 'calendar') {
                require(['io.ox/calendar/actions/subscribe-calendar'], function (openDialog) {
                    openDialog(e.data.baton);
                });
            } else {
                require(['io.ox/core/sub/subscriptions'], function (subscriptions) {
                    subscriptions.buildSubscribeDialog({
                        module: e.data.baton.module,
                        app: e.data.baton.view.app
                    });
                });
            }
        } else {
            if (!upsell.enabled(['subscription'])) return;

            upsell.trigger({
                type: 'inline-action',
                id: 'io.ox/core/foldertree/contextmenu/default/subscribe',
                missing: upsell.missing(['subscription'])
            });
        }
    }

    function openSubscriptionForSharedDialog(e) {
        require(['io.ox/core/sub/sharedFolders'], function (subscribe) {
            var module = e.data.baton.module,
                isContact = module === 'contacts';

            subscribe.open({
                module: module,
                help: isContact ? 'ox.appsuite.user.sect.contacts.folder.subscribeshared.html' : 'ox.appsuite.user.sect.tasks.folder.subscribeshared.html',
                title: isContact ? gt('Shared address books') : gt('Shared task folders'),
                tooltip: isContact ? gt('Subscribe to address book') : gt('Subscribe to task folder'),
                point: isContact ? 'io.ox/core/folder/subscribe-shared-address-books' : 'io.ox/core/folder/subscribe-shared-tasks-folders',
                noSync: isContact ? !capabilities.has('carddav') : !capabilities.has('caldav'),
                sections: {
                    public: isContact ? gt('Public address books') : gt('Public tasks folders'),
                    shared: isContact ? gt('Shared address books') : gt('Shared tasks folders'),
                    private: gt('Private'),
                    hidden: isContact ? gt('Hidden address books') : gt('Hidden tasks folders')
                }
            });
        });
    }

    var extensions = {

        unifiedFolders: function (tree) {
            this.append(
                // standard folders
                new TreeNodeView({
                    empty: false,
                    filter: function (id, model) {
                        // we check for ^default to make sure we only consider mail folders
                        return /^default/.test(model.id) && account.isUnified(model.id);
                    },
                    folder: '1',
                    headless: true,
                    open: true,
                    tree: tree,
                    parent: tree
                })
                .render().$el.addClass('unified-folders').attr('role', 'treeitem')
            );
        },

        standardFolders: function (tree) {
            var view = new TreeNodeView({
                filter: function (id, model) {
                    // do not filter unseen messages folder if enabled
                    if (model.id === 'virtual/all-unseen' && mailSettings.get('unseenMessagesFolder')) return true;
                    return account.isStandardFolder(model.id);
                },
                folder: 'virtual/standard',
                headless: true,
                open: true,
                tree: tree,
                parent: tree
            });
            this.append(
                view.render().$el.addClass('standard-folders').attr('role', 'presentation')
            );
            // show / hide folder on setting change
            view.listenTo(mailSettings, 'change:unseenMessagesFolder', function () {
                view.onReset();
            });
        },

        getLocalFolderName: function () {
            // Use account name for root node in tree or the fallback if no name is set or it is overwritten
            // by the setting. See Bug #62074
            var name = mailSettings.get('features/usePrimaryAccountNameInTree', true) ? (account.getPrimaryName() || gt('My folders')) : gt('My folders');
            return name;
        },

        localFolders: function (tree) {

            if (capabilities.has('guest')) return;  // Guests aren't able to create local folders

            var defaultId = api.altnamespace ? 'default0' : INBOX;

            var node = new TreeNodeView({
                contextmenu: 'myfolders',
                // always show the folder for altnamespace
                // otherwise the user cannot create folders
                empty: !!api.altnamespace,
                // convention! virtual folders are identified by their id starting with "virtual"
                folder: 'virtual/myfolders',
                icons: tree.options.icons,
                contextmenu_id: defaultId,
                parent: tree,
                title: extensions.getLocalFolderName(),
                tree: tree
            });

            account.on('update', function (e, accountData) {
                // only changes to the primary account are important
                if (accountData.id !== 0) return;
                node.options.title = extensions.getLocalFolderName();
                node.renderFolderLabel();
            });

            // open "My folders" whenever a folder is added to INBOX/root
            api.on('create:' + defaultId, function () {
                node.toggle(true);
            });

            this.append(node.render().$el);
        },

        remoteAccounts: function (tree) {
            this.append(
                new TreeNodeView({
                    folder: 'virtual/remote',
                    headless: true,
                    open: true,
                    icons: tree.options.icons,
                    tree: tree,
                    parent: tree,
                    isRemote: true,
                    empty: false
                })
                .render().$el.addClass('remote-folders').attr('role', 'presentation')
            );
        },

        fileStorageAccounts: function (tree) {
            this.append(
                new TreeNodeView({
                    //empty: false,
                    folder: 'virtual/filestorage',
                    headless: true,
                    open: true,
                    icons: tree.options.icons,
                    tree: tree,
                    parent: tree
                })
                .render().$el.addClass('filestorage-folders').attr('role', 'presentation')
            );
        },

        treeLinksFiles: function () {
            if (ext.point('io.ox/core/foldertree/files/treelinks').list().length === 0) return;

            var node = $('<ul class="list-unstyled" role="group">');
            ext.point('io.ox/core/foldertree/files/treelinks').invoke('draw', node);
            this.append($('<li class="links list-unstyled" role="treeitem">').append(node));
        },

        addStorageAccount: (function () {
            var node = $('<li role="presentation">');

            function getAvailableNonOauthServices() {
                var services = ['nextcloud', 'webdav', 'owncloud'];
                return _.filter(services, function (service) { return capabilities.has('filestorage_' + service); });
            }

            function draw() {
                getAvailableServices().done(function (services) {
                    var availableNonOauthServices = getAvailableNonOauthServices();
                    if (services.length > 0 || availableNonOauthServices.length) {
                        node.empty().show().append(
                            $('<a href="#" data-action="add-storage-account" role="treeitem">').text(gt('Add storage account')).on('click', { 'cap': availableNonOauthServices }, openAddStorageAccount)
                        );
                    } else {
                        node.hide();
                    }
                });
            }

            return function () {
                this.append(node);

                require(['io.ox/core/api/filestorage'], function (filestorageApi) {
                    // remove old listeners
                    filestorageApi.off('create delete update reset', draw);
                    // append new listeners and draw immediatly
                    filestorageApi.on('create delete update reset', draw);
                    draw();
                });
            };
        })(),

        // used to manage subscribed/unsubscribed status of folders from federated shares
        manageSubscriptions: function () {
            var node = $('<li role="presentation">');
            // append node now (serves as placeholder until requests return)
            this.append(node);
            // 10 is public folders, 15 is shared folders
            $.when(api.list(15, { all: true, cache: false }), api.list(10, { all: true, cache: false })).then(function (pFolders, sFolders) {
                // check if there are folders to unsubscribe at all
                if (_.isEmpty(pFolders) && _.isEmpty(sFolders)) return node.remove();

                node.append(
                    //#. opens a dialog to manage shared or public folders
                    $('<a href="#" data-action="manage-subscriptions" role="treeitem">').text(gt('Manage Shares')).on('click', function () {
                        require(['io.ox/core/sub/sharedFolders'], function (subscribe) {
                            subscribe.open({
                                module: 'infostore',
                                help: 'ox.appsuite.user.sect.drive.folder.subscribeshared.html',
                                title: gt('Shared folders'),
                                point: 'io.ox/core/folder/subscribe-shared-files-folders',
                                sections: {
                                    public: gt('Public folders'),
                                    shared: gt('Shared folders')
                                },
                                refreshFolders: true,
                                tooltip: gt('Subscribe to folder'),
                                noSync: true,
                                // subscribe dialog is build for flat foldertrees, add special getData function to make it work for infostore
                                // no cache or we would overwrite folder collections with unsubscribed folders
                                getData: function () {
                                    return $.when(api.list(15, { all: true, cache: false }), api.list(10, { all: true, cache: false })).then(function (publicFolders, sharedFolders) {

                                        return {
                                            public: publicFolders || [],
                                            shared: sharedFolders || []
                                        };
                                    });
                                }
                            });
                        });
                    })
                );
            }, function () {
                node.remove();
            });
        },

        subscribe: function (baton) {
            if (baton.extension.capabilities && !upsell.visible(baton.extension.capabilities)) return;
            var self = this;

            this.link('subscribe', gt('Subscribe to address book'), function (e) {
                e.data = { baton: baton };
                openSubscriptionDialog(e);
            });

            require(['io.ox/core/sub/subscriptions'], function (sub) {
                // if there is nothing configured we do not show the "subscribe" button
                if (baton.module !== 'contacts' && !sub.availableServices.contacts) {
                    self.$el.find('[data-name=subscribeShared]').closest('li').remove();
                }
            });
        },

        subscribeShared: function (baton) {
            if (baton.extension.capabilities && !upsell.visible(baton.extension.capabilities)) return;
            var self = this;

            if (baton.module === 'contacts') {
                self.link('subscribeShared', gt('Subscribe to shared address book'), function (e) {
                    e.data = { baton: baton };
                    openSubscriptionForSharedDialog(e);
                });
            } else {
                return;
            }
        },

        treeLinks: function () {
            if (ext.point('io.ox/core/foldertree/mail/treelinks').list().length === 0) return;

            var node = $('<ul class="list-unstyled" role="group">');
            ext.point('io.ox/core/foldertree/mail/treelinks').invoke('draw', node);
            this.append($('<li class="links list-unstyled" role="treeitem">').append(node));
        },

        allAttachments: function () {
            if (!attachmentView.all) return;
            this.append(
                $('<li role="presentation">').append(
                    $('<a href="#" data-action="all-attachments" role="treeitem">').text(gt('View all attachments')).on('click', openAttachmentView)
                )
            );
        },

        addRemoteAccount: function () {
            if (!capabilities.has('multiple_mail_accounts')) return;
            this.append(
                $('<li role="presentation">').append(
                    $('<a href="#" data-action="add-mail-account" role="treeitem">').text(gt('Add mail account')).on('click', openMailAutoconfigDialog)
                )
            );
        },

        synchronizeAccount: function () {
            this.append(new UpsellView({
                id: 'folderview/mail',
                className: 'links',
                requires: 'active_sync',
                title: gt('Synchronize with your tablet or smartphone')
            }).render().$el);
        },

        otherFolders: function (tree) {
            this.append(
                new TreeNodeView({
                    empty: false,
                    filter: function (id, model) {
                        // exclude standard folder
                        if (account.isStandardFolder(model.id)) return false;
                        // 'default0/virtual' is dovecot's special "all" folder
                        if (model.id === 'default0/virtual') return false;
                        // alt namespace only allows public/shared folder here
                        return api.altnamespace ? api.is('public|shared', model.toJSON()) : true;
                    },
                    folder: 'default0',
                    headless: true,
                    open: true,
                    icons: tree.options.icons,
                    tree: tree,
                    parent: tree
                })
                .render().$el.addClass('other-folders').attr('role', 'treeitem')
            );
        },

        myContactData: function () {
            // check if users can edit their own data (see bug 34617)
            if (settings.get('user/internalUserEdit', true) === false) return;

            this.append(
                $('<li role="presentation">').append(
                    $('<a href="#" data-action="my-contact-data" role="treeitem">').text(gt('My contact data')).on('click', openUserSettingsDialog)
                )
            );
        },

        addNewAddressBook: function (baton) {
            var module = baton.module,
                folder = api.getDefaultFolder(module);

            this.link('add-new-address-book', gt('Personal address book'), function (e) {
                e.data = { folder: folder, module: module };
                addFolder(e);
            });
        },

        rootFolders: function (tree) {
            var options = {
                folder: tree.root,
                headless: true,
                open: true,
                tree: tree,
                parent: tree
            };

            if (tree.options.hideTrashfolder) {
                options.filter = function (id, model) {
                    //exclude trashfolder
                    return !api.is('trash', model.attributes);
                };
            }

            // TODO: disable when only one account
            if (tree.module === 'infostore') {
                var previous = options.filter;
                options.filter = function (id, model) {
                    // get response of previously defined filter function
                    var unfiltered = (previous ? previous.apply(this, arguments) : true);
                    // exclude external accounts and trashfolder if requested
                    return unfiltered && !api.isExternalFileStorage(model) && (!tree.options.hideTrashfolder || !api.is('trash', model.attributes));
                };
            }
            this.append(
                new TreeNodeView(options).render().$el.addClass('root-folders')
            );
        },

        privateDriveFolders: function (tree) {
            this.append(
                new TreeNodeView({
                    //empty: false,
                    folder: 'virtual/drive/private',
                    headless: true,
                    open: true,
                    icons: tree.options.icons,
                    tree: tree,
                    parent: tree
                })
                .render().$el.addClass('private-drive-folders').attr('role', 'presentation')
            );
        },

        privateDriveFoldersWithoutMyShares: function (tree) {
            this.append(
                new TreeNodeView({
                    //empty: false,
                    folder: 'virtual/drive/private-without-myshares',
                    headless: true,
                    open: true,
                    icons: tree.options.icons,
                    tree: tree,
                    parent: tree
                })
                .render().$el.addClass('private-drive-folders').attr('role', 'presentation')
            );
        },

        publicDriveFolders: function (tree) {
            this.append(
                new TreeNodeView({
                    //empty: false,
                    folder: 'virtual/drive/public',
                    headless: true,
                    open: true,
                    icons: tree.options.icons,
                    tree: tree,
                    parent: tree
                })
                .render().$el.addClass('public-drive-folders').attr('role', 'presentation')
            );
        }
    };

    var INDEX = 100;

    //
    // Mail
    //

    ext.point('io.ox/core/foldertree/mail/app').extend(
        {
            id: 'unified-folders',
            index: INDEX += 100,
            draw: extensions.unifiedFolders
        },
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
            id: 'other',
            index: INDEX += 100,
            draw: extensions.otherFolders
        },
        {
            id: 'remote-accounts',
            index: INDEX += 100,
            draw: extensions.remoteAccounts
        },
        {
            id: 'tree-links',
            index: INDEX += 100,
            draw: extensions.treeLinks
        },
        {
            id: 'upsell-mail',
            index: INDEX += 100,
            draw: extensions.synchronizeAccount
        }
    );

    ext.point('io.ox/core/foldertree/mail/treelinks').extend(
        {
            id: 'all-attachments',
            index: INDEX += 100,
            draw: extensions.allAttachments
        },
        {
            id: 'add-account',
            index: INDEX += 100,
            draw: extensions.addRemoteAccount
        }
    );

    ext.point('io.ox/core/foldertree/mail/popup').extend(
        {
            id: 'standard-folders',
            draw: extensions.standardFolders
        },
        {
            id: 'local-folders',
            draw: extensions.localFolders
        },
        {
            id: 'other',
            draw: extensions.otherFolders
        },
        {
            id: 'remote-accounts',
            draw: extensions.remoteAccounts
        }
    );

    // looks identical to popup but has no favorites
    ext.point('io.ox/core/foldertree/mail/subscribe').extend(
        {
            id: 'root-folders',
            draw: extensions.rootFolders
        }
    );

    ext.point('io.ox/core/foldertree/mail/account').extend(
        {
            id: 'root-folders',
            draw: extensions.rootFolders
        }
    );

    ext.point('io.ox/core/foldertree/mail/filter').extend(
        {
            id: 'standard-folders',
            draw: extensions.standardFolders
        },
        {
            id: 'local-folders',
            draw: extensions.localFolders
        },
        {
            id: 'other',
            draw: extensions.otherFolders
        }
    );

    //
    // Files / Drive
    //

    ext.point('io.ox/core/foldertree/infostore/app').extend(
        {
            id: 'private-folders',
            index: 100,
            draw: extensions.privateDriveFolders
        },
        {
            id: 'public-folders',
            index: 200,
            draw: extensions.publicDriveFolders
        },
        {
            id: 'remote-accounts',
            index: 300,
            draw: extensions.fileStorageAccounts
        },
        {
            id: 'tree-links-files',
            index: 400,
            draw: extensions.treeLinksFiles
        }
    );

    ext.point('io.ox/core/foldertree/files/treelinks').extend(
        {
            id: 'add-external-account',
            index: 100,
            draw: extensions.addStorageAccount
        }, {
            id: 'manage-subscriptions',
            index: 200,
            draw: extensions.manageSubscriptions
        }
    );

    ext.point('io.ox/core/foldertree/infostore/subscribe').extend(
        {
            id: 'root-folders',
            draw: extensions.rootFolders
        }
    );

    ext.point('io.ox/core/foldertree/infostore/popup').extend(
        {
            id: 'private-folders',
            index: 100,
            draw: extensions.privateDriveFoldersWithoutMyShares
        },
        {
            id: 'public-folders',
            index: 200,
            draw: extensions.publicDriveFolders
        },
        {
            id: 'remote-accounts',
            index: 300,
            draw: extensions.fileStorageAccounts
        }
    );

    //
    // Contacts
    //

    ext.point('io.ox/core/foldertree/contacts/links').extend(
        {
            id: 'my-contact-data',
            index: 400,
            draw: extensions.myContactData
        }
    );

    ext.point('io.ox/core/foldertree/contacts/links/subscribe').extend(
        {
            id: 'add-new_address_book',
            index: 300,
            draw: extensions.addNewAddressBook
        },
        {
            id: 'subscribe',
            index: 500,
            capabilities: ['subscription'],
            draw: extensions.subscribe
        },
        {
            id: 'subscribeShared',
            index: 550,
            // dialog serves multiple purposes, manage sync via carddav (all folder types) or subscribe/unsubscribe shared or public folders
            capabilities: ['edit_public_folders || read_create_shared_folders || carddav'],
            draw: extensions.subscribeShared
        }
    );

    ext.point('io.ox/core/foldertree/contacts/links').extend({
        index: 200,
        id: 'private-contacts',
        draw: function (baton) {
            if (baton.context !== 'app') return;
            if (capabilities.has('guest')) return;
            var dropdown = new DropdownView({
                attributes: { role: 'presentation' },
                tagName: 'li',
                className: 'dropdown',
                $toggle: $('<a href="#" data-action="add-subfolder" data-toggle="dropdown">').append(
                    gt('Add new address book'),
                    $('<i class="fa fa-caret-down" aria-hidden="true">')
                )
            });
            ext.point('io.ox/core/foldertree/contacts/links/subscribe').invoke('draw', dropdown, baton);
            if (dropdown.$ul.children().length === 0) return;
            this.append(dropdown.render().$el);
            // make sure, this is a treeitem. render-function of dropdown appends role="button" to $toggle
            dropdown.$toggle.attr('role', 'treeitem');
        }
    });

    // helper

    function addFolder(e) {
        e.preventDefault();
        ox.load(['io.ox/core/folder/actions/add']).done(function (add) {
            add(e.data.folder, { module: e.data.module });
        });
    }

    _('contacts calendar tasks'.split(' ')).each(function (module) {

        //
        // Flat trees
        //

        var sectionNames = {
            'contacts': {
                'private':  gt('My address books'),
                'public':   gt('Public address books'),
                'shared':   gt('Shared address books'),
                'hidden':   gt('Hidden address books')
            },
            'calendar': {
                'private':  gt('My calendars'),
                'public':   gt('Public calendars'),
                'shared':   gt('Shared calendars'),
                'hidden':   gt('Hidden calendars')
            },
            'tasks': {
                'private':  gt('My tasks'),
                'public':   gt('Public tasks'),
                'shared':   gt('Shared tasks'),
                'hidden':   gt('Hidden tasks')
            }
        };

        function getTitle(module, type) {
            return sectionNames[module][type];
        }

        var defaultExtension = {
            id: 'standard-folders',
            index: 100,
            draw: function (tree) {

                var moduleName = module === 'calendar' ? 'event' : module,
                    links = $('<ul class="list-unstyled" role="group">'),
                    baton = ext.Baton({ module: module, view: tree, context: tree.context }),
                    folder = 'virtual/flat/' + moduleName,
                    model_id = 'flat/' + moduleName,
                    defaults = { count: 0, empty: false, indent: false, open: false, tree: tree, parent: tree, filter: function (id, model) { return !!model.get('subscribed'); } },
                    privateFolders,
                    publicFolders,
                    placeholder = $('<li role="treeitem">');

                // no links. Used for example in move folder picker
                if (!tree.options.noLinks) {
                    ext.point('io.ox/core/foldertree/' + module + '/links').invoke('draw', links, baton);
                }

                this.append(placeholder);

                // call flat() here to cache the folders. If not, any new TreeNodeview() and render() call calls flat() resulting in a total of 12 flat() calls.
                api.flat({ module: moduleName }).always(function () {

                    privateFolders = new TreeNodeView(_.extend({}, defaults, { folder: folder + '/private', model_id: model_id + '/private', title: getTitle(module, 'private'), filter: function (id, model) { return !!model.get('subscribed'); } }));

                    // open private folder whenever a folder is added to it
                    api.pool.getCollection('flat/' + moduleName + '/private').on('add', function () {
                        privateFolders.toggle(true);
                    });

                    // open public folder whenever a folder is added to it
                    api.pool.getCollection('flat/' + moduleName + '/public').on('add', function () {
                        privateFolders.toggle(true);
                    });

                    publicFolders = new TreeNodeView(_.extend({}, defaults, { folder: folder + '/public', model_id: model_id + '/public', title: getTitle(module, 'public') }));

                    placeholder.replaceWith(
                        // private folders
                        privateFolders.render().$el.addClass('section'),
                        // links
                        $('<li class="links list-unstyled" role="treeitem">').append(links),
                        // public folders
                        publicFolders.render().$el.addClass('section'),
                        // shared with me
                        new TreeNodeView(_.extend({}, defaults, { folder: folder + '/shared', model_id: model_id + '/shared', title: getTitle(module, 'shared') }))
                        .render().$el.addClass('section'),
                        // // shared by me
                        // new TreeNodeView(_.extend({}, defaults, { folder: folder + '/sharing', model_id: model_id + '/sharing', title: gt('Shared by me') }))
                        // .render().$el.addClass('section'),
                        // hidden folders
                        new TreeNodeView(_.extend({}, defaults, { folder: folder + '/hidden', model_id: model_id + '/hidden', title: getTitle(module, 'hidden') }))
                        .render().$el.addClass('section')
                    );
                });
            }
        };

        ext.point('io.ox/core/foldertree/' + module + '/app').extend(_.extend({}, defaultExtension));
        ext.point('io.ox/core/foldertree/' + module + '/popup').extend(_.extend({}, defaultExtension));

        //
        // Links
        //

        if (module === 'tasks') {

            ext.point('io.ox/core/foldertree/' + module + '/links/subscribe').extend({
                index: 100,
                id: 'personal',
                draw: function (baton) {
                    var module = baton.module,
                        folder = api.getDefaultFolder(module);
                    this.link('add-new-folder', gt('Personal folder'), function (e) {
                        e.data = { folder: folder, module: module };
                        addFolder(e);
                    });
                }
            });

            ext.point('io.ox/core/foldertree/' + module + '/links/subscribe').extend({
                index: 200,
                id: 'shared',
                draw: function (baton) {
                    if (!capabilities.has('edit_public_folders || read_create_shared_folders || caldav')) return;

                    if (baton.context !== 'app') return;

                    var folder = api.getDefaultFolder(module);

                    // guests might have no default folder
                    if (!folder) return;

                    this.link('shared', gt('Subscribe to shared folder'), function (e) {
                        e.data = { baton: baton };
                        openSubscriptionForSharedDialog(e);
                    });
                }
            });
        }

        ext.point('io.ox/core/foldertree/tasks/links').extend({
            index: 200,
            id: 'dropdown',
            draw: function (baton) {
                if (baton.context !== 'app') return;
                if (capabilities.has('guest')) return;
                var dropdown = new DropdownView({
                    attributes: { role: 'presentation' },
                    tagName: 'li',
                    className: 'dropdown',
                    $toggle: $('<a href="#" data-action="add-subfolder" data-toggle="dropdown">').append(
                        gt('Add new folder'),
                        $('<i class="fa fa-caret-down" aria-hidden="true">')
                    )
                });
                ext.point('io.ox/core/foldertree/tasks/links/subscribe').invoke('draw', dropdown, baton);
                if (dropdown.$ul.children().length === 0) return;
                this.append(dropdown.render().$el);
                // make sure, this is a treeitem. render-function of dropdown appends role="button" to $toggle
                dropdown.$toggle.attr('role', 'treeitem');
            }
        });
    });

    //
    // Upsell
    //

    ext.point('io.ox/core/foldertree/calendar/links/subscribe').extend({
        id: 'default',
        index: 100,
        draw: function () {
            var folder = api.getDefaultFolder('calendar');
            // guests might have no default folder
            if (!folder) return;
            this.link('folder', gt('Personal calendar'), function (e) {
                e.data = { folder: folder, module: 'event' };
                addFolder(e);
            });
        }
    }, {
        id: 'divider-1',
        index: 200,
        draw: function () {
            if (!capabilities.has('calendar_schedjoules') &&
                !capabilities.has('calendar_google') &&
                !capabilities.has('calendar_ical')) return;

            this.divider();
            this.header(gt('Subscribe to calendar'));
        }
    }, {
        id: 'schedjoules',
        index: 300,
        draw: function () {
            if (!capabilities.has('calendar_schedjoules')) return;
            this.link('schedjoules', gt('Browse calendars of interest'), function () {
                require(['io.ox/calendar/settings/schedjoules/schedjoules'], function (schedjoules) {
                    schedjoules.open();
                });
            });
        }
    }, {
        id: 'google',
        index: 400,
        draw: function () {
            if (!capabilities.has('calendar_google')) return;
            var subscribeGoogle, link;
            // make sure the subscrioption code is available when the action is triggered
            // otherwise, the oauth popup will be blocked
            require(['io.ox/calendar/actions/subscribe-google'], function (func) {
                subscribeGoogle = func;
                link.removeClass('hidden');
            });
            this.link('google', gt('Google calendar'), function () { subscribeGoogle(); });
            link = this.$ul.find('li').last().addClass('hidden');
        }
    }, {
        id: 'ical',
        index: 500,
        draw: function () {
            if (!capabilities.has('calendar_ical')) return;
            this.link('ical', gt('Subscribe via URL (iCal)'), function () {
                require(['io.ox/calendar/actions/subscribe-ical'], function (importICal) {
                    importICal();
                });
            });
        }
    }, {
        id: 'shared',
        index: 500,
        draw: function () {
            if (!capabilities.has('edit_public_folders || read_create_shared_folders || caldav')) return;
            this.link('shared', gt('Subscribe to shared calendar'), function () {
                require(['io.ox/core/sub/sharedFolders'], function (subscribe) {
                    subscribe.open({
                        module: 'calendar',
                        help: 'ox.appsuite.user.sect.calendar.folder.subscribeshared.html',
                        title: gt('Subscribe to shared calendars'),
                        point: 'io.ox/core/folder/subscribe-shared-calendar',
                        noSync: !capabilities.has('caldav'),
                        sections: {
                            public: gt('Public calendars'),
                            shared: gt('Shared calendars'),
                            private: gt('Private'),
                            hidden: gt('Hidden calendars')
                        }
                    });
                });
            });
        }
    }, {
        id: 'import',
        index: 600,
        draw: function () {
            if (_.device('ios || android')) return;
            this.divider();
            this.header(gt('Import calendar'));
            this.link('import', gt('Upload file'), function () {
                require(['io.ox/core/import/import'], function (importer) {
                    importer.show('calendar');
                });
            });
        }
    });

    ext.point('io.ox/core/foldertree/calendar/links').extend({
        index: 200,
        id: 'private-calendar',
        draw: function (baton) {
            if (baton.context !== 'app') return;
            if (capabilities.has('guest')) return;
            var dropdown = new DropdownView({
                attributes: { role: 'presentation' },
                tagName: 'li',
                className: 'dropdown',
                $toggle: $('<a href="#" data-action="add-subfolder" data-toggle="dropdown">').append(
                    gt('Add new calendar'),
                    $('<i class="fa fa-caret-down" aria-hidden="true">')
                )
            });
            ext.point('io.ox/core/foldertree/calendar/links/subscribe').invoke('draw', dropdown, baton);
            if (dropdown.$ul.children().length === 0) return;
            this.append(dropdown.render().$el);
            // make sure, this is a treeitem. render-function of dropdown appends role="button" to $toggle
            dropdown.$toggle.attr('role', 'treeitem');
        }
    });

    ext.point('io.ox/core/foldertree/contacts/links').extend({
        index: 1000,
        id: 'upsell-contacts',
        draw: function (baton) {
            if (baton.context !== 'app') return;

            this.append(new UpsellView({
                id: 'folderview/contacts',
                requires: 'carddav',
                title: gt('Synchronize with your tablet or smartphone')
            }).render().$el);
        }
    });

    ext.point('io.ox/core/foldertree/calendar/links').extend({
        index: 1000,
        id: 'upsell-calendar',
        draw: function (baton) {
            if (baton.context !== 'app') return;

            this.append(new UpsellView({
                id: 'folderview/calendar',
                requires: 'caldav',
                title: gt('Synchronize with your tablet or smartphone')
            }).render().$el);
        }
    });

    //
    // Shared folders
    //

    function openPermissions(e) {
        var id = e.data.id;
        require(['io.ox/files/share/permissions'], function (permissions) {
            permissions.showFolderPermissions(id);
        });
    }

    function openSubSettings(e) {
        // TODO make sure chronos module is used here
        var options = { id: 'io.ox/core/sub', data: e.data.folder, refresh: true };
        ox.launch('io.ox/settings/main', options).done(function () {
            this.setSettingsPane(options);
        });
    }

    function toggleFolder(e) {
        if (e.type === 'keydown') {
            if (e.which !== 32) return;
            e.stopImmediatePropagation();
        }
        var target = e.data.target,
            app = e.data.app,
            folder = e.data.folder;
        if (target.closest('.single-selection').length > 0) return;
        e.preventDefault();
        if (app.folders.isSelected(folder.id)) app.folders.remove(folder.id);
        else app.folders.add(folder.id);
        target.toggleClass('selected', app.folders.isSelected(folder.id));
        target.closest('.folder').attr('aria-checked', app.folders.isSelected(folder.id));
    }

    ext.point('io.ox/core/foldertree/node').extend(
        {
            id: 'shared-by',
            index: 100,
            draw: function (baton) {

                var model = baton.view.model, data = model.toJSON();
                if (!/^(contacts|calendar|tasks)$/.test(data.module)) return;
                if (!api.is('shared', data)) return;

                baton.view.addA11yDescription(gt('Shared by other users'));
            }
        },
        {
            id: 'shared',
            index: 200,
            draw: function (baton) {

                this.find('.folder-node:first .folder-shared:first').remove();

                if (_.device('smartphone')) return;
                // drive has virtual folder 'Shared by me'
                if (baton.data.module === 'infostore') return;
                if (!api.is('unlocked', baton.data)) return;

                // TODO - A11y: Click handler on icon?
                baton.view.$.buttons.append(
                    $('<i class="fa folder-shared" aria-hidden="true">').attr('title', gt('You share this folder with other users')).on('click', { id: baton.data.id }, openPermissions)
                );
                baton.view.addA11yDescription(gt('You share this folder with other users'));
            }
        },
        {
            id: 'sub',
            index: 300,
            draw: function (baton) {

                if (!api.isVirtual(baton.view.folder)) {
                    this.find('.folder-sub:first').remove();
                }

                // ignore shared folders
                if (api.is('shared', baton.data)) return;
                if (!api.is('subscribed', baton.data)) return;

                // TODO - A11y: Click handler on icon?
                baton.view.$.buttons.append(
                    $('<i class="fa folder-sub">').attr('title', gt('This folder has subscriptions')).on('click', { folder: baton.data }, openSubSettings)
                );
                baton.view.addA11yDescription(gt('This folder has subscriptions'));
            }
        },
        {
            id: 'is-selected',
            index: 400,
            draw: function (baton) {
                if (!/^calendar$/.test(baton.data.module)) return;

                var self = this,
                    folderLabel = this.find('.folder-label'),
                    app = ox.ui.apps.get('io.ox/calendar');

                if (!app) return;

                this.attr('aria-checked', app.folders.isSelected(baton.data.id));

                require(['io.ox/calendar/util'], function (util) {
                    var folderColor = util.getFolderColor(baton.data),
                        target = folderLabel.find('.color-label'),
                        colorName = util.getColorName(folderColor);

                    //#. Will be used as aria lable for the screen reader to tell the user which color/category the appointment within the calendar has.
                    if (colorName) baton.view.addA11yDescription(gt('Category') + ': ' + colorName);

                    if (target.length === 0) target = $('<div class="color-label" aria-hidden="true">');
                    target.toggleClass('selected', app.folders.isSelected(baton.data.id));
                    target.css({
                        'background-color': folderColor,
                        'color': util.getForegroundColor(folderColor)
                    });
                    target.off('click', toggleFolder).on('click', { folder: baton.data, app: app, target: target }, toggleFolder);
                    self.off('keydown', toggleFolder).on('keydown', { folder: baton.data, app: app, target: target }, toggleFolder);
                    folderLabel.prepend(target);
                });
            }
        },
        {
            id: 'account-errors',
            index: 500,
            draw: function (baton) {
                var module = baton.data.module;

                if (!/^(calendar|contacts|infostore)$/.test(module)) return;

                // contacts
                if (module === 'contacts' && baton.data.meta && baton.data.meta.errors) {
                    return baton.view.showStatusIcon(gt('The subscription could not be updated due to an error and must be recreated.'), 'click:account-error', baton.data);
                }

                // calendar and drive
                var accountError = module === 'calendar' ?
                    baton.data['com.openexchange.calendar.accountError'] :
                    baton.data['com.openexchange.folderstorage.accountError'];

                if (!accountError) return baton.view.hideStatusIcon();

                baton.view.showStatusIcon(accountError.error, 'click:account-error', baton.data);
                ox.trigger('http:error:' + accountError.code, accountError);
            }
        }
    );

    return extensions;
});
