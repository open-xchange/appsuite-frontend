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

define('io.ox/core/permissions/permissions',
    ['io.ox/core/extensions',
     'io.ox/core/notifications',
     'io.ox/core/folder/api',
     'io.ox/core/folder/breadcrumb',
     'io.ox/core/api/user',
     'io.ox/core/api/group',
     'io.ox/core/tk/dialogs',
     'io.ox/contacts/api',
     'io.ox/contacts/util',
     'io.ox/calendar/edit/view-addparticipants',
     'io.ox/core/http',
     'gettext!io.ox/core',
     'less!io.ox/core/permissions/style'
    ], function (ext, notifications, api, getBreadcrumb, userAPI, groupAPI, dialogs, contactsAPI, contactsUtil, AddParticipantsView, http, gt) {

    'use strict';

    function performRender() {
        this.render();
    }

    function performRemove() {
        this.remove();
    }

    var POINT = 'io.ox/core/permissions',

        folder_id,

        presets = [
            { label: gt('Guest'), bits: 257 }, // view folder + read all
            { label: gt('Author'), bits: 4227332 }, // create folder + read/write/delete all
            { label: gt('Administrator'), bits: 272662788 } // plus admin
        ],

        Permission = Backbone.Model.extend({
            idAttribute: 'entity',
            defaults: {
                group: false,
                bits: 0
            }
        }),

        Permissions = Backbone.Collection.extend({
            model: Permission
        }),

        PermissionsView = Backbone.View.extend({
            initialize: function () {
            //TODO:switch to listenTo here, once backbone is up to date
            //see [1](http://blog.rjzaworski.com/2013/01/why-listento-in-backbone/)
                this.model.off('change', performRender);
                this.model.on('change', performRender, this);

                this.model.off('remove', performRemove, this);
                this.model.on('remove', performRemove, this);
            },

            className: 'permission row',

            events: {
                'click a.bit': 'updateDropdown',
                'click a.role': 'applyRole',
                'click a[data-action="remove"]': 'removeEntity'
            },

            render: function () {
                var baton = ext.Baton({ model: this.model, view: this, admin: this.options.admin, folder: this.options.folder });
                ext.point(POINT + '/detail').invoke('draw', this.$el.empty(), baton);
                return this;
            },

            removeEntity: function () {
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
                    newbits = api.Bitmask(this.model.get('bits')).set(type, value).get();
                link.text($el.text());
                this.model.set('bits', newbits, {validate: true});
                this.updateRole();
            },

            applyRole: function (e) {
                e.preventDefault();
                var node = $(e.target), bits = node.attr('data-value');
                this.model.set('bits', parseInt(bits, 10), {validate: true});
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
            }
        }),

        collection = new Permissions(),

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
        addDropdown,
        addRoles,
        addRemoveButton,
        preventAdminPermissions,
        isFolderAdmin = false;

    ext.point(POINT + '/detail').extend({
        index: 100,
        id: 'folderpermissions',
        draw: function (baton) {

            var self = this, entity = baton.model.get('entity');

            if (baton.model.get('group')) {
                groupAPI.getName(entity).done(function (name) {
                    baton.name = name;
                    ext.point(POINT + '/entity').invoke('draw', self, baton);
                });
            } else {
                userAPI.get({ id: String(entity) }).done(function (user) {
                    baton.name = contactsUtil.getFullName(user);
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
                        $.extend(baton.user, { width: 64, height: 64, scaleType: 'cover' })
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
            var node, options;
            this.append(
                $('<div class="entity">').append(
                    node = $('<div>').append(
                        $('<span class="name">').text(_.noI18n(baton.name)),
                        baton.model.get('entity') === baton.view.options.owner ? $('<span class="owner">').text(gt('Owner')) : $(),
                        // quick change
                        addRoles(baton)
                    )
                )
            );

            options = $('<div>').append(
                // folder rights
                gt('Folder permissions'), $.txt(_.noI18n(': ')),
                    addDropdown('folder', baton), $.txt(_.noI18n('. ')),
                // object rights
                gt('Object permissions'), $.txt(_.noI18n(': ')),
                addDropdown('read', baton), $.txt(_.noI18n(', ')),
                addDropdown('write', baton), $.txt(_.noI18n(', ')),
                addDropdown('delete', baton), $.txt(_.noI18n('. ')),
                // admin
                gt('The user has administrative rights'), $.txt(_.noI18n(': ')),
                    addDropdown('admin', baton), $.txt(_.noI18n('. ')));
            if (baton.admin) {
                options.addClass('readwrite');
            } else {
                options.addClass('readonly');
                options.find('span.dropdown a').attr({'aria-haspopup': false, 'data-toggle': null, 'disabled': 'disabled'});//disable dropdown
            }
            node.append(
                addRemoveButton(baton.model.get('entity')),
                options
            );

            baton.view.updateRole();
        }
    });

    addRemoveButton = function (entity) {
        if (isFolderAdmin && entity !== ox.user_id) {
            return $('<a href="# "data-action="remove">').append($('<i class="fa fa-trash-o">'));
        } else {
            return $();
        }
    };

    preventAdminPermissions = function (permission, baton) {
        if (permission === 'admin') {
            if (
                // no admin choice for default folders (see Bug 27704)
                (String(api.getDefaultFolder(baton.folder.module)) === baton.folder.id) ||
                // See Bug 27704
                (baton.folder.type === 5) ||
                (baton.folder.type === 2 && baton.model.id === 0) ||
                // Private contacts and calendar folders can't have other users with admin permissions
                (baton.folder.type === 1 && (baton.folder.module === 'contacts' || baton.folder.module === 'calendar'))
            ) {
                return true;
            }
        }
    };

    addDropdown = function (permission, baton) {
        var bits = baton.model.get('bits'),
            selected = api.Bitmask(bits).get(permission),
            menu, ul;

        if (preventAdminPermissions(permission, baton)) {
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
            if (value === '64') return true; // Skip maximum rights
            ul.append(
                $('<li>').append(
                    $('<a>', { href: '#', 'data-value': value, role: 'menuitem'}).addClass('bit').text(item)
                )
            );
        });
        return menu;
    };

    addRoles = function (baton) {
        if (!isFolderAdmin) return $();
        return $('<span class="dropdown preset">').append(
            $('<a href="#" data-type="permission" data-toggle="dropdown" aria-haspopup="true" tabindex="1">'),
            $('<ul class="dropdown-menu" role="menu">').append(
                _(presets).map(function (obj) {
                    if (preventAdminPermissions('admin', baton) && obj.bits === 272662788) return;
                    return $('<li>').append(
                        $('<a>', { href: '#', 'data-value': obj.bits, role: 'menuitem' }).addClass('role').text(obj.label)
                    );
                })
            )
        );
    };

    return {
        show: function (folder) {
            folder_id = String(folder);
            api.get(folder_id, { cache: false }).done(function (data) {
                try {

                    isFolderAdmin = api.Bitmask(data.own_rights).get('admin') >= 1;

                    // Check if ACLs enabled and only do that for mail component,
                    // every other component will have ACL capabilities (stored in DB)
                    if (data.module === 'mail' && !(data.capabilities & Math.pow(2, 0))) {
                        isFolderAdmin = false;
                    }

                    var options = {top: 60, width: 800, center: false, maximize: true, async: true };
                    if (_.device('!desktop')) {
                        options = {top: '40px', center: false, async: true };
                    }
                    var dialog = new dialogs.ModalDialog(options);
                    dialog.getHeader().append(
                        getBreadcrumb(data.id, { subfolders: false, prefix: gt('Folder permissions') })
                    );
                    if (_.device('!desktop')) {
                        dialog.getHeader().append(
                            dialog.addButtonMobile('save', gt('Save')).addClass('btn-primary'),
                            dialog.addButtonMobile('cancel', gt('Cancel'))
                        );
                        dialog.getFooter().hide();
                    }

                    // mail folders show up with "null" so test if its inside our defaultfolders (prevent shared folders from showing wrong owner)
                    // shared folder only have admins, no owner, because it's not possible to determine the right one
                    var owner = data.created_by || (api.is('insideDefaultfolder', data) ? ox.user_id : null);

                    collection.on('reset', function () {
                        var node = dialog.getContentNode().empty();
                        this.each(function (model) {
                            new PermissionsView({ model: model, collection: this, owner: owner, admin: isFolderAdmin, folder: data })
                            .render().$el.appendTo(node);
                        }, this);
                    });

                    collection.on('add', function (model, collection) {
                        var node = dialog.getContentNode();
                        new PermissionsView({ model: model, collection: collection, owner: owner, admin: isFolderAdmin, folder: data })
                        .render().$el.appendTo(node);
                    });

                    // get all users to preload
                    var ids = _.chain(data.permissions)
                        .filter(function (obj) { return obj.group === false; })
                        .pluck('entity')
                        .value();

                    dialog.getContentNode().addClass('scrollpane').busy();

                    userAPI.getList(ids, true, { allColumns: true }).done(function () {
                        // stop being busy
                        dialog.getContentNode().idle();
                        // draw users
                        collection.reset(_(data.permissions).map(function (obj) {
                            return new Permission(obj);
                        }));
                    });

                    if (isFolderAdmin) {
                        if (_.device('desktop')) {
                            dialog.addPrimaryButton('save', gt('Save')).addButton('cancel', gt('Cancel'));
                        }

                        var node =  $('<div class="autocomplete-controls input-group">').append(
                                $('<input type="text" class="add-participant permissions-participant-input-field form-control">').on('focus', function () {
                                    autocomplete.trigger('update');
                                }),
                                $('<span class="input-group-btn">').append(
                                    $('<button type="button" class="btn btn-default" data-action="add">')
                                        .append($('<i class="fa fa-plus">'))
                                )
                            ),
                            autocomplete = new AddParticipantsView({ el: node });

                        autocomplete.render({
                            autoselect: true,
                            parentSelector: (_.device('desktop') ? '.permissions-dialog > .modal-footer' : '.permissions-dialog > .modal-header'),
                            placement: (_.device('desktop') ? 'top' : 'bottom'),
                            contacts: false,
                            distributionlists: false,
                            groups: true,
                            resources: false,
                            users: true,
                            split: false
                        });
                        //add recipents to baton-data-node; used to filter sugestions list in view
                        autocomplete.on('update', function () {
                            var baton = {list: []};
                            collection.any(function (item) {
                                baton.list.push({id: item.get('entity'), type: item.get('group') ? 2 : 1});
                            });
                            $.data(node, 'baton', baton);
                        });
                        autocomplete.on('select', function (data) {
                            var isGroup = data.type === 2,
                                obj = {
                                    entity: isGroup ? data.id : data.internal_userid,
                                    bits: 257, // default is 'view folder' plus 'read all'
                                    group: isGroup
                                };
                            if (!('entity' in obj)) {
                                notifications.yell(
                                    'error',
                                    data.display_name + gt(' is not a valid user or group.') || gt('This is not a valid user or group.')
                                );
                            } else {
                                // duplicate check
                                if (!collection.any(function (item) { return item.entity === obj.entity; })) {
                                    collection.add(new Permission(obj));
                                }
                            }
                        });
                        if (_.device('desktop')) {
                            dialog.getFooter().prepend(node);
                        } else {
                            dialog.getHeader().append(node);
                        }

                    } else {
                        dialog.addPrimaryButton('cancel', gt('Close'));
                    }
                    dialog.getPopup().addClass('permissions-dialog');
                    dialog.on('save', function () {
                        console.log('oder hier?');
                        if (isFolderAdmin) {
                            api.update(folder_id, { permissions: collection.toJSON() }).then(function success () {
                                dialog.close();
                            }, function fail (error) {
                                dialog.idle();
                                notifications.yell(error);
                            });
                        }
                    })
                    .on('cancel', function () {
                        collection.off();
                    })
                    .show(function () {
                        this.find('input').focus();
                    });
                } catch (e) {
                    console.error('Error', e);
                }
            });
        }
    };
});
