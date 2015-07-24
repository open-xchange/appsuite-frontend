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
    'less!io.ox/files/share/style'
], function (ext, DisposableView, yell, miniViews, BreadcrumbView, folderAPI, filesAPI, userAPI, groupAPI, contactsAPI, dialogs, contactsUtil, Typeahead, pModel, pViews, gt) {

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

        menus = {
            'folder': {
                1:  //#. folder permissions
                    gt('view the folder'),
                2:  //#. folder permissions
                    gt('create objects'),
                4:  //#. folder permissions
                    gt('create objects and subfolders'),
                64: //#. folder permissions
                    gt('create objects and subfolders')
            },
            'read': {
                0:  //#. object permissions - read
                    gt('no read permissions'),
                1:  //#. object permissions - read
                    gt('read own objects'),
                2:  //#. object permissions - read
                    gt('read all objects'),
                64: //#. object permissions - read
                    gt('read all objects')
            },
            'write': {
                0:  //#. object permissions - edit/modify
                    gt('no edit permissions'),
                1:  //#. object permissions - edit/modify
                    gt('edit own objects'),
                2:  //#. object permissions - edit/modify
                    gt('edit all objects'),
                64: //#. object permissions - edit/modify
                    gt('edit all objects')
            },
            'delete': {
                0:  //#. object permissions - delete
                    gt('no delete permissions'),
                1:  //#. object permissions - delete
                    gt('delete only own objects'),
                2:  //#. object permissions - delete
                    gt('delete all objects'),
                64: //#. object permissions - delete
                    gt('delete all objects')
            },
            'admin': {
                0:  //#. folder permissions - Is Admin? NO
                    gt('No'),
                1:  //#. folder permissions - Is Admin? YES
                    gt('Yes')
            },
            'preset': {}
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
        PermissionView = DisposableView.extend({

            initialize: function (options) {

                this.item = options.itemModel;

                this.listenTo(this.model, 'change', this.render);
                this.listenTo(this.model, 'remove', this.remove);
            },

            className: 'permission row',

            events: {
                'click a.bit': 'updateDropdown',
                'click a.role': 'applyRole',
                'click a[data-action="remove"]': 'removePermission'
            },

            render: function () {
                var baton = ext.Baton({ model: this.model, view: this });
                ext.point(POINT + '/detail').invoke('draw', this.$el.empty(), baton);
                return this;
            },

            removePermission: function (e) {
                e.preventDefault();
                this.model.collection.remove(this.model);
            },

            updateDropdown: function (e) {
                e.preventDefault();
                var $el     = $(e.target),
                    $span   = $el.parent().parent().parent(),
                    value   = $el.attr('data-value'),
                    link    = $span.children('a'),
                    type    = link.attr('data-type'),
                    newbits = folderAPI.Bitmask(this.model.get('bits')).set(type, value).get();
                link.text($el.text());
                this.model.set('bits', newbits, { validate: true });
                this.updateRole();
            },

            applyRole: function (e) {
                e.preventDefault();
                var node = $(e.target), bits = node.attr('data-value');
                this.model.set('bits', parseInt(bits, 10), { validate: true });
            },

            updateRole: function () {
                var node = this.$el.find('.preset > a').text(gt('Apply role')),
                    bits = this.model.get('bits');
                _(presets).each(function (obj) {
                    if (obj.bits === bits) {
                        node.text(obj.label);
                    }
                });
            },

            addDropdown: function (permission) {
                var selected = folderAPI.Bitmask(this.model.get('bits')).get(permission),
                    menu, ul;

                if (permission === 'admin' && this.preventAdminPermissions()) {
                    return $('<i>').text(menus[permission][selected]);
                }
                menu = $('<span class="dropdown">').append(
                    $('<a href="#">').attr({
                        'tabindex': 1,
                        'data-type': permission,
                        'aria-haspopup': true,
                        'data-toggle': 'dropdown'
                    }).text(menus[permission][selected]),
                    ul = $('<ul class="dropdown-menu" role="menu">')
                );
                _(menus[permission]).each(function (item, value) {
                    // Skip maximum rights
                    if (value === '64') return true;
                    ul.append(
                        $('<li>').append(
                            $('<a>', { href: '#', 'data-value': value, role: 'menuitem' }).addClass('bit').text(item)
                        )
                    );
                });
                return menu;
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

            className: 'permissions-view',

            initialize: function () {

                this.collection = new Permissions();

                this.listenTo(this.collection, 'reset', this.resetPermissions);
                this.listenTo(this.collection, 'add', this.addPermissionView);
            },

            render: function () {
                var self = this;

                if (this.model.isExtendedPermission()) {
                    this.collection.reset(this.model.getPermissions());
                } else {
                    this.$el.busy();
                    // preload user data
                    var ids = _.chain(this.model.getPermissions())
                        .filter(function (obj) { return !obj.group; })
                        .pluck('entity')
                        .value();

                    // load user data after opening the dialog
                    userAPI.getList(ids, true, { allColumns: true }).then(function () {
                        // stop being busy
                        self.$el.idle();
                        // draw users
                        self.collection.reset(self.model.getPermissions());
                        // select first tabstop
                        self.$el.find('[tabindex="1"]:first').focus();
                    });
                }
                return this;
            },

            resetPermissions: function () {
                var self = this;
                this.$el.empty();
                this.collection.each(function (PermissionModel) {
                    self.addPermissionView(PermissionModel);
                });
                return this;
            },

            addPermissionView:  function (PermissionModel) {
                var self = this;
                return this.$el.append(
                    new PermissionView({
                        model: PermissionModel,
                        itemModel: self.model
                    }).render().$el
                );
            }

        });

    ext.point(POINT + '/detail').extend({
        index: 100,
        id: 'folderpermissions',
        draw: function (baton) {

            var self = this,
                entity = baton.model.get('entity');

            if (baton.view.item.isExtendedPermission()) {

                switch (baton.model.get('type')) {
                    case 'user':
                        baton.user = baton.model.get('contact');
                        baton.name = baton.model.get('display_name');
                        break;
                    case 'group':
                        baton.name = baton.model.get('display_name');
                        break;
                    case 'guest':
                        baton.name = gt('Guest') + ': ' + baton.model.get('contact').email1;
                        baton.user = baton.model.get('contact');
                        break;
                    case 'anonymous':
                        baton.name = gt('Link');
                        break;
                    default:
                        break;
                }

                ext.point(POINT + '/entity').invoke('draw', self, baton);
            } else {
                // get missing data
                if (baton.model.get('group')) {
                    groupAPI.getName(entity).done(function (name) {
                        baton.name = name;
                        ext.point(POINT + '/entity').invoke('draw', self, baton);
                    });
                } else {
                    userAPI.get({ id: String(entity) }).done(function (user) {
                        baton.name = contactsUtil.getFullName(user) || contactsUtil.getMail(user);
                        baton.user = user;
                        ext.point(POINT + '/entity').invoke('draw', self, baton);
                    });
                }
            }
        }
    });

    ext.point(POINT + '/entity').extend({
        index: 100,
        id: 'entityimage',
        draw: function (baton) {
            if (baton.user) {
                this.append(
                    contactsAPI.pictureHalo(
                        $('<div class="pull-left contact-picture">'),
                        baton.user,
                        { width: 64, height: 64 }
                    )
                );
            } else {
                this.append(
                    $('<div class="pull-left contact-picture group">').append(
                        $('<i class="fa fa-' + (baton.model.get('type') === 'group' ? 'group' : 'user') + '">')
                    )
                );
            }
        }
    });

    ext.point(POINT + '/entity').extend({
        index: 200,
        id: 'entitysentence',
        draw: function (baton) {
            var node,
                options,
                entity = baton.model.get('entity'),
                view = baton.view;

            this.append(
                $('<div class="entity">').append(
                    node = $('<div>').append(
                        $('<span class="name">').text(_.noI18n(baton.name)),
                        entity === view.item.getOwner() ? $('<span class="owner">').text(gt('Owner')) : $(),
                        // quick change
                        view.addRoles()
                    )
                )
            );

            options = $('<div>').append(
                // folder rights
                gt('Folder permissions'), $.txt(_.noI18n(': ')),
                    view.addDropdown('folder'), $.txt(_.noI18n('. ')),
                // object rights
                gt('Object permissions'), $.txt(_.noI18n(': ')),
                view.addDropdown('read'), $.txt(_.noI18n(', ')),
                view.addDropdown('write'), $.txt(_.noI18n(', ')),
                view.addDropdown('delete'), $.txt(_.noI18n('. ')),
                // admin
                gt('The user has administrative rights'), $.txt(_.noI18n(': ')),
                    view.addDropdown('admin'), $.txt(_.noI18n('. ')));

            if (view.item.isAdmin()) {
                options.addClass('readwrite');
            } else {
                options.addClass('readonly');
                //disable dropdown
                options.find('span.dropdown a').attr({ 'aria-haspopup': false, 'data-toggle': null, 'disabled': 'disabled' });
            }

            node.append(options);
            if (view.item.isAdmin() && entity !== ox.user_id) {
                node.append(
                    $('<a href="# "data-action="remove" title="' + gt('remove permission') + '" tabindex="1">')
                        .append($('<i class="fa fa-trash" aria-hidden="true">'))
                );
            }

            view.updateRole();
        }
    });

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
            dialog.getContentNode().append(
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
