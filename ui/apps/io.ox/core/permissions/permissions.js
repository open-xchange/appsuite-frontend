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
     'io.ox/core/api/folder',
     'io.ox/core/api/user',
     'io.ox/core/api/group',
     'io.ox/core/tk/dialogs',
     'io.ox/contacts/util',
     'io.ox/calendar/edit/view-addparticipants',
     'gettext!io.ox/core',
     'less!io.ox/core/permissions/style.css'], function (ext, api, userAPI, groupAPI, dialogs, util, AddParticipantsView, gt) {

    'use strict';

    var POINT = 'io.ox/core/permissions',

    folder_id,

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
            'click .dropdown > ul li a': 'updateDropdown',
            'click .remove'  : 'removeEntity'
        },

        render: function () {

            ext.point(POINT + '/detail').invoke('draw', this.$el, this.model);
            return this;

        },

        removeEntity: function () {
            console.log('remove');
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
        }
    }),

    collection = window.collection = new Permissions(),

    menus = {
        'folder': {
            0:  gt('not view'),
            1:  gt('only view'),
            2:  gt('create objects'),
            4:  gt('create objects and subfolders'),
            64: gt('create objects and subfolders')
        },
        'read': {
            0:  gt('not read'),
            1:  gt('read only own'),
            2:  gt('read all'),
            64: gt('read all')
        },
        'write': {
            0:  gt('not modify'),
            1:  gt('modify only own'),
            2:  gt('modify all'),
            64: gt('modify all')
        },
        'delete': {
            0:  gt('not delete'),
            1:  gt('delete only own'),
            2:  gt('delete all'),
            64: gt('delete all')
        },
        'admin': {
            0:  gt('No'),
            1:  gt('Yes')
        }
    },
    addDropdown,
    addRemoveButton,
    isFolderAdmin = false;

    ext.point(POINT + '/detail').extend({
        index: 100,
        id: 'folderpermissions',
        draw: function (model) {
            var self = this;
            var entity = model.get('entity');
            if (!model.get('group')) {
                $.when(
                    userAPI.getName(entity),
                    userAPI.getPictureURL(entity, { width: 64, height: 64, scaleType: 'cover' })
                )
                .done(function (name, picture) {
                    ext.point(POINT + '/entity').invoke('draw', self, { model: model, picture: picture, entity: name });
                });
            } else {
                $.when(
                    groupAPI.getTextNode(entity)
                )
                .done(function (entity) {
                    ext.point(POINT + '/entity').invoke('draw', self, { model: model, entity: entity });
                });
            }

        }
    });

    ext.point(POINT + '/entity').extend({
        index: 100,
        id: 'entityimage',
        draw: function (data) {
            if (data.picture) {
                this.append(
                    $('<div class="pull-left contact-picture">')
                    .css('background-image', 'url(' + data.picture + ')')
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
        draw: function (data) {
            this.append(
                $('<div class="entity">').append(
                    $('<div class="name">').append(gt.noI18n(data.entity)),
                    $('<div>').append(
                        gt('The user can '),
                        addDropdown('folder', data),
                        gt.noI18n(', '),
                        addDropdown('read', data),
                        gt.noI18n(', '),
                        addDropdown('write', data),
                        gt(' and '),
                        addDropdown('delete', data),
                        gt(' objects.')
                    ),
                    $('<div>').append(
                        gt('Folder admin: '),
                        addDropdown('admin', data),
                        gt.noI18n('.')
                    ),
                    addRemoveButton(data.model.get('entity'))
                )
            );
        }
    });

    addRemoveButton = function (entity) {
        if (isFolderAdmin && entity !== ox.user_id)
            return $('<div class="remove">').append($('<div class="icon">').append($('<i class="icon-remove">')));
    };

    addDropdown = function (permission, data) {
        var self = this,
        bits = data.model.get('bits'),
        selected = api.Bitmask(bits).get(permission),
        menu = $('<span class="dropdown">').append(
            $('<a>', { href: '#', 'data-type': permission, 'data-toggle': 'dropdown' }).text(menus[permission][selected]),
            $('<ul class="dropdown-menu">')
        );
        if (!isFolderAdmin) {
            return menus[permission][selected];
        }
        _(menus[permission]).each(function (item, value) {
            if (value === '64') return true; // Skip maximum rights
            menu.find('ul').append(
                $('<li>').append(
                    $('<a>', { href: '#', 'data-value': value }).text(item)
                )
            );
        });
        return menu;
    };

    return {
        show: function (folder) {
            folder_id = String(folder);
            api.get({ folder: folder_id }).done(function (data) {
                try {
                    isFolderAdmin = api.Bitmask(data.own_rights).get('admin') >= 1;

                    var dialog = new dialogs.ModalDialog({
                        width: 800,
                        easyOut: true
                    })
                    .header(
                        $('<h4>').text(gt('Folder permissions')),
                        api.getBreadcrumb(data.id, { subfolders: false })
                    );

                    if (isFolderAdmin) {
                        dialog.addButton('cancel', gt('Cancel'))
                            .addPrimaryButton('save', gt('Save'));

                        var node =  $('<div class="autocomplete-controls input-append">').append(
                                $('<input type="text" class="add-participant permissions-participant-input-field">'),
                                $('<button class="btn" type="button" data-action="add">')
                                    .append($('<i class="icon-plus">'))
                        ),
                        autocomplete = new AddParticipantsView({el: node});
                        collection.on('reset', function () {
                            var node = dialog.getContentNode().empty();
                            this.each(function (model) {
                                new PermissionsView({ model: model, collection: this }).render().$el.appendTo(node);
                            }, this);
                        });

                        collection.on('add', function (model, collection) {
                            var node = dialog.getContentNode();
                            new PermissionsView({ model: model, collection: collection }).render().$el.appendTo(node);
                        });

                        collection.reset(_(data.permissions).map(function (obj) {
                            return new Permission(obj);
                        }));

                        autocomplete.render({
                            parentSelector: '.permissions-dialog > .modal-footer',
                            users: true,
                            contacts: false,
                            groups: true,
                            resources: false,
                            distributionlists: false
                        });

                        autocomplete.on('select', function (data) {
                            var obj = {
                                group: data.type === 2,
                                bits: 0,
                                entity: data.group ? data.id : data.internal_userid
                            };
                            if (!collection.any(function (item) { return item.entity === obj.entity; })) {
                                collection.add(new Permission(obj));
                            }
                        });
                        dialog.getFooter().prepend(node);

                    } else {
                        dialog.addPrimaryButton('ok', gt('Ok'));
                    }

                    dialog.getPopup().addClass('permissions-dialog');
                    dialog.show(function () {
                        this.find('input').focus();
                    })
                    .done(function (action) {
                        if (isFolderAdmin && action === 'save') {
                            api.update({ folder: folder_id, changes: { permissions: collection.toJSON() }}).done(function () {
                                collection.off();
                            });
                        } else if (action === 'cancel') {
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