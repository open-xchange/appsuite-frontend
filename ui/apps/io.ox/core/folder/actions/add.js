/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
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

define('io.ox/core/folder/actions/add', [
    'io.ox/core/folder/api',
    'io.ox/backbone/views/modal',
    'io.ox/core/extensions',
    'io.ox/core/notifications',
    'io.ox/core/capabilities',
    'gettext!io.ox/core'
], function (api, ModalDialog, ext, notifications, capabilities, gt) {

    'use strict';

    /**
     * @param folder {string} (optional) folder id
     * @param title {string} (optional) title
     * @param opt {object} (optional) options object can contain only
     * a module name, for now
     */
    function addFolder(folder, module, title) {

        var invalid = false;

        // check for valid filename
        ext.point('io.ox/core/filename')
            .invoke('validate', null, title, 'folder')
            .find(function (result) {
                if (result !== true) {
                    notifications.yell('warning', result);
                    return (invalid = true);
                }
            });

        if (invalid) return $.Deferred().reject();

        // call API
        return api.create(folder, { title: $.trim(title), module: module })
            .fail(notifications.yell);
    }

    function open(folder, opt) {

        var def = $.Deferred();

        new ModalDialog({
            async: true,
            context: { folder: folder, module: opt.module, supportsPublicFolders: opt.supportsPublicFolders },
            enter: 'add',
            focus: 'input[name="name"]',
            previousFocus: $(document.activeElement),
            help: 'ox.appsuite.user.sect.dataorganisation.folder.html',
            point: 'io.ox/core/folder/add-popup',
            width: _.device('smartphone') ? window.innerWidth - 30 : 400
        })
        .inject({
            addFolder: addFolder,
            getTitle: function () {
                var module = this.context.module;
                if (module === 'event') return gt('Add new calendar');
                else if (module === 'contacts') return gt('Add new address book');
                return gt('Add new folder');
            },
            getName: function () {
                var module = this.context.module;
                if (module === 'event') return gt('New calendar');
                else if (module === 'contacts') return gt('New address book');
                return gt('New folder');
            },
            getLabel: function () {
                var module = this.context.module;
                if (module === 'event') return gt('Calendar name');
                else if (module === 'contacts') return gt('Address book name');
                return gt('Folder name');
            }
        })
        .extend({
            title: function () {
                this.$('.modal-title').text(this.getTitle());
            },
            name: function () {

                var guid = _.uniqueId('label_');

                this.$body.append(
                    // name
                    $('<div class="form-group">').append(
                        $('<label class="sr-only">').text(this.getLabel()).attr('for', guid),
                        $('<input type="text" name="name" class="form-control">').attr({ id: guid, placeholder: this.getName() })
                    )
                );
            },
            checkbox: function () {

                if (!this.context.supportsPublicFolders) return;

                var label = this.context.module === 'event' ? gt('Add as public calendar') : gt('Add as public folder');
                var guid = _.uniqueId('form-control-label-');
                this.$body.append(
                    // public
                    $('<div class="form-group checkbox">').append(
                        // checkbox
                        $('<label>').attr('for', guid).append(
                            $('<input type="checkbox" name="public">').attr('id', guid),
                            $.txt(label)
                        )
                    ),
                    // help
                    $('<div class="help-block">').text(
                        gt('A public folder is used for content that is of common interest for all users. ' +
                            'To allow other users to read or edit the contents, you have to set ' +
                            'the respective permissions for the public folder.'
                        )
                    )
                );
            }
        })
        .addCancelButton()
        .addButton({ action: 'add', label: gt('Add') })
        .on({
            add: function () {
                var name = this.$('input[name="name"]').val(),
                    isPublic = this.$('input[name="public"]').prop('checked');
                this.busy(true);
                this.addFolder(isPublic ? '2' : folder, this.context.module, name)
                    .then(def.resolve.bind(def))
                    .then(this.close, this.idle).fail(this.idle);
            },
            close: def.reject.bind(def),
            open: function () {
                this.$('input[name="name"]').val(this.getName()).focus().select();
            }
        })
        .open();

        return def;
    }

    /**
     * @param folder {string} (optional) folder id
     * @param opt {object} (optional) options object - will be forwarded
     * to folder API
     */
    return function (folder, opt) {
        opt = opt || {};

        if (!folder || !opt.module) return $.Deferred().reject();

        // only address book, calendar, and tasks do have a "public folder" section
        var hasPublic = /^(contacts|event|tasks)$/.test(opt.module) && capabilities.has('edit_public_folders');

        // resolves with created folder-id
        return $.when(hasPublic ? api.get('2') : undefined)
                .then(function (public_folder) {
                    if (public_folder) opt.supportsPublicFolders = api.can('create:folder', public_folder);
                    // returns deferred
                    return open(String(folder), opt);
                });
    };
});
