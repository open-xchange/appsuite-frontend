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
    ['io.ox/core/api/folder',
     'io.ox/core/api/user',
     'io.ox/core/tk/dialogs',
     'gettext!io.ox/core',
     'less!io.ox/core/permissions/permissions.less'], function (api, userAPI, dialogs, gt) {

    'use strict';
    var menus = {
        'folder': {
            0:  gt("not view"),
            1:  gt("only view"),
            2:  gt("create objects"),
            4:  gt("create objects and subfolders"),
            64: gt("create objects and subfolders")
        },
        'read': {
            0:  gt("not read"),
            1:  gt("read only own"),
            2:  gt("read all"),
            64: gt("read all")
        },
        'write': {
            0:  gt("not modify"),
            1:  gt("modify only own"),
            2:  gt("modify all"),
            64: gt("modify all")
        },
        'delete': {
            0:  gt("not delete"),
            1:  gt("delete only own"),
            2:  gt("delete all"),
            64: gt("delete all")
        },
        'admin': {
            0:  gt("No"),
            1:  gt("Yes")
        }
    },
    addDropdown,
    createDialog,
    folderPermissions,
    initPermissionsDialog = function (e) {
        var folder = String(e.data.app.folderView.selection.get());
        api.get({ folder: folder }).done(function (folder) {
            createDialog(folder, folderPermissions(folder));
        });
    };

    createDialog = function (folder, content) {
        var dialog = new dialogs.ModalDialog({
            width: 800,
            easyOut: true
        })
        .header(
            $('<h4>').text(gt('Set folder permissions')),
            api.getBreadcrumb(folder.id, { subfolders: false })
        )
        .build(function () {
            this.getContentNode().append(
                $('<div class="row-fluid">').append(
                    content
                )
            );
        })
        .addButton('cancel', gt('Cancel'))
        .addPrimaryButton('add', gt('Save'));

        dialog.getPopup()
            .find('.modal-header').addClass('clearfix')
            .children('h4').addClass('pull-left').end()
            .children('ul').addClass('pull-right');

        dialog.show(function () {
            this.find('input').focus();
        })
        .done(function (action) {
            if (action === 'add') {
            }
        });
    };

    folderPermissions = function (folder) {
        var users = [],
        permissions = folder.permissions;
        _(permissions).each(function (permission) {
            var def = $.Deferred(),
            d = $('<div class="userpermission row-fluid">');
            if (!permission.group)
            {
                userAPI.getPictureURL(permission.entity).done(function (picture) {
                    d.append($('<img>', { src: picture, 'class': 'pull-left contact-image' }));
                });
                userAPI.getName(permission.entity).done(function (user) {
                    d.append(
                        $('<div class="name">').append(gt.noI18n(user)),
                            gt('The user can '),
                            addDropdown('folder', permission.bits),
                            gt.noI18n(', '),
                            addDropdown('read', permission.bits),
                            gt.noI18n(', '),
                            addDropdown('write', permission.bits),
                            gt.noI18n(' and '),
                            addDropdown('delete', permission.bits)
                    ).data('permissions', permission);
                });
            }
            def.done(users.push(d));
        });
        return users;
    };

    addDropdown = function (permission, bits) {
        var selected = api.Bitmask(bits).get(permission),
        menu = $('<span class="dropdown">').append(
            $('<a>', { 'data-val': bits, 'data-toggle': 'dropdown' }).text(menus[permission][selected]),
            $('<ul class="dropdown-menu">')
        );

        _(menus[permission]).each(function (item, value) {
            menu.find('ul').append(
                $('<li>').append(
                    $('<a href="#">', { 'data-val': value })
                        .text(item).on('click', function () {
                            var data = $(this).closest('.userpermission').data();
                        })
                )
            );
        });
        return menu;
    };

    return {
        initPermissionsDialog: initPermissionsDialog
    };
});
