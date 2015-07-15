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
    'io.ox/core/notifications',
    'io.ox/core/folder/breadcrumb',
    'io.ox/core/folder/api',
    'io.ox/core/api/user',
    'io.ox/core/api/group',
    'io.ox/contacts/api',
    'io.ox/core/tk/dialogs',
    'io.ox/contacts/util',
    'io.ox/core/tk/typeahead',
    'io.ox/participants/model',
    'io.ox/participants/views',
    'gettext!io.ox/core',
    'less!io.ox/core/permissions/style'
], function (ext, DisposableView, notifications, BreadcrumbView, folderAPI, userAPI, groupAPI, contactsAPI, dialogs, contactsUtil, Typeahead, pModel, pViews, gt) {

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
            }
        }),

        // Permission Collection
        Permissions = Backbone.Collection.extend({
            model: Permission
        }),

        // Simple permission view
        PermissionView = DisposableView.extend({

            initialize: function (options) {

                this.options = options;

                this.listenTo(this.model, 'change', this.render);
                this.listenTo(this.model, 'remove', this.remove);
            },

            className: 'permission row',

            events: {
                'click a.bit': 'updateDropdown',
                'click a.role': 'applyRole',
                'click a[data-action="remove"]': 'removeEntity'
            },

            render: function () {
                var baton = ext.Baton({ model: this.model, view: this, admin: this.options.admin });
                ext.point(POINT + '/detail').invoke('draw', this.$el.empty(), baton);
                return this;
            },

            removeEntity: function (e) {
                e.preventDefault();
                this.collection.remove(this.model);
                this.remove();
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
                _(presets).find(function (obj) {
                    if (obj.bits === bits) {
                        node.text(obj.label);
                        return true;
                    }
                });
            },

            addDropdown: function (permission) {
                var selected = folderAPI.Bitmask(this.model.get('bits')).get(permission),
                    menu, ul;

                if (this.preventAdminPermissions(permission)) {
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
                if (!this.options.admin) return $();
                var self = this;
                return $('<span class="dropdown preset">').append(
                    $('<a href="#" data-type="permission" data-toggle="dropdown" aria-haspopup="true" tabindex="1">'),
                    $('<ul class="dropdown-menu" role="menu">').append(
                        _(presets).map(function (obj) {
                            if (self.preventAdminPermissions('admin') && obj.bits === 272662788) return;
                            return $('<li>').append(
                                $('<a>', { href: '#', 'data-value': obj.bits, role: 'menuitem' }).addClass('role').text(obj.label)
                            );
                        })
                    )
                );
            },

            preventAdminPermissions: function (permission, baton) {
                if (permission === 'admin') {
                    console.log(baton);
                    return false;
                    //     if (
                    //         // no admin choice for default folders (see Bug 27704)
                    //         (String(folderAPI.getDefaultFolder(baton.folder.module)) === baton.folder.id) ||
                    //         // See Bug 27704
                    //         (baton.folder.type === 5) ||
                    //         (baton.folder.type === 2 && this.model.id === 0) ||
                    //         // Private contacts and calendar folders can't have other users with admin permissions
                    //         (baton.folder.type === 1 && (baton.folder.module === 'contacts' || baton.folder.module === 'calendar'))
                    //     ) {
                    //         return true;
                    //     }
                }
            }

        }),

        // All Permissions view
        PermissionsView = DisposableView.extend({

            tagName: 'div',

            className: 'permissions-view',

            initialize: function () {

                this.collection = new Permissions();

                this.listenTo(this.collection, 'reset', this.resetPermissions);
                this.listenTo(this.collection, 'add', this.addPermissions);
            },

            render: function () {
                var self = this;

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
                return this;
            },

            resetPermissions: function () {
                var self = this;
                this.$el.empty();
                this.collection.each(function (model) {
                    new PermissionView({
                        model: model,
                        collection: self.collection,
                        owner: self.getOwner(),
                        admin: self.model.isAdmin()
                    }).render().$el.appendTo(self.$el);
                });
                return this;
            },

            addPermissions:  function (model, collection) {
                var self = this;
                new PermissionView({
                    model: model,
                    collection: collection,
                    owner: this.getOwner(),
                    admin: self.model.isAdmin()
                }).render().$el.appendTo(this.$el);
                return this;
            },

            getOwner: function () {
                // mail folders show up with "null" so test if its inside our defaultfolders (prevent shared folders from showing wrong owner)
                // shared folder only have admins, no owner, because it's not possible to determine the right one
                return this.model.get('created_by') || (folderAPI.is('insideDefaultfolder', this.options) ? ox.user_id : null);
            }

        });

    ext.point(POINT + '/detail').extend({
        index: 100,
        id: 'folderpermissions',
        draw: function (baton) {

            var self = this,
                entity = baton.model.get('entity');

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
                        $('<i class="fa fa-group">')
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
                        entity === view.options.owner ? $('<span class="owner">').text(gt('Owner')) : $(),
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
            if (baton.admin) {
                options.addClass('readwrite');
            } else {
                options.addClass('readonly');
                //disable dropdown
                options.find('span.dropdown a').attr({ 'aria-haspopup': false, 'data-toggle': null, 'disabled': 'disabled' });
            }

            node.append(options);
            if (baton.admin && entity !== ox.user_id) {
                node.append(
                    $('<a href="# "data-action="remove" title="' + gt('remove permission') + '" tabindex="1">')
                        .append($('<i class="fa fa-trash-o" aria-hidden="true">'))
                );
            }

            view.updateRole();
        }
    });

    return {
        show: function (objModel) {
            var permissionsView = new PermissionsView({ model: objModel });

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

            var dialog = new dialogs.ModalDialog(options);

            dialog.getHeader().append(
                $('<h4>').text(gt('Permissions for')),
                new BreadcrumbView({ folder: objModel.getFolderID() }).render().$el
            );

            dialog.getContentNode().append(
                permissionsView.render().$el
            ).addClass('scrollpane');

            dialog.getPopup().addClass('permissions-dialog');

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
                            users: true,
                            groups: true,
                            split: false
                        },
                        placeholder: gt('Add user/group'),
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
                            var obj = {
                                entity: member.get('id'),
                                // default is 'view folder' plus 'read all'
                                bits: 257,
                                group: member.get('type') === 2
                            };
                            if (!_.isNumber(obj.entity)) {
                                notifications.yell(
                                    'error',
                                    //#. permissions dialog
                                    //#. error message when selected user or group can not be used
                                    gt('This is not a valid user or group.')
                                );
                            } else {
                                // duplicate check
                                permissionsView.collection.add(new Permission(obj));
                            }
                        },
                        extPoint: POINT
                    }),
                    cascadePermissionsFlag = false,
                    guid = _.uniqueId('input');

                dialog.getFooter()[_.device('desktop') ? 'prepend' : 'append'](
                    $('<div class="autocomplete-controls">').append(
                        $('<div class="form-group">').append(
                            $('<label class="sr-only">', { 'for': guid }).text(gt('Start typing to search for user names')),
                            typeaheadView.$el.attr({ id: guid })
                        )
                    ),
                    $('<div>').addClass('checkbox control-group cascade').append(
                        $('<label>').text(gt('Apply to all subfolders')).prepend(function () {
                            return $('<input type="checkbox" tabindex="1">')
                                .on('change', function () {
                                    cascadePermissionsFlag = $(this).prop('checked');
                                })
                                .prop('checked', cascadePermissionsFlag);

                        })
                    )
                );

                typeaheadView.render();

            } else {
                dialog.addPrimaryButton('cancel', gt('Close'));
            }

            dialog.on('save', function () {
                // api.update(folder_id, { permissions: permissionsView.collection.toJSON() }, { cascadePermissions: cascadePermissionsFlag }).then(
                //     function success() {
                //         permissionsView.collection.off();
                //         dialog.close();
                //     },
                //     function fail(error) {
                //         dialog.idle();
                //         notifications.yell(error);
                //     }
                // );
            })
            .on('cancel', function () {
                permissionsView.collection.off();
            })
            .show();
        }
    };
});
