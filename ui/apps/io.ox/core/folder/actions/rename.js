/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/folder/actions/rename', [
    'io.ox/core/folder/api',
    'io.ox/core/tk/dialogs',
    'io.ox/core/extensions',
    'io.ox/core/yell',
    'gettext!io.ox/core'
], function (api, dialogs, ext, yell, gt) {

    'use strict';

    function handler(id, changes) {

        var invalid = false;

        // check for valid folder name
        ext.point('io.ox/core/filename')
            .invoke('validate', null, changes.title, 'folder')
            .find(function (result) {
                if (result !== true) {
                    yell('warning', result);
                    return (invalid = true);
                }
            });

        if (invalid) return $.Deferred().reject();

        return api.update(id, changes).fail(yell);
    }

    return function (id) {

        var model = api.pool.getModel(id);

        if (model.get('standard_folder')) {
            yell('error', gt('This is a standard folder, which can\'t be renamed.'));
            return;
        }

        new dialogs.ModalDialog({ async: true, width: 400, enter: 'rename' })
        .header(
            $('<h4>').text(gt('Rename folder'))
        )
        .build(function () {
            this.getContentNode().append(
                $('<form role="form">').append(
                    $('<input class="form-control">', { type: 'text' })
                    .val(model.get('title'))
                    .attr('placeholder', gt('Folder name'))
                )
            );
        })
        .addPrimaryButton('rename', gt('Rename'))
        .addButton('cancel', gt('Cancel'))
        .on('rename', function () {
            handler(id, { title: this.getContentNode().find('input').val() }).then(this.close, this.idle);
        })
        .show(function () {
            this.find('input').focus();
        });
    };
});
