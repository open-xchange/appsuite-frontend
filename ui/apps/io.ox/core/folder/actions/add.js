/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/folder/actions/add', [
    'io.ox/core/folder/api',
    'io.ox/core/tk/dialogs',
    'io.ox/core/extensions',
    'io.ox/core/notifications',
    'io.ox/core/capabilities',
    'gettext!io.ox/core'
], function (api, dialogs, ext, notifications, capabilities, gt) {

    'use strict';

    /**
     * @param folder {string} (optional) folder id
     * @param title {string} (optional) title
     * @param opt {object} (optional) options object can contain only
     * a module name, for now
     */
    function add(folder, title, opt) {

        opt = opt || {};

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
        return api.create(folder, {
            title: $.trim(title),
            module: opt.module
        })
        .fail(notifications.yell);
    }

    function getTitle(folder, module) {
        return module === 'calendar' ? gt('Add new calendar') : gt('Add new folder');
    }

    function getName(module) {
        return module === 'calendar' ? gt('New calendar') : gt('New folder');
    }

    function open(folder, opt) {

        new dialogs.ModalDialog({
            async: true,
            width: 400,
            enter: 'add',
            help: 'ox.appsuite.user.sect.dataorganisation.folder.create.html#ox.appsuite.user.concept.folder.create'
        })
        .header(
            $('<h4>').text(getTitle(folder, opt.module))
        )
        .build(function () {

            var guid = _.uniqueId('label_'),
                label = opt.module === 'calendar' ? gt('Add as public calendar') : gt('Add as public folder');

            this.getContentNode().append(
                // name
                $('<div class="form-group">').append(
                    $('<label class="sr-only">').text(gt('Folder name')).attr('for', guid),
                    $('<input type="text" name="name" class="form-control">').attr({ id: guid, placeholder: gt('Folder name') })
                )
            );

            if (opt.supportsPublicFolders) {
                this.getContentNode().append(
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
        .addPrimaryButton('add', gt('Add'))
        .addButton('cancel', gt('Cancel'))
        .on('add', function () {
            var node = this.getContentNode(),
                name = node.find('input[name="name"]').val(),
                isPublic = node.find('input[name="public"]').prop('checked');
            add(isPublic ? '2' : folder, name, opt).then(this.close, this.idle);
        })
        .show(function () {
            this.find('input[name="name"]').val(getName(opt.module)).focus().select();
        });
    }

    /**
     * @param folder {string} (optional) folder id
     * @param opt {object} (optional) options object - will be forwarded
     * to folder API
     */
    return function (folder, opt) {

        if (!folder) return;

        folder = String(folder);
        opt = opt || {};

        if (/^(contacts|calendar|tasks)$/.test(opt.module) && capabilities.has('edit_public_folders')) {
            // only address book, calendar, and tasks do have a "public folder" section
            api.get('2').done(function (public_folder) {
                opt.supportsPublicFolders = api.can('create:folder', public_folder);
                open(folder, opt);
            });
        } else {
            open(folder, opt);
        }
    };
});
