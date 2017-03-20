/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
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
            help: 'ox.appsuite.user.sect.dataorganisation.folder.create.html#ox.appsuite.user.concept.folder.create',
            point: 'io.ox/core/folder/add-popup',
            width: 400
        })
        .inject({
            addFolder: addFolder,
            getTitle: function () {
                var module = this.context.module;
                if (module === 'calendar') return gt('Add new calendar');
                else if (module === 'contacts') return gt('Add new address book');
                return gt('Add new folder');
            },
            getName: function () {
                var module = this.context.module;
                if (module === 'calendar') return gt('New calendar');
                else if (module === 'contacts') return gt('New address book');
                return gt('New folder');
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
                        $('<label class="sr-only">').text(gt('Folder name')).attr('for', guid),
                        $('<input type="text" name="name" class="form-control">').attr({ id: guid, placeholder: gt('Folder name') })
                    )
                );
            },
            checkbox: function () {

                if (!this.context.supportsPublicFolders) return;

                var label = this.context.module === 'calendar' ? gt('Add as public calendar') : gt('Add as public folder');

                this.$body.append(
                    // public
                    $('<div class="form-group checkbox">').append(
                        // checkbox
                        $('<label>').append(
                            $('<input type="checkbox" name="public">'),
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
                    .then(this.close, this.idle);
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

        if (!folder || !opt.module) return $.when().reject();

        // only address book, calendar, and tasks do have a "public folder" section
        var hasPublic = /^(contacts|calendar|tasks)$/.test(opt.module) && capabilities.has('edit_public_folders');

        // resolves with created folder-id
        return $.when(hasPublic ? api.get('2') : undefined)
                .then(function (public_folder) {
                    if (public_folder) opt.supportsPublicFolders = api.can('create:folder', public_folder);
                    // returns deferred
                    return open(String(folder), opt);
                });
    };
});
