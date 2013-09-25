/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/folder/add',
    ['io.ox/core/api/folder',
     'io.ox/core/tk/dialogs',
     'io.ox/core/extensions',
     'io.ox/core/notifications',
     'gettext!io.ox/core'
    ], function (api, dialogs, ext, notifications, gt) {

    'use strict';

    /**
     * @param folder {string} (optional) folder id
     * @param title {string} (optional) title
     * @param opt {object} (optional) options object can contain only
     * a module name, for now
     */
    function add(folder, title, opt) {

        var opt = opt || {}, invalid = false;

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
        return api.create({
            folder: folder,
            data: {
                title: $.trim(title),
                module: opt.module
            }
        });
    }

    /**
     * @param folder {string} (optional) folder id
     * @param opt {object} (optional) options object - will be forwarded
     * to folder API
     */
    return function (folder, opt) {

        if (!folder) return;
        opt = opt || {};

        new dialogs.ModalDialog({
            async: true,
            width: 400,
            enter: 'add'
        })
        .header(
            $('<h4>').text(folder === '2' ? gt('New public folder') : gt('New folder'))
        )
        .build(function () {

            var showBreadCrumb = (opt.module === 'mail' && folder !== '1') || opt.module === 'infostore';

            this.getContentNode().append(
                $('<div class="row-fluid">').append(
                    showBreadCrumb ? api.getBreadcrumb(folder, { subfolders: false }) : [],
                    $('<input type="text" class="span12">').attr('placeholder', gt('Folder name'))
                )
            );
        })
        .addPrimaryButton('add', gt('Add folder'))
        .addButton('cancel', gt('Cancel'))
        .on('add', function () {
            add(folder, this.getContentNode().find('input').val(), opt)
                .then(this.close, this.idle);
        })
        .show(function () {
            this.find('input').val(gt('New folder')).focus().select();
        });
    };

});
