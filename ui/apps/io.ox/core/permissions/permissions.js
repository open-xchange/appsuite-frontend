/**
 * All content on this website (including text, images, source code and any
 * other original works), unless otherwise noted, is licensed under a Creative
 * Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012 Mail: info@open-xchange.com
 *
 * @author David Bauer <david.bauer@open-xchange.com>
 */

define('io.ox/core/permissions/permissions',
    ['io.ox/core/extensions',
     'io.ox/core/notifications',
     'io.ox/core/api/folder',
     'io.ox/core/api/user',
     'io.ox/core/api/group',
     'io.ox/core/tk/dialogs',
     'io.ox/contacts/api',
     'io.ox/contacts/util',
     'io.ox/calendar/edit/view-addparticipants',
     'io.ox/core/http',
     'gettext!io.ox/core',
     'less!io.ox/core/permissions/style.css'], function (ext, notifications, api, userAPI, groupAPI, dialogs, contactsAPI, contactsUtil, AddParticipantsView, http, gt) {

    'use strict';

    var POINT = 'io.ox/core/permissions',

        folder_id,

        presets = [
            { label: gt('Guest'), bits: 257 }, // view folder + read all
            { label: gt('Author'), bits: 4227332 }, // create folder + read/write/delete all
            { label: gt('Administrator'), bits: 272662788 } // plus admin
        ],

        Permission = Backbone.Model.extend({
            idAttribute: "entity",
            defaults: {
                group: false,
                bits: 0
            }
        }),

        Permissions = Backbone.Collection.extend({
            model: Permission
        }),

        PermissionsView = Backbone.View.extend({

            className: "permission row-fluid",

            events: {
                'click a.bit': 'updateDropdown',
                'click a.role': 'applyRole',
                'click .remove': 'removeEntity'
            },

            render: function () {
                var baton = ext.Baton({ model: this.model, view: this, admin: this.options.admin });
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
                    value   = $el.attr('data-value'),
                    link    = $el.parent().parent().parent().children('a'),
                    type    = link.attr('data-type'),
                    newbits = api.Bitmask(this.model.get('bits')).set(type, value).get();
                link.text($el.text());
                this.model.set('bits', newbits);
                this.updateRole();
            },

            applyRole: function (e) {
                var node = $(e.target), bits = node.attr('data-value');
                this.model.set('bits', parseInt(bits, 10));
                this.render();
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
                    baton.picture = contactsAPI.getPictureURLSync(user, { width: 64, height: 64, scaleType: 'cover' });
                    ext.point(POINT + '/entity').invoke('draw', self, baton);
                });
            }
        }
    });

    ext.point(POINT + '/entity').extend({
        index: 100,
        id: 'entityimage',
        draw: function (baton) {
            if (baton.picture) {
                this.append(
                    $('<div class="pull-left contact-picture">')
                    .css('background-image', 'url(' + baton.picture + ')')
                );
            } else {
                this.append(
                    $('<div class="pull-left contact-picture group">').append(
                        $('<i class="icon-group">')
                    )
                );
            }
        }
    });

    ext.point(POINT + '/entity').extend({
        index: 200,
        id: 'entitysentence',
        draw: function (baton) {
            var node;
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
            if (baton.admin) {
                node.append(
                    $('<div class="readwrite">').append(
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
                            addDropdown('admin', baton), $.txt(_.noI18n('. '))
                    ),
                    addRemoveButton(baton.model.get('entity'))
                );
            } else {
                node.append(
                    $('<div class="readonly">').append(
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
                            addDropdown('admin', baton), $.txt(_.noI18n('. '))
                    )
                );
            }
            baton.view.updateRole();
        }
    });

    addRemoveButton = function (entity) {
        if (isFolderAdmin && entity !== ox.user_id)
            return $('<div class="remove">').append($('<div class="icon">').append($('<i class="icon-remove">')));
    };

    addDropdown = function (permission, baton) {
        var bits = baton.model.get('bits'),
            selected = api.Bitmask(bits).get(permission),
            menu;
        // folder fix
        if (permission === 'folder' && selected === 0) selected = 1;
        if (!isFolderAdmin) {
            return $('<i>').text(menus[permission][selected]);
        }
        menu = $('<span class="dropdown">').append(
            $('<a href="#" data-toggle="dropdown">').attr('data-type', permission).text(menus[permission][selected]),
            $('<ul class="dropdown-menu">')
        );
        _(menus[permission]).each(function (item, value) {
            if (value === '64') return true; // Skip maximum rights
            menu.find('ul').append(
                $('<li>').append(
                    $('<a>', { href: '#', 'data-value': value }).addClass('bit').text(item)
                )
            );
        });
        return menu;
    };

    addRoles = function (baton) {
        if (!isFolderAdmin) return $();
        return $('<span class="dropdown preset">').append(
            $('<a href="#" data-type="permission" data-toggle="dropdown">'),
            $('<ul class="dropdown-menu">').append(
                _(presets).map(function (obj) {
                    return $('<li>').append(
                        $('<a>', { href: '#', 'data-value': obj.bits }).addClass('role').text(obj.label)
                    );
                })
            )
        );
    };

    return {
        show: function (folder) {
            folder_id = String(folder);
            api.get({ folder: folder_id, cache: false }).done(function (data) {
                try {

                    isFolderAdmin = api.Bitmask(data.own_rights).get('admin') >= 1;

                    // Check if ACLs enabled and only do that for mail component,
                    // every other component will have ACL capabilities (stored in DB)
                    if (data.module === 'mail' && !(data.capabilities & Math.pow(2, 0))) {
                        isFolderAdmin = false;
                    }

                    var dialog = new dialogs.ModalDialog({
                        width: 800
                    })
                    .header(
                        api.getBreadcrumb(data.id, { subfolders: false, prefix: gt('Folder permissions') })
                    );

                    // mail folders show up with "null"
                    var owner = data.created_by || ox.user_id;

                    collection.on('reset', function () {
                        var node = dialog.getContentNode().empty();
                        this.each(function (model) {
                            new PermissionsView({ model: model, collection: this, owner: owner, admin: isFolderAdmin })
                            .render().$el.appendTo(node);
                        }, this);
                    });

                    collection.on('add', function (model, collection) {
                        var node = dialog.getContentNode();
                        new PermissionsView({ model: model, collection: collection, owner: owner, admin: isFolderAdmin })
                        .render().$el.appendTo(node);
                    });

                    // get all users to preload
                    var ids = _.chain(data.permissions)
                        .filter(function (obj) { return obj.group === false; })
                        .pluck('entity')
                        .value();

                    dialog.getContentNode().busy();

                    userAPI.getList(ids, true, { allColumns: true }).done(function (list) {
                        // stop being busy
                        dialog.getContentNode().idle();
                        // draw users
                        collection.reset(_(data.permissions).map(function (obj) {
                            return new Permission(obj);
                        }));
                    });

                    if (isFolderAdmin) {

                        dialog.addPrimaryButton('save', gt('Save')).addButton('cancel', gt('Cancel'));

                        var node =  $('<div class="autocomplete-controls input-append">').append(
                                $('<input type="text" class="add-participant permissions-participant-input-field">'),
                                $('<button class="btn" type="button" data-action="add">')
                                    .append($('<i class="icon-plus">'))
                            ),
                            autocomplete = new AddParticipantsView({ el: node });

                        autocomplete.render({
                            autoselect: true,
                            parentSelector: '.permissions-dialog > .modal-footer',
                            placement: 'top',
                            contacts: false,
                            distributionlists: false,
                            groups: true,
                            resources: false,
                            users: true
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
                        dialog.getFooter().prepend(node);
                    } else {
                        dialog.addPrimaryButton('ok', gt('Close'));
                    }
                    dialog.getPopup().addClass('permissions-dialog');
                    dialog.show(function () {
                        this.find('input').focus();
                    })
                    .done(function (action) {
                        if (isFolderAdmin && action === 'save') {
                            api.update({ folder: folder_id, changes: { permissions: collection.toJSON() }}).always(function () {
                                collection.off();
                            });
                        } else if (action === 'cancel' || action === 'ok') {
                            collection.off();
                        }
                    });
                } catch (e) {
                    console.error('Error', e);
                }
            });
        }
    };
});
