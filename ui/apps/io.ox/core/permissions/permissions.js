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
     'gettext!io.ox/core',
     'less!io.ox/core/permissions/style.css'], function (ext, api, userAPI, groupAPI, dialogs, gt) {

    'use strict';

    var POINT = 'io.ox/core/permissions',
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
    setPermission,
    isFolderAdmin = false;

    ext.point(POINT).extend({
        index: 100,
        id: 'dialog',
        draw: function (folder) {
            if (api.Bitmask(folder.own_rights).get('admin') === 1) {
                isFolderAdmin = true;
            }
            else
            {
                isFolderAdmin = false;
            }
            var dialog = new dialogs.ModalDialog({
                width: 800,
                easyOut: true
            })
            .header(
                $('<h4>').text(gt('Folder permissions')),
                api.getBreadcrumb(folder.id, { subfolders: false })
            )
            .build(function () {
                ext.point(POINT + '/detail').invoke('draw', this.getContentNode(), folder);

                this.getContentNode().on('click', '.remove', function (e) {
                    $(this).closest('.permission').remove();
                });
            });


            if (isFolderAdmin) {
                dialog.addButton('cancel', gt('Cancel'))
                    .addPrimaryButton('save', gt('Save'));
            }
            else
            {
                dialog.addPrimaryButton('ok', gt('Ok'));
            }
            dialog.getPopup().addClass('permissions-dialog');

            dialog.show(function () {
                this.find('input').focus();
            })
            .done(function (action) {
                if (isFolderAdmin && action === 'save') {
                    var permissions = _.map($(this).find('.permission'), function (p) { return $(p).data(); });
                    setPermission(folder, permissions);
                }
            });
        }
    });

    ext.point(POINT + '/detail').extend({
        index: 100,
        id: 'folderpermissions',
        draw: function (folder) {
            var entities = [];
            _(folder.permissions).each(function (permission) {

                var def = $.Deferred(),
                d = $('<div class="permission row-fluid">');

                if (!permission.group) {
                    $.when(
                        userAPI.getName(permission.entity),
                        userAPI.getPictureURL(permission.entity, { width: 64, height: 64, scaleType: 'cover' })
                    )
                    .done(function (entity, picture) {
                        ext.point(POINT + '/entity').invoke('draw', d, {
                            permission: permission,
                            folder: folder,
                            entity: entity,
                            picture: picture
                        });
                    });
                }
                else
                {
                    $.when(
                        groupAPI.getTextNode(permission.entity)
                    )
                    .done(function (entity) {
                        ext.point(POINT + '/entity').invoke('draw', d, {
                            permission: permission,
                            folder: folder,
                            entity: entity,
                            picture: false
                        });
                    });
                }

                def.done(entities.push(d));
            });
            this.append(
                $('<div class="permissions row-fluid">').append(entities)
            );
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
                    addRemoveButton(data.permission)
                )
            );
            // attach data to parent
            this.data(data.permission);
        }
    });

    addRemoveButton = function (permission) {
        if (isFolderAdmin && permission.entity !== ox.user_id)
            return $('<div class="remove">').append($('<div class="icon">').append($('<i class="icon-remove">')));
    };

    addDropdown = function (permission, data) {

        var self = this,
        bits = data.permission.bits,
        selected = api.Bitmask(bits).get(permission),
        menu = $('<span class="dropdown">').append(
            $('<a>', { 'data-val': bits, 'data-toggle': 'dropdown' }).text(menus[permission][selected]),
            $('<ul class="dropdown-menu">')
        );
        if (!isFolderAdmin) {
            return menus[permission][selected];
        }
        _(menus[permission]).each(function (item, value) {
            if (value === '64') return true; // Skip maximum rights
            menu.find('ul').append(
                $('<li>').append(
                    $('<a>', { 'data-val': value }).text(item)
                        .on('click', function () {
                            var data = $(this).closest('.permission').data(),
                            newdata = api.Bitmask(data.bits).set(permission, value).get();
                            $(this).closest('.permission').data('bits', newdata);
                            $(this).parent().parent().parent().children('a').text(item);
                        })
                )
            );
        });
        return menu;
    };

    setPermission = function (folder, permissions) {
        api.update({ folder: folder.id, changes: { permissions: permissions }});
    };

    return {
        initPermissionsDialog: function (e) {
            api.get({ folder: String(e.data.app.folderView.selection.get()) }).done(function (data) {
                ext.point(POINT).invoke("draw", null, data);
            });
        }
    };
});