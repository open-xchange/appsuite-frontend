/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author David Bauer <david.bauer@open-xchange.com>
 */

 define('io.ox/files/share/permissions', [
    'io.ox/core/extensions',
    'io.ox/backbone/disposable',
    'io.ox/core/yell',
    'io.ox/backbone/mini-views',
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/core/folder/breadcrumb',
    'io.ox/core/folder/api',
    'io.ox/files/api',
    'io.ox/core/api/user',
    'io.ox/core/api/group',
    'io.ox/contacts/api',
    'io.ox/core/tk/dialogs',
    'io.ox/contacts/util',
    'io.ox/core/tk/typeahead',
    'io.ox/participants/model',
    'io.ox/participants/views',
    'gettext!io.ox/core',
    'less!io.ox/files/share/style',
    // todo: relocate smart-dropdown logic
    'io.ox/core/tk/flag-picker'
], function (ext, DisposableView, yell, miniViews, DropdownView, BreadcrumbView, folderAPI, filesAPI, userAPI, groupAPI, contactsAPI, dialogs, contactsUtil, Typeahead, pModel, pViews, gt) {

    'use strict';

    var POINT = 'io.ox/files/share/permissions',

        presets = [
            // view folder + read all
            { label: gt('Guest'), bits: 257 },
            // create folder + read/write/delete all
            { label: gt('Author'), bits: 4227332 },
            // plus admin
            { label: gt('Administrator'), bits: 272662788 }
        ],

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

            // bits    Number  A number as described in Permission flags.
            // entity  Number  (ignored for type “anonymous” or “guest”) User ID of the user or group to which this permission applies.
            // group   Boolean (ignored for type “anonymous” or “guest”) true if entity refers to a group, false if it refers to a user.
            // type    String  (required if no internal “entity” defined) The recipient type, i.e. one of “guest”, “anonymous”
            // email_address   String  (for type “guest”) The e-mail address of the recipient
            // display_name    String  (for type “guest”, optional) The display name of the recipient
            // contact_id  String  (for type “guest”, optional) The object identifier of the corresponding contact entry if the recipient was chosen from the address book
            // contact_folder  String  (for type “guest”, required if “contact_id” is set) The folder identifier of the corresponding contact entry if the recipient was chosen from the address book
            toJSON: function () {
                var data = {
                    bits: this.get('bits')
                };

                if (this.has('entity')) {
                    data.entity = this.get('entity');
                    data.group = this.get('type') === 'group';
                } else {
                    switch (this.get('type')) {
                        case 'guest':
                            data.type = this.get('type');
                            var contact = this.get('contact');
                            data.email_address = contact.email1;
                            if (this.has('display_name')) {
                                data.display_name = this.get('display_name');
                            }
                            if (contact && contact.id && contact.folder_id) {
                                data.contact_id = contact.id;
                                data.contact_folder = contact.folder_id;
                            }
                            break;
                        case 'anonymous':
                            data.type = this.get('type');
                            break;
                    }
                }

                return data;
            }

        }),

        // Permission Collection
        Permissions = Backbone.Collection.extend({
            model: Permission
        }),

        // Simple permission view
        PermissionEntityView = DisposableView.extend({

            className: 'permission row',

            events: {
                'click a.bit': 'updateDropdown',
                'click a.role': 'applyRole',
                'click a[data-action="remove"]': 'removeEntity'
            },

            initialize: function (options) {

                this.item = options.itemModel;
                this.user = null;
                this.display_name = '';
                this.description = '';

                this.parseBitmask();

                this.listenTo(this.model, 'change:bits', this.onChangeBitmask);
                this.listenTo(this.model, 'change:folder change:read change:write change:delete change:admin', this.updateBitmask);
            },

            onChangeBitmask: function () {
                this.parseBitmask();
                this.updateRole();
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
                this.getEntityDetails().done(function () {
                    var baton = ext.Baton({ model: this.model, view: this });
                    ext.point(POINT + '/entity').invoke('draw', this.$el.empty(), baton);
                }.bind(this));
                return this;
            },

            removeEntity: function (e) {
                e.preventDefault();
                this.model.collection.remove(this.model);
                this.remove();
            },

            getEntityDetails: function () {

                var entity = this.model.get('entity');

                if (this.item.isExtendedPermission()) {
                    // extended permissions
                    // we don't have that data all time
                    // "My shares" vies has them; a folder or a file don't have them
                    switch (this.model.get('type')) {
                        case 'user':
                            this.user = this.model.get('contact');
                            this.display_name = this.model.get('display_name');
                            this.description = gt('Internal user');
                            break;
                        case 'group':
                            this.display_name = this.model.get('display_name');
                            this.description = gt('Group');
                            break;
                        case 'guest':
                            this.user = this.model.get('contact');
                            this.display_name = this.model.get('contact').email1;
                            this.description = gt('Guest');
                            break;
                        case 'anonymous':
                            // TODO: public vs. password-protected link
                            this.display_name = gt('Public link');
                            this.description = this.model.get('share_url');
                            break;
                    }
                    return $.when();
                }

                if (this.model.get('group')) {
                    // group
                    return groupAPI.getName(entity).done(function (name) {
                        this.display_name = name;
                        this.description = gt('Group');
                    }.bind(this));
                }

                // TODO: anonymous case seems to be missing

                // internal user or guest
                return userAPI.get({ id: String(entity) }).done(function (user) {
                    this.user = user;
                    this.display_name = contactsUtil.getFullName(user) || contactsUtil.getMail(user);
                    this.description = user.guest_created_by ? gt('Guest') : gt('Internal user');
                }.bind(this));
            },

            getRoleDescription: function () {
                var bitmask = folderAPI.Bitmask(this.model.get('bits'));
                if (bitmask.get('admin')) return gt('Administrator');
                if (bitmask.get('read') && bitmask.get('write')) {
                    // Author: read, write, delete
                    // Reviewer: read, write
                    return bitmask.get('delete') ? gt('Author') : gt('Reviewer');
                }
                // assumption is that everyone is at least a "Viewer"
                return gt('Viewer');
            },

            updateRole: function () {
                this.$('.role').text(this.getRoleDescription());
            },

            applyRole: function (e) {
                e.preventDefault();
                var node = $(e.target), bits = node.attr('data-value');
                this.model.set('bits', parseInt(bits, 10), { validate: true });
            },

            addRoles: function () {
                if (!this.item.isAdmin()) return $();
                var self = this;
                return $('<span class="dropdown preset">').append(
                    $('<a href="#" data-type="permission" data-toggle="dropdown" aria-haspopup="true" tabindex="1">'),
                    $('<ul class="dropdown-menu" role="menu">').append(
                        _(presets).map(function (obj) {
                            if (self.preventAdminPermissions() && obj.bits === 272662788) return;
                            return $('<li>').append(
                                $('<a>', { href: '#', 'data-value': obj.bits, role: 'menuitem' }).addClass('role').text(obj.label)
                            );
                        })
                    )
                );
            },

            preventAdminPermissions: function () {
                // this check is for folders only
                if (!this.item.isFolder()) return false;

                var type = this.item.get('type'),
                    module = this.item.get('module');

                if (
                    // no admin choice for default and system folders (see Bug 27704)
                    (String(folderAPI.getDefaultFolder(module)) === this.item.get('id')) || (type === 5) ||
                    // Public folder and permission enity 0
                    (type === 2 && this.model.id === 0) ||
                    // Private contacts and calendar folders can't have other users with admin permissions
                    (type === 1 && (module === 'contacts' || module === 'calendar'))
                ) {
                    return true;
                }
                return false;
            }

        }),

        // All Permissions view
        PermissionsView = DisposableView.extend({

            tagName: 'div',

            className: 'permissions-view container-fluid',

            initialize: function () {

                this.collection = new Permissions();

                this.listenTo(this.collection, {
                    'reset': this.resetPermissions,
                    'add': this.addEntity
                });
            },

            render: function () {

                // shortcut?
                if (this.model.isExtendedPermission()) {
                    this.collection.reset(this.model.getPermissions());
                    return this;
                }

                this.$el.busy();

                // preload user data
                var ids = _.chain(this.model.getPermissions())
                    .filter(function (obj) { return obj.type === 'user'; })
                    .pluck('entity')
                    .value();

                // load user data after opening the dialog
                userAPI.getList(ids, true, { allColumns: true }).then(function () {
                    // stop being busy
                    this.$el.idle();
                    // draw users
                    this.collection.reset(this.model.getPermissions());
                    // select first tabstop
                    this.$el.find('[tabindex="1"]:first').focus();
                }.bind(this));

                return this;
            },

            resetPermissions: function () {
                this.$el.empty();
                this.collection.each(function (PermissionModel) {
                    this.addEntity(PermissionModel);
                }, this);
                return this;
            },

            addEntity: function (PermissionModel) {
                return this.$el.append(
                    new PermissionEntityView({
                        model: PermissionModel,
                        itemModel: this.model
                    }).render().$el
                );
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

                var column = $('<div class=" col-xs-1">'),
                    node = $('<span class="contact-picture">');

                if (baton.view.user) {
                    column.append(
                        contactsAPI.pictureHalo(node, baton.view.user, { width: 80, height: 80 })
                    );
                } else {
                    column.append(
                        node.addClass('group').append(
                            $('<i class="fa fa-' + (baton.model.get('type') === 'group' ? 'group' : 'user') + '">')
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

                this.append(
                    $('<div class="col-xs-4">').append(
                        $('<div class="display_name">').text(baton.view.display_name),
                        $('<div class="description">').text(baton.view.description)
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
                this.append(
                    $('<div class="col-xs-3 role">').text(baton.view.getRoleDescription())
                );
            }
        },
        //
        // Detailed dropdown
        //
        {
            index: 400,
            id: 'detail-dropdown',
            draw: function (baton) {

                // not available for anonymous links (read-only)
                if (baton.model.get('type') === 'anonymous') {
                    this.append('<div class="col-xs-3">');
                    return;
                }

                // take care of highest bit (64 vs 4 vs 2)
                var maxFolder = baton.model.get('folder') === 64 ? 64 : 4,
                    maxRead = baton.model.get('read') === 64 ? 64 : 2,
                    maxWrite = baton.model.get('write') === 64 ? 64 : 2,
                    maxDelete = baton.model.get('delete') === 64 ? 64 : 2;

                var dropdown = new DropdownView({ caret: true, keep: true, label: gt('Access rights'), model: baton.model, smart: true })
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
                    .divider()
                    //
                    // READ access
                    //
                    .header(gt('Read permissions'))
                    //#. object permissions - read
                    .option('read', 0, gt('None'))
                    //#. object permissions - read
                    .option('read', 1, gt('Read own objects'))
                    //#. object permissions - read
                    .option('read', maxRead, gt('Read all objects'))
                    .divider()
                    //
                    // WRITE access
                    //
                    .header(gt('Write permissions'))
                    //#. object permissions - edit/modify
                    .option('write', 0, gt('None'))
                    //#. object permissions - edit/modify
                    .option('write', 1, gt('Edit own objects'))
                    //#. object permissions - edit/modify
                    .option('write', maxWrite, gt('Edit all objects'))
                    .divider()
                    //
                    // DELETE access
                    //
                    .header(gt('Delete permissions'))
                    //#. object permissions - delete
                    .option('delete', 0, gt('None'))
                    //#. object permissions - delete
                    .option('delete', 1, gt('Delete own objects'))
                    //#. object permissions - delete
                    .option('delete', maxDelete, gt('Delete all objects'))
                    //
                    // ADMIN role
                    //
                    .header(gt('Administrative role'))
                    //#. object permissions - user role
                    .option('admin', 0, gt('User'))
                    //#. object permissions - admin role
                    .option('admin', 1, gt('Administrator'));

                this.append(
                    $('<div class="col-xs-3 detail-dropdown">').append(
                        dropdown.render().$el
                    )
                );
            }
        },
        //
        // Remove button
        //
        {
            index: 500,
            id: 'remove-button',
            draw: function () {
                // TODO: check for admin status
                this.append(
                    $('<div class="col-xs-1 remove-button">').append(
                        $('<a href="#" role="button" data-action="remove"><i class="fa fa-trash-o"></i></a>')
                    )
                );
            }
        }
    );

    return {

        show: function (objModel) {
            // // Check if ACLs enabled and only do that for mail component,
            // // every other component will have ACL capabilities (stored in DB)
            // if (data.module === 'mail' && !(data.capabilities & Math.pow(2, 0))) {
            //     isFolderAdmin = false;
            // }

            var options = {
                top: 40,
                center: false,
                async: true,
                help: 'ox.appsuite.user.sect.dataorganisation.rights.defined.html#ox.appsuite.user.concept.rights.roles'
            };

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
                        message: null,
                        transport: 'mail'
                    },
                    toJSON: function () {
                        var data = {
                            cascadePermissions: this.get('cascadePermissions')
                        };
                        if (this.get('message') && $.trim(this.get('message')) !== '' ) {
                            data.notification = {
                                message: this.get('message'),
                                transport: this.get('transport')
                            };
                        }
                        return data;
                    }
                }),
                dialogConfig = new DialogConfigModel(),
                permissionsView = new PermissionsView({ model: objModel });

            dialog.getPopup().addClass('share-permissions-dialog');

            dialog.getHeader().append(
                $('<h4>').text(gt('Permissions for "%1$s"', objModel.getDisplayName())),
                new BreadcrumbView({ folder: objModel.getFolderID(), notail: true }).render().$el
            );

            // add permissions view
            dialog.getContentNode().addClass('scrollable').append(
                permissionsView.render().$el
            );

            if (objModel.isAdmin()) {
                // add action buttons
                dialog
                    .addPrimaryButton('save', gt('Save'), 'save', { tabindex: 1 })
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

                var typeaheadView = new Typeahead({
                        apiOptions: {
                            contacts: true,
                            users: true,
                            groups: true
                        },
                        placeholder: gt('Add new guest'),
                        harmonize: function (data) {
                            data = _(data).map(function (m) {
                                return new pModel.Participant(m);
                            });
                            // remove duplicate entries from typeahead dropdown
                            return _(data).filter(function (model) {
                                return !permissionsView.collection.get(model.id);
                            });
                        },
                        click: function (e, member) {
                            // build extended permission object
                            var obj = {
                                bits: objModel.isFolder() ? 4227332 : 2, // Author
                                group: member.get('type') === 2,
                                type: member.get('type') === 2 ? 'group' : 'user'
                            };
                            if (member.get('type') === 2 || member.get('type') === 1) {
                                obj.entity = member.get('id');
                            }
                            obj.contact = member.toJSON();
                            obj.display_name = member.getDisplayName();
                            if (member.get('type') === 5) {
                                obj.type = 'guest';
                                obj.contact_id = member.get('id');
                                obj.folder_id = member.get('folder_id');
                            }

                            permissionsView.collection.add(new Permission(obj));
                        },
                        extPoint: POINT
                    }),
                    guid = _.uniqueId('form-control-label-');

                if (objModel.isFolder()) {
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
                            ).on('keydown', 'input', function (e) {
                                // enter
                                if (e.which === 13) {
                                    var val = $(this).typeahead('val');
                                    if (!_.isEmpty(val)) {
                                        permissionsView.collection.add(new Permission({
                                            type: 'guest',
                                            bits: objModel.isFolder() ? 4227332 : 2, // Author
                                            contact: {
                                                email1: val
                                            }
                                        }));
                                        // clear input
                                        $(this).typeahead('val', '');
                                    }
                                }
                            })
                        ),
                        $('<div>').addClass('form-group').append(
                            $('<label>').addClass('control-label sr-only').text(gt('Enter a Message to inform users')).attr({ for: guid = _.uniqueId('form-control-label-') }),
                            new miniViews.TextView({
                                name: 'message',
                                model: dialogConfig
                            }).render().$el.attr({
                                id: guid,
                                rows: 3,
                                //#. placeholder text in share dialog
                                placeholder: gt('Message (optional)')
                            })
                        )
                    )
                );

                typeaheadView.render();

            } else {
                dialog.addPrimaryButton('cancel', gt('Close'));
            }

            dialog.on('save', function () {
                var def;
                if (objModel.isFolder()) {
                    def = folderAPI.update(objModel.get('id'), { permissions: permissionsView.collection.toJSON() }, dialogConfig.toJSON());
                } else {
                    def = filesAPI.update({ id: objModel.get('id') }, { object_permissions: permissionsView.collection.toJSON() });
                }
                def.then(
                    function success() {
                        dialog.close();
                    },
                    function fail(error) {
                        dialog.idle();
                        yell(error);
                    }
                );
            })
            .show();
        }
    };
});
