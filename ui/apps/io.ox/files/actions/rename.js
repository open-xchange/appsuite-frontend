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
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/files/actions/rename', [
    'io.ox/files/legacy_api',
    'io.ox/core/extensions',
    'io.ox/core/tk/dialogs',
    'io.ox/files/util',
    'gettext!io.ox/files'
], function (api, ext, dialogs, util, gt) {

    'use strict';

    return function (data) {

        var filename = data.filename || data.title,
            $input;

        function rename(name) {
            var update = {
                    id: data.id,
                    folder_id: data.folder_id
                };
            // 'title only' entries
            if (!data.filename && data.title) {
                update.title = name;
            } else {
                update.filename = name;
            }

            return api.update(update).fail(notify);
        }

        // notifications lazy load
        function notify () {
            var self = this,
                args = arguments;
            require(['io.ox/core/notifications'], function (notifications) {
                notifications.yell.apply(self, args);
            });
        }

        /**
         * user have to confirm if name doesn't contains a file extension
         * @return { promise }
         */
        function process() {

            var name = $input.val().trim(),
                invalid;

            function adjust() {
                _.delay(function () {
                    $input.focus();
                }, 0);
            }

            // check for valid filename
            ext.point('io.ox/core/filename')
                .invoke('validate', null, name, 'file')
                .find(function (result) {
                    if (result !== true) {
                        notify('warning', result);
                        return (invalid = true);
                    }
                });

            if (invalid) return $.Deferred().reject();

            // show confirm dialog if necessary
            return util.confirmDialog(name, filename)
                .then(
                    rename.bind(this, name),
                    adjust
                );
        }

        new dialogs.ModalDialog({ enter: 'rename', async: true })
            .header(
                $('<h4>').text(gt('Rename'))
            )
            .append(
                $input = $('<input type="text" name="name" class="form-control" tabindex="1">')
            )
            .addPrimaryButton('rename', gt('Rename'), 'rename',  { 'tabIndex': '1' })
            .addButton('cancel', gt('Cancel'),  'cancel',  { 'tabIndex': '1' })
            .on('rename', function () {
                process().then(this.close, this.idle);
            })
            .show(function () {
                var dominput = _.first($input);
                $input.focus().val(filename);
                dominput.setSelectionRange(0, filename.lastIndexOf('.'));
            });

    };
});
