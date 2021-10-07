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

define('io.ox/files/share/permissions', [
    'io.ox/core/extensions',
    'io.ox/files/share/permission-pre-selection',
    'io.ox/files/share/share-settings',
    'io.ox/files/share/public-link',
    'io.ox/backbone/views/disposable',
    'io.ox/core/yell',
    'io.ox/backbone/mini-views',
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/core/folder/api',
    'io.ox/files/api',
    'io.ox/files/share/api',
    'io.ox/contacts/api',
    'io.ox/backbone/views/modal',
    'io.ox/contacts/util',
    'io.ox/core/settings/util',
    'io.ox/core/tk/typeahead',
    'io.ox/participants/model',
    'io.ox/participants/views',
    'io.ox/core/capabilities',
    'io.ox/core/folder/util',
    'gettext!io.ox/core',
    'settings!io.ox/contacts',
    'settings!io.ox/mail',
    'io.ox/backbone/mini-views/addresspicker',
    'io.ox/core/util',
    'io.ox/core/api/group',
    'io.ox/files/permission-util',
    'static/3rd.party/polyfill-resize.js',
    'less!io.ox/files/share/style'
], function (ext, PermissionPreSelection, shareSettings, PublicLink, DisposableView, yell, miniViews, DropdownView, folderAPI, filesAPI, api, contactsAPI, ModalDialog, contactsUtil, settingsUtil, Typeahead, pModel, pViews, capabilities, folderUtil, gt, settingsContacts, mailSettings, AddressPickerView, coreUtil, groupApi, pUtil) {

    'use strict';

    var POINT = 'io.ox/files/share/permissions',

        roles = {
            //#. Role: view folder + read all
            viewer: { bit: 257, label: gt('Viewer') },
            //#. Role: view folder + read/write all
            reviewer: { bit: 33025, label: gt('Reviewer') },
            //#. Role: create folder + read/write/delete all
            author: { bit: 4227332, label: gt('Author') },
            //#. Role: all permissions
            administrator: { bit: 272662788, label: gt('Administrator') },
            //#. Role: Owner (same as admin)
            owner: { bit: 272662788, label: gt('Owner') }
        },

        fileRoles = {
            // read only
            viewer: 1,
            // read and write
            reviewer: 2,
            // read, write, and delete
            author: 4
        },

        /* Models */

        // Simple Permission
        Permission = Backbone.Model.extend({

            defaults: {
                group: false,
                bits: 0
            },

            initialize: function () {
                // if extended permissions
                if (this.has('type') && this.get('type') === 'group') {
                    this.set('group', true);
                }
            },

            isMyself: function () {
                var isFederatedShare = this.get('entity') === undefined;
                return this.get('type') === 'user' && (isFederatedShare ? pUtil.isOwnIdentity(this.get('identifier')) : this.get('entity') === ox.user_id);
            },

            isGroup: function () {
                return this.get('type') === 'group';
            },

            isUser: function () {
                return this.get('type') === 'user';
            },

            isPerson: function () {
                return this.isUser() || this.isGuest();
            },

            isInternal: function () {
                var type = this.get('type');
                return type === 'user' || type === 'group';
            },

            isGuest: function () {
                return this.get('type') === 'guest';
            },

            isAnonymous: function () {
                return this.get('type') === 'anonymous';
            },

            isOwner: function (parentModel) {
                if (!(this.get('entity') || this.get('identifier')) || !parentModel || !_.isFunction(parentModel.getEntity) || !_.isFunction(parentModel.getIdentifier)) return;

                var isFederatedShare = this.get('entity') === undefined;
                return isFederatedShare ? this.get('identifier') === parentModel.getIdentifier() : this.get('entity') === parentModel.getEntity();
            },

            getDisplayName: function (htmlOutput) {
                switch (this.get('type')) {
                    case 'user':
                        return contactsUtil.getFullName(this.get('contact'), htmlOutput);
                    case 'group':
                        return this.get('display_name');
                    case 'guest':
                        var data = this.get('contact');
                        return data[data.field] || data.email1;
                    case 'anonymous':
                        return gt('Public link');
                    // no default
                }
            },

            getEmail: function () {
                return contactsUtil.getMail(this.get('contact'));
            },

            getSortName: function () {
                var data = {};
                switch (this.get('type')) {
                    case 'user':
                        data = this.get('contact');
                        return data.last_name || data.first_name || data.display_name;
                    case 'group':
                        return this.get('display_name');
                    case 'guest':
                        data = this.get('contact');
                        return data[data.field] || data.email1;
                    case 'anonymous':
                        return '';
                    // no default
                }
            },

            // bits    Number  A number as described in Permission flags.
            // entity  Number  (ignored for type “anonymous” or “guest”) User ID of the user or group to which this permission applies.
            // identifier   String  (used as entity for federated sharing)
            // group   Boolean (ignored for type “anonymous” or “guest”) true if entity refers to a group, false if it refers to a user.
            // type    String  (required if no internal “entity” defined) The recipient type, i.e. one of “guest”, “anonymous”
            // email_address   String  (for type “guest”) The e-mail address of the recipient
            // display_name    String  (for type “guest”, optional) The display name of the recipient
            // contact_id  String  (for type “guest”, optional) The object identifier of the corresponding contact entry if the recipient was chosen from the address book
            // contact_folder  String  (for type “guest”, required if “contact_id” is set) The folder identifier of the corresponding contact entry if the recipient was chosen from the address book
            toJSON: function () {

                var type = this.get('type'),
                    data = {
                        bits: this.get('bits')
                    };
                if (this.has('entity') || this.has('identifier')) {
                    data.entity = this.get('entity');
                    data.identifier = this.get('identifier');
                    data.group = type === 'group';
                } else {
                    switch (type) {
                        case 'guest':
                            data.type = type;
                            var contact = this.get('contact');
                            data.email_address = contact[contact.field] || contact.email1;
                            if (this.has('display_name')) {
                                data.display_name = this.get('display_name');
                            }
                            if (contact && contact.id && contact.folder_id) {
                                data.contact_id = contact.id;
                                data.contact_folder = contact.folder_id;
                            }
                            break;
                        case 'anonymous':
                            data.type = type;
                            break;
                        // no default
                    }
                }

                return data;
            }
        }),

        // Permission Collection
        Permissions = Backbone.Collection.extend({

            model: Permission,

            modelId: function (attrs) {
                return attrs.entity ? String(attrs.entity) : attrs.identifier;
            },

            initialize: function () {
                this.on('revert', this.revert);
            },

            // method to check if a guest is already in the collection (they receive entity ids that differ from the emails, so this check is needed)
            isAlreadyGuest: function (newGuest) {
                var guests = this.where({ type: 'guest' }),
                    isGuest = false;
                // use try catch not to run into a js error if the field attribute isn't there or sth
                try {
                    for (var i = 0; i < guests.length; i++) {
                        if (guests[i].attributes.contact.email1 === newGuest.contact[newGuest.field]) {
                            isGuest = true;
                        }
                    }
                } catch (e) {
                    if (ox.debug) console.error(e);
                }

                return isGuest;
            },

            comparator: function (a, b) {
                if (a.isMyself()) return -1;
                if (b.isMyself()) return +1;
                var snA = a.getSortName(),
                    snB = b.getSortName(), lexic;

                // eslint-disable-next-line no-nested-ternary
                lexic = snA === snB ? 0 : (snA > snB ? +1 : -1);

                if (a.isGroup() && b.isGroup()) return lexic;
                if (a.isGroup()) return -1;
                if (b.isGroup()) return +1;
                if (a.isUser() && b.isUser()) return lexic;
                if (a.isUser()) return -1;
                if (b.isUser()) return +1;
                if (a.isGuest() && b.isGuest()) return lexic;
                if (a.isGuest()) return -1;
                if (b.isGuest()) return +1;
                return +1;
            },

            revert: function () {
                // Remove all entries which were not saved yet.
                var newEntities = this.where({ new: true });
                this.remove(newEntities);
            }
        }),

        // Simple permission view
        PermissionEntityView = DisposableView.extend({

            className: 'permission row',

            initialize: function (options) {
                if (this.model.get('type') === 'anonymous') {
                    var self = this,
                        key,
                        remove = function () {
                            self.model.collection.remove(self.model);
                            self.remove();
                        };

                    if (options.parentModel.isFile()) {
                        key = 'remove:link:infostore:' + options.parentModel.get('folder_id') + ':' + options.parentModel.get('id');
                    } else {
                        key = 'remove:link:' + options.parentModel.get('module') + ':' + options.parentModel.get('id');
                    }

                    api.on(key, remove);
                    this.on('dispose', function () {
                        api.off(key, remove);
                    });
                }
                this.parentModel = options.parentModel;
                this.user = null;
                this.display_name = '';
                this.description = '';
                this.ariaLabel = '';

                this.parseBitmask();

                this.listenTo(this.model, 'change:bits', this.onChangeBitmask);
                this.listenTo(this.model, 'change:folder change:read change:write change:delete change:admin', this.updateBitmask);
            },

            onChangeBitmask: function () {
                this.parseBitmask();
            },

            parseBitmask: function () {
                var bitmask = folderAPI.Bitmask(this.model.get('bits'));
                this.model.set({
                    'folder': bitmask.get('folder'),
                    'read':   bitmask.get('read'),
                    'write':  bitmask.get('write'),
                    'delete': bitmask.get('delete'),
                    'admin':  bitmask.get('admin')
                });
            },

            updateBitmask: function () {
                var bitmask = folderAPI.Bitmask(this.model.get('bits'));
                bitmask.set('folder', this.model.get('folder'));
                bitmask.set('read', this.model.get('read'));
                bitmask.set('write', this.model.get('write'));
                bitmask.set('delete', this.model.get('delete'));
                bitmask.set('admin', this.model.get('admin'));
                this.model.set('bits', bitmask.get());
            },

            render: function () {
                this.getEntityDetails();
                if (this.model.get('type') === 'anonymous') return false;
                this.$el.attr({ 'aria-label': this.ariaLabel + '.', 'role': 'group' });
                var baton = ext.Baton({ model: this.model, view: this, parentModel: this.parentModel });
                ext.point(POINT + '/entity').invoke('draw', this.$el.empty(), baton);

                // The menu node is moved outside the PermissionEntityView root node. That's why Backbone event delegate seems to have problems on mobile phones.
                this.$el.find('a[data-name="edit"]').on('click', this.onEdit.bind(this));
                this.$el.find('a[data-name="resend"]').on('click', this.onResend.bind(this));
                this.$el.find('a[data-name="revoke"]').on('click', this.onRemove.bind(this));

                return this;
            },

            onRemove: function (e) {
                e.preventDefault();
                this.model.collection.remove(this.model);
                this.remove();
            },

            onResend: function (e) {

                e.preventDefault();

                var type = this.parentModel.isFile() ? 'file' : 'folder',
                    id = this.parentModel.get('id'),
                    entity = this.model.get('entity');

                api.resend(type, id, entity).then(
                    function success() {
                        yell('success', gt('The notification has been resent'));
                    },
                    function fail(error) {
                        yell(error);
                    }
                );
            },

            onEdit: function (e) {

                e.preventDefault();
                var popup = this.$el.closest('.share-permissions-dialog');

                function cont(data) {
                    // turn parent model into file/folder model
                    var model = new filesAPI.Model(data);
                    ox.load(['io.ox/files/actions/share']).done(function (action) {
                        popup.hide();
                        action.link([model]).one('close', function () {
                            popup.show();
                            popup = model = null;
                        });
                    });
                }

                if (this.parentModel.isFile()) {
                    cont(this.parentModel.attributes);
                } else {
                    folderAPI.get(this.parentModel.get('id')).done(cont);
                }
            },

            getEntityDetails: function () {

                switch (this.model.get('type')) {
                    case 'user':
                        this.user = this.model.get('contact');
                        this.display_name = contactsUtil.getFullName(this.user);
                        this.description = gt('Internal user');
                        break;
                    case 'group':
                        this.display_name = this.model.get('display_name');
                        this.description = gt('Group');
                        break;
                    case 'guest':
                        this.user = this.model.get('contact');
                        this.display_name = this.user[this.user.field] || this.user.email1;
                        this.description = gt('Guest');
                        break;
                    case 'anonymous':
                        // TODO: public vs. password-protected link
                        this.display_name = this.ariaLabel = gt('Public link');
                        this.description = this.model.get('share_url');
                        break;
                    // no default
                }

                //#. description in the permission dialog to indicate that this user can act on your behalf (send mails, check calendar for you, etc)
                if (this.model.get('deputyPermission')) this.description = gt('Deputy');

                // a11y: just say "Public link"; other types use their description
                this.ariaLabel = this.ariaLabel || (this.display_name + ', ' + this.description);
            },

            getRole: function () {
                var bits = this.model.get('bits'), bitmask;
                if (this.model.isOwner(this.parentModel)) {
                    return 'owner';
                } else if (this.parentModel.isFile()) {
                    if (bits === 2 || bits === 4) return 'reviewer';
                } else {
                    bitmask = folderAPI.Bitmask(this.model.get('bits'));
                    if (bitmask.get('admin')) return 'administrator';
                    if (bitmask.get('read') && bitmask.get('write')) {
                        // Author: read, write, delete
                        // Reviewer: read, write
                        return bitmask.get('delete') ? 'author' : 'reviewer';
                    }
                }
                // assumption is that everyone is at least a "Viewer"
                return 'viewer';
            },

            getRoleDescription: function (role) {
                role = role || this.getRole();
                return roles[role] ? roles[role].label : 'N/A';
            },

            // check if it's possible to assign the admin role at all
            supportsAdminRole: function () {

                if (this.parentModel.isFile()) return false;

                var type = this.parentModel.get('type'),
                    module = this.parentModel.get('module');

                // no admin choice for default folders (see Bug 27704)
                if (String(folderAPI.getDefaultFolder(module)) === this.parentModel.get('id')) return false;
                // not for system folders
                if (type === 5) return false;
                // public folder and permission enity 0, i.e. "All users"
                if (type === 2 && this.model.id === 0) return false;
                // private contacts and calendar folders can't have other users with admin permissions
                if (type === 1 && (module === 'contacts' || module === 'calendar')) return false;
                // otherwise
                return true;
            }
        }),

        // All Permissions view
        PermissionsView = DisposableView.extend({

            tagName: 'div',
            permissionPreSelection: null,
            initialPermissions: 0,

            className: 'permissions-view container-fluid',

            initialize: function (options) {
                this.options = options || {};
                this.offset = this.options.offset || 0;
                this.limit = this.options.limit || 100;

                this.collection = new Permissions();
                this.listenTo(this.collection, 'reset', this.renderEntities);
                this.listenTo(this.collection, 'add', this.renderEntity);
                this.listenTo(this.collection, 'revert', this.onReset);

                this.$el.on('scroll', _.debounce(this.onScroll.bind(this), 50));
                this.initialPermissions = this.model.getPermissions().length;
            },

            hasChanges: function () {
                return this.collection.length !== this.initialPermissions;
            },

            onScroll: function () {
                // all drawn already
                if (this.limit >= this.collection.length) return;

                var $list = this.$el,
                    height = $list.outerHeight(),
                    scrollTop = $list[0].scrollTop,
                    scrollHeight = $list[0].scrollHeight,
                    bottom = scrollTop + height;
                if (bottom / scrollHeight < 0.80) return;
                var defer = window.requestAnimationFrame || window.setTimeout;
                defer(this.renderEntities.bind(this));
            },

            onReset: function () {
                this.offset = 0;
                this.$el.empty();
                this.renderEntities();
            },

            render: function () {
                // extended permissions are mandatory now
                if (this.model.isExtendedPermission()) {
                    this.collection.reset(this.model.getPermissions());
                } else {
                    console.error('Extended permissions are mandatory', this);
                }
                return this;
            },

            setPermissionPreSelectionView: function (view) {
                this.permissionPreSelection = view;
            },

            renderEntities: function () {
                this.$el.busy({ immediate: true });
                this.$el.append(
                    this.collection.slice(this.offset, this.offset + this.limit).map(function (model) {
                        return new PermissionEntityView({ model: model, parentModel: this.model }).render().$el;
                    }, this)
                );
                this.offset = this.offset + this.limit;
                this.$el.idle();
                return this;
            },

            renderEntity: function (model) {
                var bits = 0;
                if (this.model.isFile()) {
                    bits = fileRoles[this.permissionPreSelection.getSelectedPermission()];
                } else if (model.get('type') === 'guest' && /^(contacts|tasks)$/.test(this.model.get('module'))) {
                    bits = roles.viewer.bit;
                    // only viewer role allowed, give a message if user preselected another role
                    if (roles[this.permissionPreSelection.getSelectedPermission()].bit !== roles.viewer.bit) {
                        yell('info', gt('Guests are only allowed to have viewer rights.'));
                    }
                } else {
                    bits = roles[this.permissionPreSelection.getSelectedPermission()].bit;
                }


                model.set('bits', bits);

                var newEntity = new PermissionEntityView({ model: model, parentModel: this.model }).render().$el;
                newEntity.find('.display_name').append($('<div class="added">').text(gt('ADDED')));
                return this.$el.prepend(newEntity);
            },

            revokeAll: function () {
                this.$el.find('a[data-name="revoke"]').trigger('click');
            }
        });

    function supportsPersonalShares(objModel) {
        var folderModel = objModel.getFolderModel();
        if (objModel.isAdmin() && folderModel.supportsInternalSharing()) return true;
        if (folderModel.supportsInviteGuests()) return true;
    }

    ext.point(POINT + '/entity').extend(
        //
        // Image
        //
        {
            index: 100,
            id: 'image',
            draw: function (baton) {

                var column = $('<div class="col-sm-1 col-xs-2 image">'),
                    node = $('<span class="contact-picture">');

                if (baton.view.user) {
                    // internal users and guests
                    column.append(
                        contactsAPI.pictureHalo(node, baton.view.user, { width: 40, height: 40 }, { lazyload: true })
                    );
                } else {
                    // groups and links
                    column.append(
                        node.addClass('group').append(
                            $('<i class="fa fa-' + (baton.model.get('type') === 'group' ? 'group' : 'link') + '" aria-hidden="true">')
                        )
                    );
                }

                this.append(column);
            }
        },
        //
        // Display name and type
        //
        {
            index: 200,
            id: 'who',
            draw: function (baton) {

                var url = baton.model.get('share_url');

                this.append(
                    $('<div class="col-sm-5 col-xs-10">').append(
                        $('<div class="display_name">').append($('<div class="name">').append(
                            baton.model.isUser() ? baton.model.getDisplayName(true) : $.txt(baton.model.getDisplayName()))
                        ),
                        $('<div class="description">').append(
                            url ? $('<a href="" target="_blank">').attr('href', url).text(url) : $.txt(baton.view.description)
                        )
                    )
                );
            }
        },
        //
        // User identifier (not userid)
        //
        {
            index: 210,
            id: 'userid',
            draw: function (baton) {
                if (!baton.model.isUser()) return;
                var node = this.find('.description:first'),
                    mail = baton.model.getEmail(),
                    id = _.first(mail.split('@'));
                if (!id) return;
                node.append(
                    $('<span class="post-description">').text(' (' + id + ')')
                );
            }
        },

        //
        // Role dropdown
        //
        {
            index: 300,
            id: 'role',
            draw: function (baton) {

                var $el, dropdown,
                    role = baton.view.getRole(),
                    description = baton.view.getRoleDescription(role),
                    isFile = baton.parentModel.isFile(),
                    isOwner = baton.model.isOwner(baton.parentModel),
                    module = baton.parentModel.get('module'),
                    supportsWritePrivileges = baton.model.isInternal() || !/^(contacts|tasks)$/.test(module);

                // apply role for the first time
                baton.model.set('role', role, { silent: true });

                $el = $('<div class="col-sm-3 col-sm-offset-0 col-xs-4 col-xs-offset-2 role">');

                if (!baton.parentModel.isAdmin() || isOwner || !supportsWritePrivileges || baton.model.isAnonymous() || baton.model.get('deputyPermission')) {
                    $el.text(description);
                } else {
                    dropdown = new DropdownView({ el: $el.addClass('dropdown')[0], caret: true, label: description, title: gt('Current role'), model: baton.model, smart: true, buttonToggle: true })
                        .option('role', 'viewer', function () {
                            return [$.txt(gt('Viewer')), $.txt(' '), $('<br/><small>').text(gt('Read only'))];
                        })
                        .option('role', 'reviewer', function () {
                            return [$.txt(gt('Reviewer')), $.txt(' '), $('<br/><small>').text(gt('Read and write'))];
                        });
                    if (!isFile) {
                        // files cannot be deleted in file-based shares
                        dropdown.option('role', 'author', function () {
                            return [$.txt(gt('Author')), $.txt(' '), $('<br/><small>').text(gt('Read, write and delete'))];
                        });
                    }
                    if (baton.view.supportsAdminRole()) {
                        dropdown.divider().option('role', 'administrator', gt('Administrator'));
                    }
                    // respond to changes
                    baton.view.listenTo(baton.model, {
                        'change': _.debounce(function (model) {
                            // just update the role - not the bits
                            role = baton.view.getRole();
                            model.set('role', role, { silent: true });
                            // always update the drop-down label
                            dropdown.$('.dropdown-label').text(baton.view.getRoleDescription(role));
                        }, 10),
                        'change:role': function (model, value) {
                            model.set('bits', isFile ? fileRoles[value] : roles[value].bit);
                        }
                    });
                    dropdown.render();
                }

                this.append($el);
            }
        },
        //
        // Detailed dropdown
        //
        {
            index: 400,
            id: 'detail-dropdown',
            draw: function (baton) {

                var model = baton.model,
                    isAnonymous = model.isAnonymous(),
                    module = baton.parentModel.get('module'),
                    supportsWritePrivileges = model.isInternal() || !/^(contacts|tasks)$/.test(module);

                // not available for anonymous links or deputies(read-only)
                if (isAnonymous || baton.model.get('deputyPermission')) {
                    this.append('<div class="col-sm-2 col-xs-4">');
                    return;
                }

                // simple variant for files
                if (baton.parentModel.isFile()) {
                    // only fix invalid values
                    var bits = model.get('bits');
                    if (bits < 1 || bits > 4) model.set('bits', 1);
                    this.append($('<div class="col-sm-2 col-xs-4 detail-dropdown">'));
                    return;
                }

                // take care of highest bit (64 vs 4 vs 2)
                var maxFolder = model.get('folder') === 64 ? 64 : 4,
                    maxRead = model.get('read') === 64 ? 64 : 2,
                    maxWrite = model.get('write') === 64 ? 64 : 2,
                    maxDelete = model.get('delete') === 64 ? 64 : 2;

                var dropdown = new DropdownView({ caret: true, keep: true, label: gt('Details'), title: gt('Detailed access rights'), model: model, smart: true, buttonToggle: true })
                    //
                    // FOLDER access
                    //
                    .group(gt('Folder'))
                    //#. folder permissions
                    .option('folder', 1, gt('View the folder'), { radio: true, group: true })
                    //#. folder permissions
                    .option('folder', 2, gt('Create objects'), { radio: true, group: true })
                    //#. folder permissions
                    .option('folder', maxFolder, gt('Create objects and subfolders'), { radio: true, group: true })
                    //
                    // READ access
                    //
                    .divider()
                    .group(gt('Read permissions'))
                    //#. object permissions - read
                    .option('read', 0, gt('None'), { radio: true, group: true })
                    //#. object permissions - read
                    .option('read', 1, gt('Read own objects'), { radio: true, group: true })
                    //#. object permissions - read
                    .option('read', maxRead, gt('Read all objects'), { radio: true, group: true })
                    //
                    // WRITE access
                    //
                    .divider()
                    .group(gt('Write permissions'))
                    //#. object permissions - edit/modify
                    .option('write', 0, gt('None'), { radio: true, group: true })
                    //#. object permissions - edit/modify
                    .option('write', 1, gt('Edit own objects'), { radio: true, group: true })
                    //#. object permissions - edit/modify
                    .option('write', maxWrite, gt('Edit all objects'), { radio: true, group: true })
                    //
                    // DELETE access
                    //
                    .divider()
                    .group(gt('Delete permissions'))
                    //#. object permissions - delete
                    .option('delete', 0, gt('None'), { radio: true, group: true })
                    //#. object permissions - delete
                    .option('delete', 1, gt('Delete own objects'), { radio: true, group: true })
                    //#. object permissions - delete
                    .option('delete', maxDelete, gt('Delete all objects'), { radio: true, group: true });

                // add admin role?
                if (baton.view.supportsAdminRole()) {
                    //
                    // ADMIN role
                    //
                    dropdown
                    .divider()
                    .group(gt('Administrative role'))
                    //#. object permissions - user role
                    .option('admin', 0, gt('User'), { radio: true, group: true })
                    //#. object permissions - admin role
                    .option('admin', 1, gt('Administrator'), { radio: true, group: true });
                }

                dropdown.render();

                // disable all items if not admin or if not any write privileges
                if (!baton.parentModel.isAdmin() || !supportsWritePrivileges) {
                    dropdown.$('li > a').addClass('disabled').prop('disabled', true);
                }

                this.append(
                    $('<div class="col-sm-2 col-xs-4 detail-dropdown">').append(dropdown.$el)
                );
            }
        },
        //
        // Remove button
        //
        {
            index: 500,
            id: 'actions',
            draw: function (baton) {

                var isFolderAdmin = folderAPI.Bitmask(baton.parentModel.get('own_rights')).get('admin') >= 1;
                if (!baton.parentModel.isAdmin()) return;
                if (isFolderAdmin && baton.model.isOwner(baton.parentModel)) return;

                if (baton.model.get('deputyPermission')) return;

                var dropdown = new DropdownView({ label: $('<i class="fa fa-bars" aria-hidden="true">'), smart: true, title: gt('Actions'), buttonToggle: true }),
                    type = baton.model.get('type'),
                    myself = baton.model.isMyself(),
                    isNew = baton.model.has('new'),
                    isMail = baton.parentModel.get('module') === 'mail';

                switch (type) {
                    case 'group':
                        dropdown.link('revoke', isNew ? gt('Remove') : gt('Revoke access'));
                        break;
                    case 'user':
                    case 'guest':
                        if (!myself && !isNew && !isMail) {
                            dropdown.link('resend', gt('Resend invitation')).divider();
                        }
                        dropdown.link('revoke', isNew ? gt('Remove') : gt('Revoke access'));
                        break;
                    case 'anonymous':
                        if (capabilities.has('share_links')) {
                            dropdown.link('edit', gt('Edit')).divider();
                        }
                        dropdown.link('revoke', isNew ? gt('Remove') : gt('Revoke access'));
                        break;
                    // no default
                }

                this.append(
                    $('<div class="col-sm-1 col-xs-2 entity-actions">').append(
                        dropdown.render().$el
                    )
                );
            }
        }
    );

    // Extension point who can access share
    var POINT_DIALOG = 'io.ox/files/share/dialog';
    ext.point(POINT_DIALOG + '/share-settings').extend({
        id: 'who-can-share',
        index: 100,
        draw: function (linkModel, baton) {
            var guid,
                dialog = baton.view,
                objModel = dialog.views.permissions.model,
                supportsPersonal = supportsPersonalShares(objModel);
            linkModel.set('access', linkModel.hasUrl() ? 1 : 0);

            var typeTranslations = {
                0: gt('Invited people only'),
                1: gt('Anyone with the link and invited people')
            };

            // link-only case
            if (!supportsPersonal) {
                typeTranslations = {
                    0: gt('Listed people only'),
                    1: gt('Anyone with the link and listed people')
                };
            }

            var select = $('<select>');
            _(typeTranslations).each(function (val, key) {
                key = parseInt(key, 10);
                var option = $('<option>').val(key).text(val);
                if (key === linkModel.get('access')) {
                    option.attr('selected', 'selected');
                }
                select.append(option);
            });
            // File linkModel.get('files')[0].get('filename')
            // Calendar linkModel.get('files')[0].get('module') === calendar
            var accessLabel;
            var model = linkModel.get('files')[0];
            if (model.isFile()) {
                accessLabel = gt('Who can access this file?');
            } else if (model.get('module') === 'calendar') {
                accessLabel = gt('Who can access this calendar?');
            } else {
                accessLabel = gt('Who can access this folder?');
            }

            this.append(
                $('<div class="access-select"></div>').append(
                    $('<label></label>').attr({ for: guid = _.uniqueId('form-control-label-') }).text(accessLabel),
                    $('<div>').addClass('row vertical-align-center').append($('<div>').addClass('form-group col-sm-6').append(select.attr('id', guid)))
                )
            );

            select.on('change', function (e) {
                linkModel.set('access', parseInt(e.target.value, 10));
            });
        }
    });

    // helper
    function getBitsExternal(model) {
        return model.isFolder() ? 257 : 1;
    }

    var that = {

        Permission: Permission,

        Permissions: Permissions,

        // async / id is folder id
        showFolderPermissions: function (id, linkModel, options) {
            var model = folderAPI.pool.getModel(id),
                opt = _.extend({
                    hasLinkSupport: capabilities.has('share_links') && !model.is('mail') && model.isShareable(id)
                }, options);
            that.showByModel(new Backbone.Model({ id: id }), [].concat(linkModel), opt);
        },

        // async / obj must provide folder_id and id
        showFilePermissions: function (obj, options) {
            that.showByModel(new Backbone.Model(obj), options);
        },

        showByModel: function (model, linkModel, options) {
            //var oldModel = model;
            var isFile = model.isFile ? model.isFile() : model.has('folder_id');
            model = new api.Model(isFile ? model.pick('id', 'folder_id') : model.pick('id'));
            model.loadExtendedPermissions({ cache: false })
            .done(function () {
                that.show(model, linkModel, options);
            })
            // workaround: when we don't have permissions anymore for a folder a 'http:error:FLD-0003' is returned.
            // usually we have a handler in files/main.js for this case, but due to the current following conditions no yell is called
            // -> check if this handling should be changed later so that the FLD-0003' is handled globally
            .fail(function (error) {
                yell(error);
            });
        },

        // to be more self explaining
        showShareDialog: function (model) {
            that.show(model, { share: true });
        },

        show: function (objModel, linkModel, options) {

            // folder tree: nested (whitelist) vs. flat, consider the inbox folder as flat since it is drawn detached from it's subfolders (confuses users if suddenly all folders are shared instead of just the inbox)
            var nested = folderAPI.isNested(objModel.get('module')) && objModel.get('id') !== mailSettings.get('folder/inbox'),
                notificationDefault = false,
                title,
                guid;

            // options must be given to modal dialog. Custom dev uses them.
            options = _.extend({
                async: true,
                focus: '.form-control.tt-input',
                help: 'ox.appsuite.user.sect.dataorganisation.sharing.share.html',
                title: title,
                smartphoneInputFocus: true,
                hasLinkSupport: false,
                nested: nested,
                width: '35.25rem',
                share: false }, options);

            var objectType;
            if (objModel.get('module') === 'calendar') {
                objectType = gt('calendar');
            } else if (objModel.isFile()) {
                objectType = gt('file');
            } else {
                objectType = gt('folder');
            }

            options.title = options.title || (options.share ?
                //#. %1$s determines whether setting permissions for a file or folder
                //#. %2$s is the file or folder name
                gt('Share %1$s "%2$s"', (objModel.isFile() ? gt('file') : gt('folder')), objModel.getDisplayName()) :
                gt('Permissions for %1$s "%2$s"', objectType, objModel.getDisplayName()));

            options.point = 'io.ox/files/share/permissions/dialog';

            var dialog = new ModalDialog(options);
            dialog.waiting = $.when();

            var DialogConfigModel = Backbone.Model.extend({
                defaults: {
                    // default is true for nested and false for flat folder tree, #53439
                    cascadePermissions: nested,
                    message: '',
                    sendNotifications: notificationDefault,
                    disabled: false
                },
                toJSON: function () {
                    var data = {
                        cascadePermissions: this.get('cascadePermissions'),
                        notification: { transport: 'mail' }
                    };

                    if (dialogConfig.get('sendNotifications')) {
                        // add personal message only if not empty
                        // but always send notification!
                        if (this.get('message') && $.trim(this.get('message')) !== '') {
                            data.notification.message = this.get('message');
                        }
                    } else {
                        delete data.notification;
                    }
                    return data;
                }
            });

            var dialogConfig = new DialogConfigModel(),
                permissionsView = new PermissionsView({ model: objModel }),
                publicLink = new PublicLink({ files: linkModel }),
                permissionPreSelection = new PermissionPreSelection({ model: objModel });

            dialog.model = dialogConfig;
            dialog.views = {
                permissions: permissionsView,
                preselection: permissionPreSelection,
                link: publicLink
            };

            dialog.$('.modal-content').addClass(supportsPersonalShares(objModel) ? 'supports-personal-shares' : '');

            permissionsView.setPermissionPreSelectionView(permissionPreSelection);
            if (options.hasLinkSupport) {
                var baton = new ext.Baton({ view: dialog, model: dialogConfig });
                ext.point(POINT_DIALOG + '/share-settings').invoke('draw', dialog.$body, publicLink.model, baton);
            }

            publicLink.model.on('change:access', function (model) {
                var accessMode = model.get('access');
                if (accessMode === 0) {
                    publicLink.hide();
                    publicLink.removeLink();
                    dialog.waiting = publicLink.removeLink();
                } else {
                    publicLink.show();
                    publicLink.fetchLink();
                }
            });

            function hasNewGuests() {
                var knownGuests = [];
                _.each(dialogConfig.get('oldGuests'), function (model) {
                    if (permissionsView.collection.get(model)) {
                        knownGuests.push(model);
                    }
                });
                return permissionsView.collection.where({ type: 'guest' }).length > knownGuests.length;
            }

            permissionsView.listenTo(permissionsView.collection, 'reset', function () {
                dialogConfig.set('oldGuests', _.copy(permissionsView.collection.where({ type: 'guest' })));
            });

            permissionsView.listenTo(permissionsView.collection, 'add', function () {
                dialog.showFooter();
            });

            permissionsView.listenTo(permissionsView.collection, 'add remove', function () {
                updateSendNotificationSettings();
                dialog.$body.find('.file-share-options').toggle(permissionsView.collection.length > 0);
            });

            dialogConfig.on('change:message', function () {
                updateSendNotificationSettings();
            });

            function updateSendNotificationSettings() {
                // Allways send a notification message if a guest is added or some text is in the message box
                if (hasNewGuests() || (!_.isEmpty(dialogConfig.get('message')) && permissionsView.collection.length > 0)) {
                    dialogConfig.set('sendNotifications', true);
                    dialogConfig.set('disabled', true);
                } else if (dialogConfig.get('byHand') !== undefined) {
                    dialogConfig.set('sendNotifications', dialogConfig.get('byHand'));
                    dialogConfig.set('disabled', false);
                } else {
                    dialogConfig.set('sendNotifications', notificationDefault);
                    dialogConfig.set('disabled', false);
                }
            }

            function unshareRequested() {
                var confirmDialog = new ModalDialog({
                    async: true,
                    title: gt('Remove shares')
                });
                confirmDialog
                .addCancelButton()
                .addButton({ label: gt('OK'), action: 'ok' });
                confirmDialog.on('ok', function () {
                    if (publicLink.hasPublicLink()) {
                        // Remove all permissions and public link then trigger save.
                        publicLink.removeLink().then(function () {
                            revokeAllPermissions();
                        }).fail(function (err) {
                            console.log(err);
                        });
                    } else {
                        revokeAllPermissions();
                    }
                    confirmDialog.close();
                    dialog.pause();
                });
                confirmDialog.on('cancel', function () {
                    dialog.idle();
                });
                confirmDialog.$body.append($('<h5>')).text(gt('Do you really want to remove all shares?'));
                confirmDialog.open();
            }

            function revokeAllPermissions() {
                permissionsView.revokeAll();
                dialog.trigger('save');
            }

            function isShared() {
                return (objModel.has('com.openexchange.share.extendedObjectPermissions')
                    && objModel.get('com.openexchange.share.extendedObjectPermissions').length > 0)
                    || (objModel.has('com.openexchange.share.extendedPermissions')
                    && objModel.get('com.openexchange.share.extendedPermissions').length > 0)
                    || publicLink.hasPublicLink();
            }

            if (objModel.isAdmin()) {
                dialog.$footer.prepend(
                    $('<div class="form-group">').addClass(_.device('smartphone') ? '' : 'cascade').append(
                        $('<button class="btn btn-default" aria-label="Unshare"></button>').text(gt('Unshare')).prop('disabled', !isShared()).on('click', function () {
                            unshareRequested();
                        })
                    )
                );
            }

            dialog.$el.addClass('share-permissions-dialog');

            // to change privileges you have to a folder admin
            var supportsChanges = objModel.isAdmin(),
                folderModel = objModel.getFolderModel();

            // whether you can invite further people is a different question:
            // A. you have to be the admin AND (
            //   B. you can invite guests (external contacts) OR
            //   C. you are in a groupware context (internal users and/or groups)
            // )
            var supportsInvites = supportsChanges && folderModel.supportsInternalSharing(),
                supportsGuests = folderModel.supportsInviteGuests();

            var settingsButton = $('<button type="button" class="btn settings-button" aria-label="Settings"><span class="fa fa-cog" aria-hidden="true"></span></button>').on('click', function () {
                openSettings();
            });
            dialog.$header.append(settingsButton);

            if (options.hasLinkSupport) {
                dialog.$body.append(
                    publicLink.render().$el
                );
            }

            if (supportsInvites) {

                /*
                 * extension point for autocomplete item
                 */
                ext.point(POINT + '/autoCompleteItem').extend({
                    id: 'view',
                    index: 100,
                    draw: function (participant) {
                        this.append(new pViews.ParticipantEntryView({
                            model: participant,
                            closeButton: false,
                            halo: false,
                            field: true
                        }).render().$el);
                    }
                });

                var module = objModel.get('module'),
                    usePicker = !_.device('smartphone') && capabilities.has('contacts') && settingsContacts.get('picker/enabled', true),
                    click = function (e, member) {
                        // build extended permission object
                        var isInternal = /^(1|2)$/.test(member.get('type')) || member.has('user_id'),
                            isGuest = !isInternal && member.get('type') === 5,
                            obj = {
                                bits: isInternal ? 4227332 : getBitsExternal(objModel), // Author : (Viewer for folders: Viewer for files)
                                group: member.get('type') === 2,
                                type: member.get('type') === 2 ? 'group' : 'user',
                                new: true
                            };
                        if (isInternal) {
                            obj.entity = member.has('user_id') ? member.get('user_id') : member.get('id');
                        }
                        obj.contact = member.toJSON();
                        obj.display_name = member.getDisplayName();
                        if (isGuest) {
                            obj.type = 'guest';
                            obj.contact_id = member.get('id');
                            obj.folder_id = member.get('folder_id');
                            obj.field = member.get('field');
                            // guests don't have a proper entity id yet, so we have to check by email
                            if (permissionsView.collection.isAlreadyGuest(obj)) return;
                        }
                        permissionsView.collection.add(obj);
                    };

                var typeaheadView = new Typeahead({
                    apiOptions: {
                        // mail does not support sharing folders to guets
                        contacts: supportsGuests,
                        users: true,
                        groups: true
                    },
                    placeholder: gt('Name or email address'),
                    harmonize: function (data) {
                        data = _(data).map(function (m) {
                            return new pModel.Participant(m);
                        });
                        // remove duplicate entries from typeahead dropdown
                        return _(data).filter(function (model) {
                            // don't offer secondary addresses as guest accounts
                            if (!supportsGuests && model.get('field') !== 'email1') return false;
                            // mail does not support sharing folders to guets
                            if (module === 'mail' && model.get('field') !== 'email1') return false;
                            return !permissionsView.collection.get(model.id);
                        });
                    },
                    click: click,
                    extPoint: POINT
                });

                if (objModel.isFolder() && options.nested) {
                    dialogConfig.set('cascadePermissions', true);
                }

                dialog.$body.append(
                    // Invite people pane
                    $('<div id="invite-people-pane" class="share-pane invite-people"></div>').append(
                        // Invite people header
                        $('<h5></h5>').text(gt('Invite people')),
                        // Add address picker
                        $('<div class="row vertical-align-center">').append(
                            $('<div class="form-group col-sm-6">').append(
                                $('<div class="input-group">').toggleClass('has-picker', usePicker).append(
                                    $('<label class="sr-only">', { 'for': guid = _.uniqueId('form-control-label-') }).text(gt('Start typing to search for user names')),
                                    typeaheadView.$el.attr({ id: guid }),
                                    usePicker ? new AddressPickerView({
                                        isPermission: true,
                                        process: click,
                                        useGABOnly: !supportsGuests
                                    }).render().$el : []
                                )
                            )
                            // use delegate because typeahead's uses stopPropagation(); apparently not stopImmediatePropagation()
                            .on('keydown blur', 'input', function addManualInput(e) {

                                // mail does not support sharing folders to guests
                                // so we skip any manual edits
                                if (module === 'mail') return;

                                // skip manual edit if invite_guests isn't set
                                if (!supportsGuests) return;

                                // enter or blur?
                                if (e.type === 'keydown' && e.which !== 13) return;

                                // use shown input
                                var value = $.trim($(this).typeahead('val')),
                                    list = coreUtil.getAddresses(value);

                                _.each(list, function (value) {
                                    if (_.isEmpty(value)) return;
                                    var obj = {
                                        bits: getBitsExternal(objModel),
                                        contact: { email1: value },
                                        type: 'guest',
                                        new: true,
                                        field: 'email1'
                                    };
                                    if (permissionsView.collection.isAlreadyGuest(obj)) return;
                                    // add to collection
                                    permissionsView.collection.add(obj);
                                });

                                // clear input field
                                $(this).typeahead('val', '');
                            }),
                            $('<div>').text(gt('Invite as: ')),
                            permissionPreSelection.render().$el
                        )
                    ),

                    $('<div class="file-share-options form-group">')
                    .toggle(false)
                    .addClass(_.browser.IE ? 'IE' : 'nonIE')
                    .append(
                        $('<label>')
                            .text(gt('Invitation message (optional)'))
                            .attr({ for: guid = _.uniqueId('form-control-label-') }),
                        // message text
                        new miniViews.TextView({
                            name: 'message',
                            model: dialogConfig
                        })
                        .render().$el.addClass('message-text')
                        .attr({
                            id: guid,
                            rows: 3,
                            //#. placeholder text in share dialog
                            placeholder: gt('Message will be sent to all newly invited people')
                        })
                    )
                );

                // apply polyfill for CSS resize which IE doesn't support natively
                if (_.browser.IE) {
                    window.resizeHandlerPolyfill(dialog.$body.find('.message-text')[0]);
                }

                typeaheadView.render();
            }

            if (supportsChanges) {
                // add action buttons
                dialog
                    .addButton({ action: 'abort', label: options.share ? gt('Cancel') : gt('Cancel'), className: 'btn-default' })
                    .addButton({ action: 'save', label: options.share ? gt('Share') : gt('Save') });
            } else {
                dialog
                    .addButton({ action: 'cancel', label: gt('Close') });
            }

            function openSettings() {
                var settingsView = new shareSettings.ShareSettingsView({ model: publicLink, hasLinkSupport: options.hasLinkSupport, supportsPersonalShares: supportsPersonalShares(objModel), applyToSubFolder: objModel.isFolder() && options.nested, dialogConfig: dialogConfig });
                shareSettings.showSettingsDialog(settingsView);
            }

            function mergePermissionsAndPublicLink(permissions, entity, bits) {
                var existingEntity = _.findWhere(permissions, { entity: entity });
                if (!existingEntity) {
                    permissions.push({ bits: bits, entity: entity, group: false });
                }
                return permissions;
            }

            dialog.on('save', function () {
                // Order matters. In case there is a unresolved 'removeLink' request this has to be finished first.
                // Share must be called before the update call is invoked. Otherwise a file conflict is created.
                $.when(dialog.waiting).always(function () {
                    var changes, options = dialogConfig.toJSON(), def;
                    var entity = publicLink.model.get('entity');
                    var permissions = permissionsView.collection.toJSON();

                    publicLink.share().then(function () {
                        if (entity && publicLink.hasChanges()) {
                            permissions = mergePermissionsAndPublicLink(permissions, entity, objModel.isFolder() ? 257 : 1);
                        }
                        if (objModel.isFolder()) {
                            changes = { permissions: permissions };
                            def = folderAPI.update(objModel.get('id'), changes, options);
                        } else {
                            changes = { object_permissions: permissions };
                            def = filesAPI.update(objModel.pick('folder_id', 'id'), changes, options);
                        }

                        def.then(
                            function success() {
                                // refresh the guest group (id = int max value)
                                groupApi.refreshGroup(2147483647);
                                objModel.reload().then(
                                    function () {
                                        dialog.close();
                                        // we might have new addresses
                                        contactsAPI.trigger('maybeNewContact');
                                    },
                                    function (error) {
                                        dialog.idle();
                                        yell(error);
                                    }
                                );
                            },
                            function fail(error) {
                                dialog.idle();
                                yell(error);
                            }
                        );
                    });
                });
            });

            dialog.on('abort', function () {
                if (permissionsView.hasChanges() || publicLink.hasChanges()) {
                    var confirmDialog = new ModalDialog({
                        async: true,
                        title: gt('Discard changes')
                    });
                    confirmDialog
                    .addCancelButton()
                    .addButton({ label: gt('Discard'), action: 'ok' });
                    confirmDialog.on('ok', function () {
                        publicLink.cancel();
                        confirmDialog.close();
                        dialog.close();
                    });
                    confirmDialog.on('cancel', function () {
                        confirmDialog.close();
                        dialog.idle();
                    });
                    dialog.pause();
                    confirmDialog.$body.append($('<h5>')).text(gt('Do you really want to discard all changes?'));
                    confirmDialog.open();
                } else {
                    dialog.close();
                }
            });

            // add permissions view
            // yep every microsoft browser needs this. edge or ie doesn't matter. No support for "resize: vertical" css attribute
            if (supportsInvites) {
                dialog.$body.addClass(_.browser.IE ? 'IE11' : '').find('#invite-people-pane').append(
                    permissionsView.$el.busy({
                        empty: false,
                        immediate: true
                    })
                );
            } else {
                dialog.$body.addClass(_.browser.IE ? 'IE11' : '').append(
                    permissionsView.$el.busy({
                        empty: false,
                        immediate: true
                    })
                );
            }

            dialog.on('open', function () {
                // wait for dialog to render and busy spinner to appear
                _.delay(function () {
                    permissionsView.render();
                    dialog.idle();
                }, 50);
            })
            .busy()
            .open();
        }
    };

    return that;
});
