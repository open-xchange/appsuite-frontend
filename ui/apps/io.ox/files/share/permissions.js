/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author David Bauer <david.bauer@open-xchange.com>
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

 define('io.ox/files/share/permissions', [
    'io.ox/core/extensions',
    'io.ox/backbone/disposable',
    'io.ox/core/yell',
    'io.ox/backbone/mini-views',
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/core/folder/api',
    'io.ox/files/api',
    'io.ox/files/share/api',
    'io.ox/core/api/user',
    'io.ox/core/api/group',
    'io.ox/contacts/api',
    'io.ox/core/tk/dialogs',
    'io.ox/contacts/util',
    'io.ox/core/tk/typeahead',
    'io.ox/participants/model',
    'io.ox/participants/views',
    'io.ox/core/capabilities',
    'gettext!io.ox/core',
    'less!io.ox/files/share/style',
    // todo: relocate smart-dropdown logic
    'io.ox/core/tk/flag-picker'
], function (ext, DisposableView, yell, miniViews, DropdownView, folderAPI, filesAPI, api, userAPI, groupAPI, contactsAPI, dialogs, contactsUtil, Typeahead, pModel, pViews, capabilities, gt) {

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

            idAttribute: 'entity',

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
                return this.get('type') === 'user' && this.get('entity') === ox.user_id;
            },

            isGroup: function () {
                return this.get('type') === 'group';
            },

            isUser: function () {
                return this.get('type') === 'user';
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

            getDisplayName: function (htmlOutput) {
                switch (this.get('type')) {
                    case 'user':
                        return contactsUtil.getFullName(this.get('contact'), htmlOutput);
                    case 'group':
                        return this.get('display_name');
                    case 'guest':
                        var data = this.get('contact');
                        return data[data.field] || data.email1;
                    case 'anonymous':
                        return gt('Public link');
                }
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
                        var data = this.get('contact');
                        return data[data.field] || data.email1;
                    case 'anonymous':
                        return '';
                }
            },

            // bits    Number  A number as described in Permission flags.
            // entity  Number  (ignored for type “anonymous” or “guest”) User ID of the user or group to which this permission applies.
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

                if (this.has('entity')) {
                    data.entity = this.get('entity');
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
                    }
                }

                return data;
            }
        }),

        // Permission Collection
        Permissions = Backbone.Collection.extend({

            model: Permission,

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
                }

                return isGuest;
            },

            comparator: function (a, b) {
                if (a.isMyself()) return -1;
                if (b.isMyself()) return +1;
                var snA = a.getSortName(),
                    snB = b.getSortName(),
                    lexic = snA < snB ? -1 : snA > snB ? +1 : 0;
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
            }
        }),

        // Simple permission view
        PermissionEntityView = DisposableView.extend({

            className: 'permission row',

            events: {
                'click a.bit': 'updateDropdown',
                'click a[data-name="edit"]': 'onEdit',
                'click a[data-name="resend"]': 'onResend',
                'click a[data-name="revoke"]': 'onRemove'
            },

            initialize: function (options) {

                this.parentModel = options.parentModel;
                this.user = null;
                this.display_name = '';
                this.description = '';

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
                var baton = ext.Baton({ model: this.model, view: this, parentModel: this.parentModel });
                ext.point(POINT + '/entity').invoke('draw', this.$el.empty(), baton);
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
                        this.display_name = this.user[this.user.field] || this.user.email1;
                        this.description = gt('Guest');
                        break;
                    case 'anonymous':
                        // TODO: public vs. password-protected link
                        this.display_name = gt('Public link');
                        this.description = this.model.get('share_url');
                        break;
                }
            },

            getRole: function () {
                var bits = this.model.get('bits'), bitmask;
                if (this.parentModel.isFile()) {
                    if (bits === 2 || bits === 4) return 'reviewer';
                } else if (this.model.get('entity') === this.parentModel.get('created_by')) {
                    return 'owner';
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

            className: 'permissions-view container-fluid',

            initialize: function () {
                this.collection = new Permissions();
                this.listenTo(this.collection, 'reset', this.renderAllEntities);
                this.listenTo(this.collection, 'add', this.renderEntity);
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

            renderAllEntities: function () {
                this.$el.empty().append(
                    this.collection.map(function (model) {
                        return new PermissionEntityView({ model: model, parentModel: this.model }).render().$el;
                    }, this)
                );
                return this;
            },

            renderEntity: function (model) {
                var children = this.$el.children(),
                    index = this.collection.indexOf(model),
                    newEntity = new PermissionEntityView({ model: model, parentModel: this.model }).render().$el;
                if (index === 0) {
                    this.$el.prepend(newEntity);
                } else if (children.length > 1) {
                    this.$el.children().eq(index - 1).after(newEntity);
                } else {
                    this.$el.append(newEntity);
                }
            }
        });

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
                        contactsAPI.pictureHalo(node, baton.view.user, { width: 40, height: 40 })
                    );
                } else {
                    // groups and links
                    column.append(
                        node.addClass('group').append(
                            $('<i class="fa fa-' + (baton.model.get('type') === 'group' ? 'group' : 'link') + '">')
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
                        $('<div class="display_name">').append(
                            baton.model.isUser() ? baton.model.getDisplayName(true) : $.txt(baton.model.getDisplayName())
                        ),
                        $('<div class="description">').append(
                            url ? $('<a href="" target="_blank" tabindex="1">').attr('href', url).text(url) : $.txt(baton.view.description)
                        )
                    )
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

                var $el, node, dropdown,
                    role = baton.view.getRole(),
                    description = baton.view.getRoleDescription(role),
                    isFile = baton.parentModel.isFile(),
                    isOwner = baton.model.get('entity') === baton.parentModel.get('created_by'),
                    module = baton.parentModel.get('module'),
                    supportsWritePrivileges = baton.model.isInternal() || !/^(contacts|calendar|tasks)$/.test(module);

                // apply role for the first time
                baton.model.set('role', role, { silent: true });

                $el = $('<div class="col-sm-3 col-sm-offset-0 col-xs-4 col-xs-offset-2 role">');

                if (!baton.parentModel.isAdmin() || isOwner || !supportsWritePrivileges || baton.model.isAnonymous()) {
                    $el.text(description);
                } else {
                    dropdown = new DropdownView({ el: $el.addClass('dropdown')[0], caret: true, label: description, title: gt('Current role'), model: baton.model, smart: true })
                        .option('role', 'viewer', function () {
                            return [$.txt(gt('Viewer')), $.txt(' '), $('<small>').text(gt('(Read only)'))];
                        })
                        .option('role', 'reviewer', function () {
                            return [$.txt(gt('Reviewer')), $.txt(' '), $('<small>').text(gt('(Read and write)'))];
                        });
                    if (!isFile) {
                        // files cannot be deleted in file-based shares
                        dropdown.option('role', 'author', function () {
                            return [$.txt(gt('Author')), $.txt(' '), $('<small>').text(gt('(Read, write, and delete)'))];
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
                    node = dropdown.render().$el;
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
                    supportsWritePrivileges = model.isInternal() || !/^(contacts|calendar|tasks)$/.test(module);

                // not available for anonymous links (read-only)
                if (isAnonymous) {
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

                var dropdown = new DropdownView({ caret: true, keep: true, label: gt('Details'), model: model, smart: true })
                    //
                    // FOLDER access
                    //
                    .header(gt('Folder'))
                    //#. folder permissions
                    .option('folder', 1, gt('View the folder'))
                    //#. folder permissions
                    .option('folder', 2, gt('Create objects'))
                    //#. folder permissions
                    .option('folder', maxFolder, gt('Create objects and subfolders'))
                    //
                    // READ access
                    //
                    .divider()
                    .header(gt('Read permissions'))
                    //#. object permissions - read
                    .option('read', 0, gt('None'))
                    //#. object permissions - read
                    .option('read', 1, gt('Read own objects'))
                    //#. object permissions - read
                    .option('read', maxRead, gt('Read all objects'))
                    //
                    // WRITE access
                    //
                    .divider()
                    .header(gt('Write permissions'))
                    //#. object permissions - edit/modify
                    .option('write', 0, gt('None'))
                    //#. object permissions - edit/modify
                    .option('write', 1, gt('Edit own objects'))
                    //#. object permissions - edit/modify
                    .option('write', maxWrite, gt('Edit all objects'))
                    //
                    // DELETE access
                    //
                    .divider()
                    .header(gt('Delete permissions'))
                    //#. object permissions - delete
                    .option('delete', 0, gt('None'))
                    //#. object permissions - delete
                    .option('delete', 1, gt('Delete own objects'))
                    //#. object permissions - delete
                    .option('delete', maxDelete, gt('Delete all objects'));

                // add admin role?
                if (baton.view.supportsAdminRole()) {
                    //
                    // ADMIN role
                    //
                    dropdown
                    .divider()
                    .header(gt('Administrative role'))
                    //#. object permissions - user role
                    .option('admin', 0, gt('User'))
                    //#. object permissions - admin role
                    .option('admin', 1, gt('Administrator'));
                }

                dropdown.render();

                // disable all items if not admin or if not any write privileges
                if (!baton.parentModel.isAdmin() || !supportsWritePrivileges) dropdown.$('li > a').addClass('disabled');

                this.append(
                    $('<div class="col-sm-2 col-xs-4 detail-dropdown">').append(
                        dropdown.$el.attr('title', gt('Detailed access rights'))
                    )
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
                if (isFolderAdmin && baton.model.get('entity') === baton.parentModel.get('created_by')) return;

                var dropdown = new DropdownView({ label: $('<i class="fa fa-bars">'), smart: true, title: gt('Actions') }),
                    type = baton.model.get('type'),
                    myself = baton.model.isMyself(),
                    isNew = baton.model.has('new');

                switch (type) {
                    case 'group':
                        dropdown.link('revoke', gt('Revoke access'));
                        break;
                    case 'user':
                    case 'guest':
                        if (!myself && !isNew) {
                            dropdown.link('resend', gt('Resend invitation')).divider();
                        }
                        dropdown.link('revoke', gt('Revoke access'));
                        break;
                    case 'anonymous':
                        if (capabilities.has('share_links')) {
                            dropdown.link('edit', gt('Edit')).divider();
                        }
                        dropdown.link('revoke', gt('Revoke access'));
                        break;
                }

                this.append(
                    $('<div class="col-sm-1 col-xs-2 entity-actions">').append(
                        dropdown.render().$el
                    )
                );
            }
        }
    );

    var that = {

        Permission: Permission,

        Permissions: Permissions,

        // async / id is folder id
        showFolderPermissions: function (id, options) {
            that.showByModel(new Backbone.Model({ id: id }), options);
        },

        // async / obj must provide folder_id and id
        showFilePermissions: function (obj, options) {
            that.showByModel(new Backbone.Model(obj), options);
        },

        showByModel: function (model, options) {
            var isFile = model.isFile ? model.isFile() : model.has('folder_id');
            model = new api.Model(isFile ? model.pick('id', 'folder_id') : model.pick('id'));
            model.loadExtendedPermissions().done(function () {
                that.show(model, options);
            });
        },

        // to be more self explaining
        showShareDialog: function (model) {
            that.show(model, { share: true });
        },

        show: function (objModel, options) {
            // folder tree: nested (whitelist) vs. flat
            var nested = folderAPI.isNested(objModel.get('module'));

            // // Check if ACLs enabled and only do that for mail component,
            // // every other component will have ACL capabilities (stored in DB)
            // if (data.module === 'mail' && !(data.capabilities & Math.pow(2, 0))) {
            //     isFolderAdmin = false;
            // }

            options = _.extend({
                top: 40,
                center: false,
                async: true,
                help: 'ox.appsuite.user.sect.dataorganisation.rights.defined.html#ox.appsuite.user.concept.rights.roles',
                share: false,
                nested: nested
            }, options);

            if (_.device('desktop')) {
                _.extend(options, {
                    width: 800,
                    maximize: true
                });
            }

            var dialog = new dialogs.ModalDialog(options),
                DialogConfigModel = Backbone.Model.extend({
                    defaults: {
                        cascadePermissions: false,
                        message: ''
                    },
                    toJSON: function () {
                        var data = {
                            cascadePermissions: this.get('cascadePermissions'),
                            notification: { transport: 'mail' }
                        };
                        // add personal message only if not empty
                        // but always send notification!
                        if (this.get('message') && $.trim(this.get('message')) !== '') {
                            data.notification.message = this.get('message');
                        }
                        return data;
                    }
                }),
                dialogConfig = new DialogConfigModel(),
                permissionsView = new PermissionsView({ model: objModel, share: options.share });

            dialog.getPopup().addClass('share-permissions-dialog');

            dialog.getHeader().append(
                $('<h4>').text(
                    options.share ?
                    gt('Share "%1$s"', objModel.getDisplayName()) :
                    gt('Permissions for "%1$s"', objModel.getDisplayName()))
            );

            // add permissions view
            dialog.getContentNode().append(
                permissionsView.render().$el
            );

            if (objModel.isAdmin()) {
                // add action buttons
                dialog
                    .addPrimaryButton('save', options.share ? gt('Share') : gt('Save'), 'save', { tabindex: 1 })
                    .addButton('cancel', gt('Cancel'), 'cancel', { tabindex: 1 });

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

                var module = objModel.get('module');

                var typeaheadView = new Typeahead({
                        apiOptions: {
                            // mail does not support sharing folders to guets
                            contacts: module !== 'mail',
                            users: true,
                            groups: true
                        },
                        placeholder: gt('Add people'),
                        harmonize: function (data) {
                            data = _(data).map(function (m) {
                                return new pModel.Participant(m);
                            });
                            // remove duplicate entries from typeahead dropdown
                            return _(data).filter(function (model) {
                                // mail does not support sharing folders to guets
                                if (module === 'mail' && model.get('field') !== 'email1') return false;
                                return !permissionsView.collection.get(model.id);
                            });
                        },
                        click: function (e, member) {
                            // build extended permission object
                            var isInternal = member.get('type') === 2 || member.get('type') === 1,
                                isGuest = member.get('type') === 5,
                                obj = {
                                    bits: isInternal && objModel.isFolder() ? 4227332 : 1, // Author : Viewer
                                    group: member.get('type') === 2,
                                    type: member.get('type') === 2 ? 'group' : 'user',
                                    new: true
                                };
                            if (isInternal) {
                                obj.entity = member.get('id');
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
                            permissionsView.collection.add(new Permission(obj));
                        },
                        extPoint: POINT
                    }),
                    guid = _.uniqueId('form-control-label-');

                if (objModel.isFolder() && options.nested) {
                    dialog.getFooter().prepend(
                        $('<div>').addClass('form-group cascade').append(
                            $('<label>').addClass('checkbox-inline').text(gt('Apply to all subfolders')).prepend(
                                new miniViews.CheckboxView({ name: 'cascadePermissions', model: dialogConfig }).render().$el
                            )
                        )
                    );
                }

                dialog.getFooter().prepend(
                    $('<div class="share-options">').append(
                        $('<div class="autocomplete-controls">').append(
                            $('<div class="form-group">').append(
                                $('<label class="sr-only">', { 'for': guid }).text(gt('Start typing to search for user names')),
                                typeaheadView.$el.attr({ id: guid })
                            )
                            // use delegate because typeahead's uses stopPropagation(); apparently not stopImmediatePropagation()
                            .on('keydown blur', 'input', function addManualInput(e) {

                                // mail does not support sharing folders to guests
                                // so we skip any manual edits
                                if (module === 'mail') return;

                                // enter or blur?
                                if (e.type === 'keydown' && e.which !== 13) return;

                                // use shown input
                                var value = $.trim($(this).typeahead('val'));
                                if (_.isEmpty(value)) return;

                                // add to collection
                                permissionsView.collection.add(new Permission({
                                    // Author for Folder : Viewer for Files
                                    bits: objModel.isFolder() ? 4227332 : 1,
                                    contact: { email1: value },
                                    type: 'guest',
                                    new: true
                                }));

                                // clear input field
                                $(this).typeahead('val', '');
                            })
                        ),
                        $('<div>').addClass('form-group').append(
                            $('<label>').addClass('control-label sr-only').text(gt('Enter a Message to inform users')).attr({ for: guid = _.uniqueId('form-control-label-') }),
                            new miniViews.TextView({
                                name: 'message',
                                model: dialogConfig
                            }).render().$el.addClass('message-text').attr({
                                id: guid,
                                rows: 3,
                                //#. placeholder text in share dialog
                                placeholder: gt('Personal message (optional). This message is sent to all newly invited people.')
                            })
                        )
                    )
                );

                typeaheadView.render();

            } else {
                dialog.addPrimaryButton('cancel', gt('Close'));
            }

            dialog.on('save', function () {

                var changes, options = dialogConfig.toJSON(), def;

                if (objModel.isFolder()) {
                    changes = { permissions: permissionsView.collection.toJSON() };
                    def = folderAPI.update(objModel.get('id'), changes, options);
                } else {
                    changes = { object_permissions: permissionsView.collection.toJSON() };
                    def = filesAPI.update(objModel.pick('folder_id', 'id'), changes, options);
                }

                def.then(
                    function success() {
                        objModel.reload().then(
                            function () {
                                dialog.close();
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

            dialog.show(function () {
                $(this).find('.form-control.tt-input').focus();
            });
        }
    };

    return that;
});
