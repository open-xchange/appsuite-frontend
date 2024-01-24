/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
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

define('io.ox/core/permissions/permissions', [
    'io.ox/core/extensions',
    'io.ox/core/notifications',
    'io.ox/core/folder/breadcrumb',
    'io.ox/core/folder/api',
    'io.ox/core/api/user',
    'io.ox/core/api/group',
    'io.ox/contacts/api',
    'io.ox/core/tk/dialogs',
    'io.ox/contacts/util',
    'io.ox/core/tk/typeahead',
    'io.ox/core/settings/util',
    'io.ox/participants/model',
    'io.ox/participants/views',
    'gettext!io.ox/core',
    'less!io.ox/core/permissions/style'
], function (ext, notifications, BreadcrumbView, api, userAPI, groupAPI, contactsAPI, dialogs, contactsUtil, Typeahead, settingsUtil, pModel, pViews, gt) {

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
            // view folder + read all
            { label: gt('Guest'), bits: 257 },
            // create folder + read/write/delete all
            { label: gt('Author'), bits: 4227332 },
            // plus admin
            { label: gt('Administrator'), bits: 272662788 }
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

            initialize: function (options) {

                this.options = options;

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
                    newbits = api.Bitmask(this.model.get('bits')).set(type, value).get();
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
                        baton.user,
                        { width: 64, height: 64 }
                    )
                );
            } else {
                this.append(
                    $('<div class="pull-left contact-picture group">').append(
                        $('<i class="fa fa-group" aria-hidden="true">')
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
                        $('<span class="name">').text(baton.name),
                        baton.model.get('entity') === baton.view.options.owner ? $('<span class="owner">').text(gt('Owner')) : $(),
                        // quick change
                        addRoles(baton)
                    )
                )
            );

            options = $('<div>').append(
                // folder rights
                gt('Folder permissions'), $.txt(': '),
                addDropdown('folder', baton), $.txt('. '),
                // object rights
                gt('Object permissions'), $.txt(': '),
                addDropdown('read', baton), $.txt(', '),
                addDropdown('write', baton), $.txt(', '),
                addDropdown('delete', baton), $.txt('. '),
                // admin
                gt('The user has administrative rights'), $.txt(': '),
                addDropdown('admin', baton), $.txt('. '));
            if (baton.admin) {
                options.addClass('readwrite');
            } else {
                options.addClass('readonly');
                //disable dropdown
                options.find('span.dropdown a').attr({ 'aria-haspopup': false, 'data-toggle': null, 'disabled': 'disabled' });
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
            return $('<a href="# "data-action="remove">').append($('<i class="fa fa-trash-o" aria-hidden="true">'));
        }
        return $();
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
            $('<a href="#" aria-haspopup="true" data-toggle="dropdown">')
                .attr('data-type', permission).text(menus[permission][selected]),
            ul = $('<ul class="dropdown-menu" role="menu">')
        );
        _(menus[permission]).each(function (item, value) {
            // Skip maximum rights
            if (value === '64') return true;
            ul.append(
                $('<li>').append(
                    $('<a href="#" role="menuitem" class="bit">').attr('data-value', value).text(item)
                )
            );
        });
        return menu;
    };

    addRoles = function (baton) {
        if (!isFolderAdmin) return $();
        return $('<span class="dropdown preset">').append(
            $('<a href="#" data-type="permission" data-toggle="dropdown" aria-haspopup="true">'),
            $('<ul class="dropdown-menu" role="menu">').append(
                _(presets).map(function (obj) {
                    if (preventAdminPermissions('admin', baton) && obj.bits === 272662788) return;
                    return $('<li>').append(
                        $('<a href="#" role="menuitem" class="role">').attr('data-value', obj.bits).text(obj.label)
                    );
                })
            )
        );
    };

    return {
        show: function (folder) {
            var promise = $.Deferred();
            folder_id = String(folder);
            api.get(folder_id, { cache: false }).done(function (data) {
                try {

                    isFolderAdmin = api.Bitmask(data.own_rights).get('admin') >= 1;

                    // Check if ACLs enabled and only do that for mail component,
                    // every other component will have ACL capabilities (stored in DB)
                    if (data.module === 'mail' && !(data.capabilities & Math.pow(2, 0))) {
                        isFolderAdmin = false;
                    }

                    var options = { top: 60, width: 800, center: false, maximize: true, async: true, help: 'ox.appsuite.user.sect.dataorganisation.sharing.invitation.html' };
                    if (_.device('!desktop')) {
                        options = { top: '40px', center: false, async: true };
                    }
                    var dialog = new dialogs.ModalDialog(options);
                    dialog.getHeader().append(
                        $('<h4>').text(gt('Folder permissions')),
                        new BreadcrumbView({ folder: data.id }).render().$el
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
                        .value(),
                        cascadeModel = new Backbone.Model({ cascadePermissionsFlag: false });

                    dialog.getContentNode().addClass('scrollpane').busy();

                    if (isFolderAdmin) {
                        if (_.device('desktop')) {
                            dialog.addPrimaryButton('save', gt('Save'), 'save').addButton('cancel', gt('Cancel'), 'cancel');
                        }

                        /*
                         * extension point for autocomplete item
                         */
                        ext.point('io.ox/core/permissions/permissions/autoCompleteItem').extend({
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

                        var checkboxNode = $('<div>').addClass('checkbox control-group cascade').append(
                                settingsUtil.checkbox('cascadePermissions', gt('Apply to all subfolders'), cascadeModel).on('change', function (e) {
                                    var input = e.originalEvent.srcElement;
                                    cascadeModel.set('cascadePermissionsFlag', input.checked);
                                })
                            ),
                            view = new Typeahead({
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
                                    data = _(data).filter(function (model) {
                                        return !collection.get(model.id);
                                    });
                                    // wait for participant models to be fully loaded (autocomplete suggestions might have missing values otherwise)
                                    return $.when.apply($, _(data).pluck('loading')).then(function () { return data; });
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
                                        collection.add(new Permission(obj));
                                    }
                                },
                                extPoint: 'io.ox/core/permissions/permissions'
                            }),
                            guid = _.uniqueId('input'),
                            node =  $('<div class="autocomplete-controls">').append(
                                $('<div class="form-group">').append(
                                    $('<label class="sr-only">', { 'for': guid }).text(gt('Start typing to search for user names')),
                                    view.$el.attr({ id: guid })
                                )
                            );
                        view.render();
                        if (_.device('desktop')) {
                            dialog.getHeader().append(node);
                            dialog.getFooter().prepend(checkboxNode);
                        } else {
                            dialog.getHeader().append(node, checkboxNode);
                        }

                    } else {
                        dialog.addPrimaryButton('cancel', gt('Close'));
                    }

                    dialog.getPopup().addClass('permissions-dialog');
                    dialog.on('save', function () {
                        if (!isFolderAdmin) {
                            promise.reject();
                            return dialog.idle();
                        }
                        api.update(folder_id, { permissions: collection.toJSON() }, { cascadePermissions: cascadeModel.get('cascadePermissionsFlag') }).then(
                            function success() {
                                collection.off();
                                dialog.close();
                                promise.resolve();
                            },
                            function fail(error) {
                                dialog.idle();
                                notifications.yell(error);
                                promise.reject();
                            }
                        );
                    })
                    .on('cancel', function () {
                        collection.off();
                        promise.reject();
                    })
                    .show();

                    // load user data after opening the dialog
                    userAPI.getList(ids, true, { allColumns: true }).done(function () {
                        // stop being busy
                        dialog.getContentNode().idle();
                        // draw users
                        collection.reset(_(data.permissions).map(function (obj) {
                            return new Permission(obj);
                        }));
                        dialog.getPopup().find('[tabindex="0"]:first').focus();
                    });

                } catch (e) {
                    console.error('Error', e);
                }
            });
            return promise;
        }
    };
});
