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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/folder/actions/rename', [
    'io.ox/core/folder/api',
    'io.ox/backbone/views/modal',
    'io.ox/core/extensions',
    'io.ox/core/yell',
    'gettext!io.ox/core'
], function (api, ModalDialog, ext, yell, gt) {

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

        new ModalDialog({ title: gt('Rename folder'), async: true, width: 400, enter: 'rename' })
            .build(function () {
                this.$body.append(
                    this.$input = $('<input class="form-control" type="text">')
                        .attr({ placeholder: gt('Folder name'), 'aria-labelledby': this.$title.attr('id') })
                        .val(model.get('title'))
                );
            })
            .addCancelButton()
            .addButton({ label: gt('Rename'), action: 'rename' })
            .on('rename', function () { handler(id, { title: this.$input.val() }).then(this.close, this.idle); })
            .open();
    };
});
